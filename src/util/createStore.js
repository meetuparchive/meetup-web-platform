import { applyMiddleware } from 'redux';
/**
 * A createStore function with middleware and other store enhancers applied
 * @module createStore
 */
import getPlatformMiddleware from '../middleware/epic';

const noopMiddleware = store => next => action => next(action);

/**
 * The platform has a specific set of middleware that must be applied to the
 * store in order for it to work. This store enhancer consumes a few app-
 * specific configuration options to set up the middleware enhancer correctly
 *
 * @param {Object} routes the React Router routes object
 * @param {Array} middleware additional middleware to inject into store
 * @param {Function} fetchQueriesFn a function that accepts queries and returns a Promise
 *   that resolves with API results
 * @return {Function} A Redux store enhancer function
 */
export function getPlatformMiddlewareEnhancer(routes, middleware, fetchQueriesFn) {
	// **All** middleware gets added here
	const middlewareToApply = [
		getPlatformMiddleware(routes, fetchQueriesFn),
		typeof window !== 'undefined' && window.mupDevTools ? window.mupDevTools() : noopMiddleware,
		...middleware,
	];
	return applyMiddleware(...middlewareToApply);
}


