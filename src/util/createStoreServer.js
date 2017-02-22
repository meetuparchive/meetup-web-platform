import { createStore } from 'redux';
import { parseQueryResponse } from './fetchUtils';
import { getPlatformMiddlewareEnhancer } from './createStore';
import apiProxy$ from '../apiProxy/api-proxy';

/**
 * wrap the `fetchQueries` function with a function that injects cookies into
 * the request
 *
 * @param {Object} request Hapi request
 * @return {Function} a fetchQueries function
 */
export const serverFetchQueries = request => () => queries =>
	apiProxy$(request, queries)
		.toPromise()
		.then(parseQueryResponse(queries));

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
	request,
) {
	const middlewareEnhancer = getPlatformMiddlewareEnhancer(
		routes,
		middleware,
		serverFetchQueries(request)
	);
	return middlewareEnhancer(createStore);
}


