import { applyMiddleware, createStore } from 'redux';
import { parseQueryResponse } from './fetchUtils';
import getPlatformMiddleware from '../middleware/epic';
import apiProxy$ from '../apiProxy/api-proxy';

/**
 * on the server, we can proxy the API requests directly without making a
 * request to the server's own API proxy endpoint
 *
 * @param {Object} request Hapi request
 * @return {Promise} a promise that resolves with the parsed query responses
 *   from the REST API
 */
export const serverFetchQueries = request => () => queries =>
	apiProxy$(request, queries)
		.toPromise()
		.then(parseQueryResponse(queries));

/**
 * the server needs a slightly different store than the browser because the
 * server doesn't need to make an internal request to the api proxy endpoint
 * when the store dispatches an API request action
 *
 * @param {Object} routes the React Router routes object
 * @param {Array} middleware additional middleware to inject into store
 * @param {Object} request the Hapi request for this store
 */
export function getPlatformMiddlewareEnhancer(routes, middleware, fetchQueriesFn) {
	// **All** middleware gets added here
	const middlewareToApply = [
		getPlatformMiddleware(routes, fetchQueriesFn),
		...middleware,
	];
	return applyMiddleware(...middlewareToApply);
}

export function getServerCreateStore(
	routes,
	middleware,
	request
) {
	const middlewareToApply = [
		getPlatformMiddleware(routes, serverFetchQueries(request)),
		...middleware,
	];

	const middlewareEnhancer = applyMiddleware(...middlewareToApply);

	return middlewareEnhancer(createStore);
}

