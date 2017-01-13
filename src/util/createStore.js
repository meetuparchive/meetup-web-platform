/**
 * A createStore function with middleware and other store enhancers applied
 * @module createStore
 */
import { applyMiddleware, createStore, compose } from 'redux';
import getPlatformMiddleware from '../middleware/epic';
import { fetchQueries, makeCookieHeader } from '../util/fetchUtils';

const noopMiddleware = store => next => action => next(action);

/**
 * This function consumes app-specific routes, reducer, state, and middleware
 * data in order to set up a general meetup web platform 'createStore' function
 *
 * This function is then called to return an actual Redux store
 *
 * @param {Object} routes the React Router routes object
 * @param {Array} middleware additional middleware to inject into store
 * @param {Function} a function that accepts queries and returns a Promise
 *   that resolves with API results
 */
export function getPlatformMiddlewareEnhancer(routes, middleware, fetchQueriesFn=fetchQueries) {
	// **All** middleware gets added here
	const middlewareToApply = [
		getPlatformMiddleware(routes, fetchQueriesFn),
		typeof window !== 'undefined' && window.mupDevTools ? window.mupDevTools() : noopMiddleware,
		...middleware,
	];
	const appliedMiddleware = applyMiddleware(...middlewareToApply);

	return compose(
		appliedMiddleware,
		typeof window !== 'undefined' && window.devToolsExtension ? window.devToolsExtension() : fn => fn
	);
}

/**
 * wrap the `fetchQueries` function with a function that injects cookies into
 * the request
 *
 * @param {Object} cookieState { name: value } object of cookies to inject
 * @return {Function} a fetchQueries function
 */
const serverFetchQueries = request => (api, options) => {
	const cookie = makeCookieHeader(request.state);
	options.headers = options.headers || {};
	options.headers.cookie = options.headers.cookie ?
		`${options.headers.cookie}; ${cookie}` :
		cookie;
	options.headers.referer = options.headers.referer || request.url.pathname;
	return fetchQueries(api, options);
};

/**
 * the server needs a slightly different store than the browser because the
 * server does not know which cookies to pass along to the `fetch` function
 * inside the sync middleware.
 *
 * This getServerCreateStore function will therefore return a store creator that
 * is specifically tailored to making API requests that correspond to the
 * incoming request from the browser
 */
export function getServerCreateStore(
	routes,
	middleware,
	request
) {
	const middlewareEnhancer = getPlatformMiddlewareEnhancer(
		routes,
		middleware,
		serverFetchQueries(request)
	);
	return middlewareEnhancer(createStore);
}

export function getBrowserCreateStore(
	routes,
	middleware
) {
	const middlewareEnhancer = getPlatformMiddlewareEnhancer(
		routes,
		middleware,
		fetchQueries
	);
	return middlewareEnhancer(createStore);
}

