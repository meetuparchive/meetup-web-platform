import { applyMiddleware, createStore } from 'redux';
import { getApiMiddleware } from '../api-state'; // mwp-api-state

import { parseQueryResponse } from './fetchUtils';
import catchMiddleware from '../middleware/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

/**
 * on the server, we can proxy the API requests directly without making a
 * request to the server's own API proxy endpoint
 *
 * @param {Object} request Hapi request
 * @return {Promise} a promise that resolves with the parsed query responses
 *   from the REST API
 */
export const serverFetchQueries = request => () => queries =>
	request
		.proxyApi$(queries)
		.map(responses => ({ responses })) // package the responses in object like the API proxy endpoint does
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
export function getServerCreateStore(routes, middleware, request, baseUrl) {
	const middlewareToApply = [
		catchMiddleware(err => request.server.app.logger.error(err)),
		getApiMiddleware(routes, serverFetchQueries(request), baseUrl),
		...middleware,
	];

	const middlewareEnhancer = applyMiddleware(...middlewareToApply);

	return middlewareEnhancer(createStore);
}
