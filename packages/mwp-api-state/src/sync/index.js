import { combineEpics } from '../redux-promise-epic';

import { LOCATION_CHANGE, SERVER_RENDER } from 'mwp-router';
import { getMatchedQueries } from 'mwp-router/lib/util';

import * as api from './apiActionCreators';
import {
	apiSuccess, // DEPRECATED
	apiError, // DEPRECATED
} from './syncActionCreators';

const IGNORE_ACTION = Promise.resolve([]);
/**
 * @deprecated
 */
export function getDeprecatedSuccessPayload(successes, errors) {
	const allQueryResponses = [...successes, ...errors];
	return allQueryResponses.reduce(
		(payload, { query, response }) => {
			if (!response) {
				return payload;
			}
			const { ref, error, ...responseBody } = response;
			if (error) {
				// old payload expects error as a property of `value`
				responseBody.value = { error };
			}
			payload.queries.push(query);
			payload.responses.push({ [ref]: responseBody });
			return payload;
		},
		{ queries: [], responses: [] }
	);
}

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
 * - API_SUCCESS  // deprecated
 * - API_COMPLETE
 *
 * or
 *
 * - API_RESP_FAIL
 * - API_ERROR  // deprecated
 * - API_COMPLETE
 */
export const getFetchQueriesEpic = (findMatches, fetchQueriesFn) => {
	// keep track of location changes - will first be set by SERVER_RENDER
	let locationIndex = 0;
	const standardizeUrl = location => {
		return findMatches(location).matched
			.pop()
			.match.path.replace(/[^a-zA-Z0-9/]/gi, '');
	};

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
		const {
			config,
			api: { self },
			routing: { location, referrer },
		} = store.getState();

		// clean up path for use as endpoint URL
		const standardizedUrlPath = standardizeUrl(location);
		const standardizedReferrerPath = standardizeUrl(referrer);
		// construct the fetch call using match.path
		const fetchUrl = `${config.apiUrl}${standardizedUrlPath}`;
		const fetchQueries = fetchQueriesFn(fetchUrl, (self || {}).value);

		// supply additional request info, e.g. for tracking
		const requestInfo = {
			standardized_url: standardizedUrlPath,
			standardized_referer: standardizedReferrerPath,
		};

		return fetchQueries(queries, meta, requestInfo)
			.then(({ successes = [], errors = [] }) => {
				// meta contains a Promise that must be resolved
				meta.resolve([...successes, ...errors]);
				const deprecatedSuccessPayload = getDeprecatedSuccessPayload(
					successes,
					errors
				);
				const deprecatedActions = [apiSuccess(deprecatedSuccessPayload)];
				if (meta && meta.onSuccess) {
					deprecatedActions.push(meta.onSuccess(deprecatedSuccessPayload));
				}
				return [
					...successes.map(api.success), // send the successes to success
					...errors.map(api.error), // send errors to error
					...deprecatedActions,
				];
			})
			.catch(err => {
				// meta contains a Promise that must be rejected
				meta.reject(err);
				const deprecatedActions = [apiError(err)];
				if (meta && meta.onError) {
					deprecatedActions.push(meta.onError(err));
				}
				return [api.fail(err), ...deprecatedActions];
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
