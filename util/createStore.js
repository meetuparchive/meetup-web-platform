/**
 * A createStore function with middleware and other store enhancers applied
 * @module createStore
 */
import { applyMiddleware, createStore, compose } from 'redux';
import {
	routerForBrowser,
		routerForHapi,
} from 'redux-little-router';
import getPlatformMiddleware from '../middleware/epic';

const noopMiddleware = store => next => action => next(action);

/**
 * This function consumes app-specific routes, reducer, state, and middleware
 * data in order to set up a general meetup web platform 'createStore' function
 *
 * This function is then called to return an actual Redux store
 *
 * @param {Object} routes the React Router routes object
 * @param {Function} reducer the root Redux reducer for the app
 * @param {Object} initialState (optional) initial state of the store
 * @param {Function} middleware (optional) any app-specific middleware that
 *   should be applied to the store
 */
function createEnhancedStore(router, routes, reducer, initialState=null, middleware=[], enhancers=[]) {
	middleware = [
		...middleware,
		getPlatformMiddleware(routes),
		router.routerMiddleware,
		typeof window !== 'undefined' && window.mupDevTools ? window.mupDevTools() : noopMiddleware,
	];
	const enhancer = compose(
		...enhancers,
		router.routerEnhancer,
		applyMiddleware(...middleware),
		typeof window !== 'undefined' && window.devToolsExtension ? window.devToolsExtension() : fn => fn
	);
	const store = createStore(reducer, initialState, enhancer);
	return store;
}

export function createBrowserStore(routes, reducer, initialState=null, middleware=[], enhancers=[]) {
	const router = routerForBrowser({
		routes
	});
	return createEnhancedStore(router, routes, reducer, initialState, middleware, enhancers);
}

export function createServerStore(request, routes, reducer, initialState=null, middleware=[], enhancers=[]) {
	const router = routerForHapi({
		request,
		routes,
	});
	return createEnhancedStore(router, routes, reducer, initialState, middleware, enhancers);
}

