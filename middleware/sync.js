/**
 * Sync middleware will hit the API when the server first renders the page and
 * when the router updates the app location.
 *
 * In order to call the correct API, it matches the current location to a route,
 * and the route specifies the function that can be called to build an API
 * request config (query)
 *
 * @module SyncMiddleware
 */

import Rx from 'rxjs';
import { bindActionCreators } from 'redux';
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
 * Stateful function to handle a subscription that should not
 * have parallel instances.
 */
const serialSubscription = (next, error, completed) => {
	let serialSub = new Rx.Subscription();
	return obs$ => {
		if (!serialSub.isUnsubscribed) {
			serialSub.unsubscribe();
		}
		serialSub = obs$.subscribe(
			next,
			error,
			completed
		);
		return serialSub;
	};
};

/**
 * The middleware is exported as a getter because it needs the application's
 * routes in order to sync correctly.
 *
 * The middleware itself - passes the queries to the application server, which
 * will make necessary calls to the API
 */
const getSyncMiddleware = routes => store => {
	/**
	 * We want to make sure there is always and only one data-fetching subscription
	 * open at a time, so we create an empty subscription that is scoped to the
	 * request. When a new fetch happens, this subscription will get replaced with
	 * a new subscription.
	 */
	const actions = bindActionCreators(
		{ apiRequest, apiSuccess, apiError, apiComplete, locationSync },
		store.dispatch
	);

	const doFetch = serialSubscription(
		actions.apiSuccess,
		actions.apiError,
		actions.apiComplete
	);

	return next => action => {
		if (action.type === LOCATION_CHANGE ||  // client nav
			action.type === '@@server/RENDER' ||
			action.type === 'LOCATION_SYNC') {

			const location = action.payload;
			const activeQueries$ = activeRouteQueries$(routes, { location })
				.delay(0)  // needed in order for LOCATION_CHANGE to finish processing
				.filter(queries => queries);  // only emit value if queries exist

			activeQueries$.subscribe(actions.apiRequest);
		}

		if (action.type === 'CONFIGURE_AUTH' && !action.meta) {
			setTimeout(() => {
				actions.locationSync(store.getState().routing.locationBeforeTransitions);
			}, 0);
		}

		if (action.type === 'API_REQUEST') {
			const {
				auth,
				config,
			} = store.getState();
			// should read auth from cookie if on browser, only read from state if on server

			const apiFetch$ = Rx.Observable.of(action.payload)
				.flatMap(fetchQueries(config.apiUrl, { method: 'GET', auth }));

			doFetch(apiFetch$);
		}

		return next(action);
	};
};

export default getSyncMiddleware;

