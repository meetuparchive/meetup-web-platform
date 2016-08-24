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

import Rx from 'rx';
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
 * navRenderSub lives for the entire request, but only responds to the most
 * recent routing action, so it's a module-scoped 'SerialDisposable', which
 * will take care of disposing previous subscriptions automatically
 */
const navRenderSub = new Rx.SerialDisposable();

/**
 * The middleware is exported as a getter because it needs the application's
 * routes in order to sync correctly.
 *
 * The middleware itself - passes the queries to the application server, which
 * will make necessary calls to the API
 */
const getSyncMiddleware = routes => store => next => action => {
	if (action.type === LOCATION_CHANGE ||  // client nav
		action.type === '@@server/RENDER' ||
		action.type === 'LOCATION_SYNC') {
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

		const apiFetch$ = Rx.Observable.just(action.payload)
			.flatMap(fetchQueries(auth.oauth_token, config.apiUrl, 'GET'));

		// dispatch the sync action
		navRenderSub.setDisposable(
			apiFetch$.subscribe(
				actions.apiSuccess,
				actions.apiError,
				actions.apiComplete
			)
		);
	}

	return next(action);
};

export default getSyncMiddleware;

