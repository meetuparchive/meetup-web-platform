import { Observable } from 'rxjs';
import { combineEpics } from 'redux-observable';
import * as api from '../actions/apiActionCreators';
import {
	apiSuccess,
	apiError,
	LOCATION_CHANGE
} from '../actions/syncActionCreators';
import { clearClick } from '../actions/clickActionCreators';
import { activeRouteQueries } from '../util/routeUtils';


const logoutQueryMatch = /[?&]logout(?:[=&]|$)/;
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
 * @param {Object} routes The application's React Router routes
 * @returns {Function} an Epic function that emits an API_REQUEST action
 */
export const getNavEpic = (routes, baseUrl) => {
	const findActiveQueries = activeRouteQueries(routes, baseUrl);
	let currentLocation = {};  // keep track of current route so that apiRequest can get 'referrer'
	return (action$, store) =>
		action$.ofType(LOCATION_CHANGE, '@@server/RENDER')
			.flatMap(({ payload }) => {
				// inject request metadata from context, including `store.getState()`
				const requestMetadata = {
					referrer: currentLocation.pathname || '',
					logout: logoutQueryMatch.test(payload.search),
					clickTracking: store.getState().clickTracking,
				};
				// now that referrer has been recorded, set new currentLocation
				currentLocation = payload;

				const activeQueries = findActiveQueries(payload);
				const actions = [api.requestAll(activeQueries, requestMetadata)];

				// emit cache clear _only_ when logout requested
				if (requestMetadata.logout) {
					actions.unshift({ type: 'CACHE_CLEAR' });
				}

				actions.push(clearClick());

				return Observable.from(actions);
			});
};

/**
 * Any action that should reload the API data should be handled here, e.g.
 * LOGIN_SUCCESS, which should force the app to reload in an 'authorized'
 * state
 *
 * Note: this action is only possible in the browser, not the server, so
 * `browserHistory` is safe to use here.
 */
export const locationSyncEpic = (action$, store) =>
	action$.ofType('LOGIN_SUCCESS')
		.ignoreElements()  // TODO: push window.location into history without querystring
		.map(() => ({ type: LOCATION_CHANGE, payload: window.location }));

/**
 * @deprecated
 */
function getDeprecatedSuccessPayload(successes, errors) {
	const allQueryResponses = [ ...successes, ...errors ];
	return allQueryResponses.reduce((payload, { query, response }) => {
		if (!response) {
			return payload;
		}
		const { ref, ...responseBody } = response;
		payload.queries.push(query);
		payload.responses.push({ [ref]: responseBody });
		return payload;
	}, { queries: [], responses: [] });
}
/**
 * Listen for actions that provide queries to send to the api - mainly
 * API_REQ
 *
 * emits
 * - 1 or more API_RESP_SUCCESS
 * - 1 or more API_RESP_ERROR
 * - API_SUCCESS
 * - API_COMPLETE
 *
 * or
 * - API_RESP_FAIL
 * - API_ERROR
 * - API_COMPLETE
 */
export const getFetchQueriesEpic = fetchQueriesFn => (action$, store) =>
	action$.ofType('API_REQUEST', api.API_REQ)
		.flatMap(({ payload, meta }) => {           // set up the fetch call to the app server
			const { config } = store.getState();
			const fetchQueries = fetchQueriesFn(config.apiUrl);
			return Observable.fromPromise(fetchQueries(payload, meta))  // call fetch
				.takeUntil(action$.ofType(LOCATION_CHANGE))  // cancel this fetch when nav happens
				.flatMap(({ successes=[], errors=[] }) => {
					const actions = [
						...successes.map(api.success),  // send the successes to success
						...errors.map(api.error),     // errors to error
					];
					/* BEGIN SUPPORT FOR DEPRECATED API_SUCCESS ACTION ///// */
					actions.push(apiSuccess(getDeprecatedSuccessPayload(successes, errors)));
					/* ////// END SUPPORT FOR DEPRECATED API_SUCCESS ACTION */
					actions.push(api.complete());
					return Observable.of(...actions);
				})
				.catch(err => Observable.of(api.fail(err), apiError(err), api.complete()));
		});

export default function getSyncEpic(routes, fetchQueries, baseUrl) {
	return combineEpics(
		getNavEpic(routes, baseUrl),
		// locationSyncEpic,
		getFetchQueriesEpic(fetchQueries)
	);
}

