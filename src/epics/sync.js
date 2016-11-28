import { Observable } from 'rxjs';
import { combineEpics } from 'redux-observable';
import { LOCATION_CHANGE } from 'react-router-redux';
import {
	apiRequest,
	apiSuccess,
	apiError,
	apiComplete,
} from '../actions/syncActionCreators';
import { activeRouteQueries$ } from '../util/routeUtils';

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
export const getNavEpic = routes => {
	const activeQueries$ = activeRouteQueries$(routes);
	let currentLocation = {};  // keep track of current route so that apiRequest can get 'referrer'
	return (action$, store) =>
		action$.ofType(LOCATION_CHANGE, '@@server/RENDER')
			.flatMap(({ payload }) => {
				// inject request metadata from context, including `store.getState()`
				const requestMetadata = {
					referrer: currentLocation.pathname,
					logout: 'logout' in payload.query,
				};
				return activeQueries$(payload)  // find the queries for the location
					.map(queries => apiRequest(queries, requestMetadata))
					.do(() => currentLocation = payload);  // update to new location
			});
};

/**
 * Any action that should reload the API data should be handled here, e.g.
 * LOGIN_SUCCESS, which should force the app to reload in an 'authorized'
 * state
 */
export const locationSyncEpic = (action$, store) =>
	action$.ofType('LOCATION_SYNC', 'LOGIN_SUCCESS')
		.map(() => ({
			type: LOCATION_CHANGE,
			payload: store.getState().routing.locationBeforeTransitions,
		}));

/**
 * Listen for actions that provide queries to send to the api - mainly
 * API_REQUEST
 *
 * emits (API_SUCCESS || API_ERROR) then API_COMPLETE
 */
export const getFetchQueriesEpic = fetchQueriesFn => (action$, store) =>
	action$.ofType('API_REQUEST')
		.flatMap(({ payload, meta }) => {           // set up the fetch call to the app server
			const { config } = store.getState();
			const fetch = fetchQueriesFn(config.apiUrl, { method: 'GET' });
			return Observable.fromPromise(fetch(payload, meta))  // call fetch
				.takeUntil(action$.ofType(LOCATION_CHANGE))  // cancel this fetch when nav happens
				.map(apiSuccess)                             // dispatch apiSuccess with server response
				.flatMap(action => Observable.of(action, apiComplete()))  // dispatch apiComplete after resolution
				.catch(err => Observable.of(apiError(err)));  // ... or apiError
		});

export default function getSyncEpic(routes, fetchQueries) {
	return combineEpics(
		getNavEpic(routes),
		locationSyncEpic,
		getFetchQueriesEpic(fetchQueries)
	);
}

