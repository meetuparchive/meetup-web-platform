import { combineEpics } from '../redux-promise-epic';

import { LOCATION_CHANGE, SERVER_RENDER } from 'mwp-router';
import { getMatchedQueries } from 'mwp-router/lib/util';

import * as api from './apiActionCreators';

const IGNORE_ACTION = Promise.resolve([]);

/**
 * Any operations that keep the browser application in sync with the
 * server should be implemented here.
 *
 * - Navigation-generated API request handling
 * - Arbitrary API request handling (syncActionCreators.apiSuccess)
 *
 * @module syncEpic
 */

/**
 * Navigation actions will provide the `location` as the payload, which this
 * epic will use to collect the current Reactive Queries associated with the
 * active routes.
 *
 * These queries will then be dispatched in the payload of `apiRequest`. Any
 * metadata about the navigation action can also be sent to the `apiRequest`
 * here.
 *
 * note that this function executes _downstream_ of reducers, so the
 * new `routing` data has already been populated in `state`
 *
 * @param {Object} routes The application's React Router routes
 * @returns {Function} an Epic function that emits an API_RESP_REQUEST action
 */
export const getNavEpic = findMatches => (action, store) => {
	if (![LOCATION_CHANGE, SERVER_RENDER].includes(action.type)) {
		return IGNORE_ACTION;
	}
	const { payload: location } = action;
	const state = store.getState();
	const { referrer = {} } = state.routing;
	// inject request metadata from context, including `store.getState()`
	const requestMetadata = {
		referrer: referrer.pathname || state.config.entryPath || '',
		logout: location.pathname.endsWith('logout'), // assume logout route ends with logout - not currently implemented in any app
		clickTracking: true, // clicks should be tracked with this request
		retainRefs: [],
	};
	const cacheAction = requestMetadata.logout && { type: 'CACHE_CLEAR' };

	const previousQueries = referrer.pathname
		? getMatchedQueries(referrer, state)(findMatches(referrer))
		: [];
	const newQueries = getMatchedQueries(location, state)(findMatches(location));
	if (newQueries.filter(q => q).length === 0) {
		// no valid queries - jump straight to 'complete'
		return [api.complete([])];
	}
	// perform a fast comparison of previous route's serialized queries
	// with the new route's serialized queries. All state refs for
	// _shared_ queries should be retained
	const serializedNew = newQueries.map(JSON.stringify);
	const serializedPrev = previousQueries.map(JSON.stringify);
	const sharedRefs = serializedPrev
		.filter(qJSON => serializedNew.includes(qJSON))
		.map(JSON.parse)
		.map(q => q.ref);
	requestMetadata.retainRefs = sharedRefs;

	return Promise.resolve(
		[cacheAction, api.get(newQueries, requestMetadata)].filter(a => a)
	);
};

/**
 * Old apiRequest maps directly onto new api.get
 * @deprecated
 */
export const apiRequestToApiReq = action =>
	action.type === 'API_REQUEST'
		? Promise.resolve([api.get(action.payload, action.meta)])
		: IGNORE_ACTION;

/**
 * Listen for API_REQ and generate response actions from fetch results
 *
 * emits
 * - 1 or more API_RESP_SUCCESS
 * - 1 or more API_RESP_ERROR
 * - API_COMPLETE
 *
 * or
 *
 * - API_RESP_FAIL
 * - API_COMPLETE
 */
export const getFetchQueriesEpic = (findMatches, fetchQueriesFn) => {
	// keep track of location changes - will first be set by SERVER_RENDER
	let locationIndex = 0;

	// set up a closure that will compare the partially-applied location to the current value
	// of `locationIndex` - if `locationIndex` has changed since `currentLocation`
	// was passed in, return an empty array instead of the supplied actions array
	// This is a way of ignoring API return values that happen after a location change
	const ignoreIfLocationChange = currentLocation => actions =>
		currentLocation === locationIndex ? actions : [];

	// return the epic
	return (action, store) => {
		if (action.type === LOCATION_CHANGE) {
			locationIndex = locationIndex + 1;
		}
		if (action.type !== api.API_REQ) {
			return IGNORE_ACTION;
		}
		const { payload: queries, meta } = action;
		// set up the fetch call to the app server
		const { config, api: { self }, routing: { location } } = store.getState();

		// first get the current route 'match' data
		const matched = findMatches(location);
		// clean up path for use as endpoint URL
		const apiPath = matched.pop().match.path.replace(/[^a-z0-9/]/gi, '');
		// construct the fetch call using match.path
		const fetchUrl = `${config.apiUrl}${apiPath}`;
		const fetchQueries = fetchQueriesFn(fetchUrl, (self || {}).value);
		return fetchQueries(queries, meta)
			.then(({ successes = [], errors = [] }) => {
				// meta contains a Promise that must be resolved
				meta.resolve([...successes, ...errors]);
				return [
					...successes.map(api.success), // send the successes to success
					...errors.map(api.error), // send errors to error
				];
			})
			.catch(err => {
				// meta contains a Promise that must be rejected
				meta.reject(err);
				return [api.fail(err)];
			})
			.then(ignoreIfLocationChange(locationIndex))
			.then(actions => [...actions, api.complete(queries)]);
	};
};

export default (findMatches, fetchQueriesFn) =>
	combineEpics(
		getNavEpic(findMatches),
		getFetchQueriesEpic(findMatches, fetchQueriesFn),
		apiRequestToApiReq
	);
