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
 * Stateful higher-order function to handle a subscription that should not
 * have parallel instances.
 *
 * The next/error/completed handlers initially supplied will be applied to each
 * subsequent Observable stream passed to the returned function
 */
const makeSerialSubscriber = (next, error, completed) => {
	let serialSub = new Rx.Subscription();  // empty sub on init
	return obs$ => {
		if (!serialSub.isUnsubscribed) {
			serialSub.unsubscribe();  // kill any open subscriptions
		}
		// set up the new subscription
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
	const actions = bindActionCreators(
		{ apiRequest, apiSuccess, apiError, apiComplete, locationSync },
		store.dispatch
	);

	/*
	 * We want to make sure there is always and only one data-fetching subscription
	 * open at a time, so we create a 'serial subscriber' that can be passed an
	 * Observable to subscribe to with a particular set of next/error/completed
	 * handlers. When a new fetch happens, this subscription will get replaced with
	 * a new subscription.
	 */
	const subscribeToFetch = makeSerialSubscriber(
		actions.apiSuccess,
		actions.apiError,
		actions.apiComplete
	);

	// Now, return the curried functions used by all Redux middleware
	return next => action => {
		// CASE 1: navigation-related actions - gather reactive query info and
		// dispatch an API_REQUEST action
		if (action.type === LOCATION_CHANGE ||  // client nav
			action.type === '@@server/RENDER' ||
			action.type === 'LOCATION_SYNC') {

			const location = action.payload;
			const activeQueries$ = activeRouteQueries$(routes, { location })
				.delay(0)  // needed in order for LOCATION_CHANGE to finish processing
				.filter(queries => queries);  // only emit value if queries exist

			// we have our stream of queries, now dispatch an action with them
			activeQueries$.subscribe(actions.apiRequest);
		}

		// CASE 2: Any time auth information changes, we need to re-load any app
		// data related to the current location to reflect what the new auth allows
		// the client to see
		if (action.type === 'CONFIGURE_AUTH' && !action.meta) {
			setTimeout(() => {
				actions.locationSync(store.getState().routing.locationBeforeTransitions);
			}, 0);
		}

		// CASE 3: When there's an API_REQEUST, go ahead and make the fetch call
		// and use subscribeToFetch to manage the subscription
		if (action.type === 'API_REQUEST') {
			const {
				auth,
				config,
			} = store.getState();
			// should read auth from cookie if on browser, only read from state if on server

			const apiFetch$ = Rx.Observable.of(action.payload)  // read the queries
				.flatMap(fetchQueries(config.apiUrl, { method: 'GET', auth }));  // call fetch

			subscribeToFetch(apiFetch$);  // open the subscription
		}

		return next(action);
	};
};

export default getSyncMiddleware;

