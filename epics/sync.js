import { Observable } from 'rxjs';
import { combineEpics } from 'redux-observable';
import { LOCATION_CHANGE } from 'react-router-redux';
import {
	apiSuccess,
	apiError,
	apiComplete,
	locationSync,
} from '../actions/syncActionCreators';
import { fetchQueries } from '../util/fetchUtils';

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
		.map(() => locationSync(store.getState().router));

/**
 * Listen for actions that provide queries to send to the api - mainly
 * API_REQUEST
 *
 * emits (API_SUCCESS || API_ERROR) then API_COMPLETE
 */
export const getFetchQueriesEpic = fetchQueriesFn => (action$, store) =>
	action$.ofType('API_REQUEST')
		.map(({ payload }) => payload)  // payload contains the queries array
		.flatMap(queries => {           // set up the fetch call to the app server
			const { config, auth } = store.getState();
			const fetch = fetchQueriesFn(config.apiUrl, { method: 'GET', auth });
			return Observable.fromPromise(fetch(queries))  // call fetch
				.takeUntil(action$.ofType(LOCATION_CHANGE, 'LOCATION_SYNC'))  // cancel this fetch when nav happens
				.map(apiSuccess)                             // dispatch apiSuccess with server response
				.flatMap(action => Observable.of(action, apiComplete()))  // dispatch apiComplete after resolution
				.catch(err => Observable.of(apiError(err)));  // ... or apiError
		});

export default function getSyncEpic(routes, fetchQueriesFn=fetchQueries) {
	return combineEpics(
		getNavEpic(routes),
		resetLocationEpic,
		getFetchQueriesEpic(fetchQueriesFn)
	);
}

