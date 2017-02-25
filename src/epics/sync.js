import { Observable } from 'rxjs';
import { useBasename } from 'history';
import { combineEpics } from 'redux-observable';
import { browserHistory } from 'react-router';
import { LOCATION_CHANGE } from 'react-router-redux';
import {
	apiRequest,
	apiSuccess,
	apiError,
	apiComplete,
	setCsrf,
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

				const apiRequestActions$ = activeQueries$(payload)  // find the queries for the location
					.map(queries => apiRequest(queries, requestMetadata))
					.do(() => currentLocation = payload);  // update to new location

				// emit cache clear _only_ when logout requested
				const cacheClearAction$ = requestMetadata.logout ?
					Observable.of({ type: 'CACHE_CLEAR' }) : Observable.empty();

				return Observable.merge(cacheClearAction$, apiRequestActions$);
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
		.map(() => {
			const location = {
				...store.getState().routing.locationBeforeTransitions
			};
			delete location.query.logout;
			return location;
		})
		.do(location => {
			useBasename(() => browserHistory)({
				basename: location.basename
			}).replace(location);  // this will not trigger a LOCATION_CHANGE
		})
		.map(location => ({ type: LOCATION_CHANGE, payload: location }));

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
				.flatMap(({ successes, errors, csrf }) => {
					const actions = [
						...successes.map(apiSuccess),  // send the successes to success
						...errors.map(apiError),     // errors to error
						setCsrf(csrf),               // set CSRF
						apiComplete(),               // call complete
					];
					return Observable.of(...actions);
				})
				.catch(err => Observable.of(apiError(err), apiComplete()));
		});

export default function getSyncEpic(routes, fetchQueries) {
	return combineEpics(
		getNavEpic(routes),
		locationSyncEpic,
		getFetchQueriesEpic(fetchQueries)
	);
}

