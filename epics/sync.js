import { Observable } from 'rxjs';
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

export const getNavEpic = routes => (action$, store) =>
	action$.ofType(LOCATION_CHANGE, '@@server/RENDER', 'LOCATION_SYNC')
		.map(({ payload }) => payload)  // payload is `location`
		.flatMap(location => activeRouteQueries$(routes, { location }))
		.filter(queries => queries)
		.map(apiRequest);

export const resetLocationEpic = (action$, store) =>
	action$.ofType('CONFIGURE_AUTH')
		.filter(({ meta }) => !meta)
		.map(() => locationSync(store.getState().routing.locationBeforeTransitions));

export const fetchQueriesEpic = (action$, store) =>
	action$.ofType('API_REQUEST')
		.map(({ payload }) => payload)
		.flatMap(queries => {
			const {
				config,
				auth,
			} = store.getState();
			const fetch = fetchQueries(config.apiUrl, { method: 'GET', auth });
			return Observable.fromPromise(fetch(queries))
				.takeUntil(action$.ofType(LOCATION_CHANGE, 'LOCATION_SYNC'))
				.map(apiSuccess)
				.catch(err => Observable.of(apiError(err)))
				.flatMap(action => Observable.of(action, apiComplete()));
		});

