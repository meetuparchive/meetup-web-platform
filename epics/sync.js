import Rx from 'rxjs';
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


export const getNavQueriesEpic = routes => (action$, store) =>
	action$.ofType(LOCATION_CHANGE, '@@server/RENDER', 'LOCATION_SYNC')
		.map(({ payload }) => payload)  // payload is `location`
		.flatMap(location => activeRouteQueries$(routes, { location }))
		.delay(0)
		.filter(queries => queries)
		.map(apiRequest);

export const authResetEpic = (action$, store) =>
	action$.ofType('CONFIGURE_AUTH')
		.filter(({ meta }) => !meta)
		.delay(0)
		.map(() => locationSync(store.getState().routing.locationBeforeTransitions));

export const apiRequestEpic = (action$, store) =>
	action$.ofType('API_REQUEST')
		.map(({ payload }) => payload)
		.flatMap(queries => {
			const {
				config,
				auth,
			} = store.getState();
			const fetch = fetchQueries(config.apiUrl, { method: 'GET', auth });
			return Rx.Observable.fromPromise(fetch(queries))
				.map(apiSuccess)
				.catch(apiError)
				.flatMap(action => Rx.Observable.of(action, apiComplete()))
				.takeUntil(action$.ofType(LOCATION_CHANGE, 'LOCATION_SYNC'));
		});

/*
		// Before creating a new subscription, we need to destroy any
		// existing subscriptions
		apiFetchSub.unsubscribe();
		// Now, set up the subscription to the new fetch
		apiFetchSub = apiFetch$.subscribe(
			actions.apiSuccess,
			actions.apiError,
			actions.apiComplete
		);
*/

/**
	 * We want to make sure there is always and only one data-fetching subscription
	 * open at a time, so we create an empty subscription that is scoped to the
	 * request. When a new fetch happens, this subscription will get replaced with
	 * a new subscription.
	 */

	/**
	 * The middleware is exported as a getter because it needs the application's
	 * routes in order to sync correctly.
	 *
	 * The middleware itself - passes the queries to the application server, which
	 * will make necessary calls to the API


	if () {
		const dispatchApiRequest = bindActionCreators(apiRequest, store.dispatch);

		const location = action.payload;
		const activeQueries$ = activeRouteQueries$(routes, { location })
			.delay(0)  // needed in order for LOCATION_CHANGE to finish processing
			.filter(queries => queries);  // only emit value if queries exist

		activeQueries$.subscribe(dispatchApiRequest);
	}

	if (action.type === 'CONFIGURE_AUTH' && !action.meta) {
		setTimeout(() => {
			store.dispatch(locationSync(store.getState().routing.locationBeforeTransitions));
		}, 0);
	}

	if (action.type === 'API_REQUEST') {
		const actions = bindActionCreators(
			{ apiSuccess, apiError, apiComplete },
			store.dispatch
		);
		const {
			auth,
			config,
		} = store.getState();
		// should read auth from cookie if on browser, only read from state if on server

		const apiFetch$ = Rx.Observable.of(action.payload)
			.flatMap(fetchQueries(config.apiUrl, { method: 'GET', auth }));

		// Before creating a new subscription, we need to destroy any
		// existing subscriptions
		apiFetchSub.unsubscribe();
		// Now, set up the subscription to the new fetch
		apiFetchSub = apiFetch$.subscribe(
			actions.apiSuccess,
			actions.apiError,
			actions.apiComplete
		);
	}
	*/

