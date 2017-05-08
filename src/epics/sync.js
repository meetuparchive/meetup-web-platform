import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/takeUntil';

import { combineEpics } from 'redux-observable';
import * as api from '../actions/apiActionCreators';
import {
	apiSuccess, // DEPRECATED
	apiError, // DEPRECATED
	LOCATION_CHANGE,
	SERVER_RENDER,
} from '../actions/syncActionCreators';
import { clearClick } from '../actions/clickActionCreators';
import { getRouteResolver, getMatchedQueries } from '../util/routeUtils';
import { getDeprecatedSuccessPayload } from '../util/fetchUtils';

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
	const resolveRoutes = getRouteResolver(routes, baseUrl);
	let currentLocation = {}; // keep track of current route so that apiRequest can get 'referrer'
	return (action$, store) =>
		action$
			.ofType(LOCATION_CHANGE, SERVER_RENDER)
			.mergeMap(({ payload: location }) => {
				// inject request metadata from context, including `store.getState()`
				const requestMetadata = {
					referrer: currentLocation.pathname || '',
					logout: logoutQueryMatch.test(location.search),
					clickTracking: store.getState().clickTracking,
				};
				// now that referrer has been recorded, set new currentLocation
				currentLocation = location;

				const cacheAction$ = requestMetadata.logout
					? Observable.of({ type: 'CACHE_CLEAR' })
					: Observable.empty();

				const apiAction$ = Observable.fromPromise(
					resolveRoutes(location, baseUrl).then(getMatchedQueries(location))
				).map(q => api.requestAll(q, requestMetadata));

				const clickAction$ = Observable.of(clearClick());

				return Observable.merge(cacheAction$, apiAction$, clickAction$);
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
	action$
		.ofType('LOGIN_SUCCESS')
		.ignoreElements() // TODO: push window.location into history without querystring
		.map(() => ({ type: LOCATION_CHANGE, payload: window.location }));

/**
 * Old apiRequest maps directly onto new api.requestAll
 * @deprecated
 */
export const apiRequestToApiReq = action$ =>
	action$
		.ofType('API_REQUEST')
		.map(action => api.requestAll(action.payload, action.meta));

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
export const getFetchQueriesEpic = fetchQueriesFn => (action$, store) =>
	action$.ofType(api.API_REQ).mergeMap(({ payload: queries, meta }) => {
		// set up the fetch call to the app server
		const { config } = store.getState();
		const fetchQueries = fetchQueriesFn(config.apiUrl);
		return Observable.fromPromise(fetchQueries(queries, meta)) // call fetch
			.takeUntil(action$.ofType(LOCATION_CHANGE)) // cancel this fetch when nav happens
			.mergeMap(({ successes = [], errors = [] }) => {
				const actions = [
					...successes.map(api.success), // send the successes to success
					...errors.map(api.error), // send errors to error
					apiSuccess(getDeprecatedSuccessPayload(successes, errors)), // DEPRECATED - necessary to continue populating old state
					api.complete(queries),
				];
				return Observable.of(...actions);
			})
			.catch(err =>
				Observable.of(
					api.fail(err),
					apiError(err), // DEPRECATED
					api.complete(queries)
				)
			);
	});

export default function getSyncEpic(routes, fetchQueries, baseUrl) {
	return combineEpics(
		getNavEpic(routes, baseUrl),
		// locationSyncEpic,
		getFetchQueriesEpic(fetchQueries),
		apiRequestToApiReq // TODO: remove in v3 - apiRequest is deprecated
	);
}
