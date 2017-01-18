/**
 * A createStore function with middleware and other store enhancers applied
 * @module createStore
 */
import { applyMiddleware, createStore, compose } from 'redux';
import getPlatformMiddleware from '../middleware/epic';
import { fetchQueries, mergeCookies } from '../util/fetchUtils';

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

export function mergeRawCookies(request) {
	const injectedCookies = Object.keys(request.state)
		.filter(name => name.startsWith('__internal_'))
		.reduce((cookies, name) => ({
			...cookies,
			...({ [name]: request.state[name] })
		}), {});

	return mergeCookies(request.raw.req.headers.cookie || '', injectedCookies);
}

/**
 * wrap the `fetchQueries` function with a function that injects cookies into
 * the request
 *
 * @param {Object} cookieState { name: value } object of cookies to inject
 * @return {Function} a fetchQueries function
 */
export const serverFetchQueries = request => (api, options) => {
	options.headers = options.headers || {};
	const serverCookie = mergeRawCookies(request);
	options.headers.cookie = options.headers.cookie ?
		`${options.headers.cookie}; ${serverCookie}` :
		serverCookie;
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
 *
 * @param {Object} routes the React Router routes object
 * @param {Array} middleware additional middleware to inject into store
 * @param {Object} request the Hapi request for this store
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
	const enhancer = compose(
		middlewareEnhancer,
		window.devToolsExtension ? window.devToolsExtension() : fn => fn  // this must be last enhancer
	);
	return enhancer(createStore);
}

