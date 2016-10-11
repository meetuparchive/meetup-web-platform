import { Observable } from 'rxjs/Observable';
import { combineEpics } from 'redux-observable';
import { LOCATION_CHANGE } from 'react-router-redux';
import {
	apiRequest,
	apiSuccess,
	apiError,
	apiComplete,
	locationSync,
} from '../actions/syncActionCreators';
import { activeRouteQueries$ } from '../util/routeUtils';
import { fetchQueries } from '../util/fetchUtils';

/**
 * Navigation actions will provide the `location` as the payload, which this
 * epic will use to collect the current Reactive Queries associated with the
 * active routes.
 *
 * These queries will then be dispatched in the payload of `apiRequest`
 * @param {Object} routes The application's React Router routes
 * @returns {Function} an Epic function that emits an API_REQUEST action
 */
export const getNavEpic = routes => {
	const activeQueries$ = activeRouteQueries$(routes);
	return (action$, store) =>
		action$.ofType(LOCATION_CHANGE, '@@server/RENDER', 'LOCATION_SYNC')
			.map(({ payload }) => payload)  // extract the `location` from the action payload
			.flatMap(activeQueries$)        // find the queries for the location
			.map(apiRequest);               // dispatch apiRequest with all queries
};

/**
 * Listen for actions that should cause the application state to reload based
 * on the current routing location
 *
 * The action can have a Boolean `meta` prop to indicate if the action was
 * dispatched on the server. If so, the application will _not_ be reloaded
 *
 * emits a LOCATION_SYNC action
 */
export const resetLocationEpic = (action$, store) =>
	action$.ofType('CONFIGURE_AUTH')  // auth changes imply privacy changes - reload
		.filter(({ meta }) => !meta)  // throw out any server-side actions
		.map(() => locationSync(store.getState().routing.locationBeforeTransitions));

/**
 * Listen for actions that provide queries to send to the api - mainly
 * API_REQUEST
 *
 * emits (API_SUCCESS || API_ERROR) then API_COMPLETE
 */
export const fetchQueriesEpic = (action$, store) =>
	action$.ofType('API_REQUEST')
		.map(({ payload }) => payload)  // payload contains the queries array
		.flatMap(queries => {           // set up the fetch call to the app server
			const { config, auth } = store.getState();
			const fetch = fetchQueries(config.apiUrl, { method: 'GET', auth });
			return Observable.fromPromise(fetch(queries))  // call fetch
				.takeUntil(action$.ofType(LOCATION_CHANGE, 'LOCATION_SYNC'))  // cancel this fetch when nav happens
				.map(apiSuccess)                             // dispatch apiSuccess with server response
				.flatMap(action => Observable.of(action, apiComplete()))  // dispatch apiComplete after resolution
				.catch(err => Observable.of(apiError(err)));  // ... or apiError
		});

export default function getSyncEpic(routes) {
	return combineEpics(
		getNavEpic(routes),
		resetLocationEpic,
		fetchQueriesEpic
	);
}

