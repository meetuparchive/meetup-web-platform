import { applyMiddleware, createStore } from 'redux';
import { getApiMiddleware } from '../../api-state'; // mwp-api-state

import getFetchQueries from './fetchQueries';
import catchMiddleware from '../middleware/catch';
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
		getApiMiddleware(routes, getFetchQueries(request), baseUrl),
		...middleware,
	];

	const middlewareEnhancer = applyMiddleware(...middlewareToApply);

	return middlewareEnhancer(createStore);
}
