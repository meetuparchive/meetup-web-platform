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
 * @param {Function} reducer the root Redux reducer for the app
 * @param {Object} initialState (optional) initial state of the store
 * @param {Function} middleware (optional) any app-specific middleware that
 *   should be applied to the store
 */
function finalCreateStore(routes, reducer, initialState=null, middleware=[], fetchQueriesFn=fetchQueries) {
	// **All** middleware gets added here
	const middlewareToApply = [
		getPlatformMiddleware(routes, fetchQueriesFn),
		typeof window !== 'undefined' && window.mupDevTools ? window.mupDevTools() : noopMiddleware,
		...middleware,
	];
	const appliedMiddleware = applyMiddleware(...middlewareToApply);

	const createStoreWithMiddleware = compose(
		appliedMiddleware,
		typeof window !== 'undefined' && window.devToolsExtension ? window.devToolsExtension() : fn => fn
	)(createStore);

	return createStoreWithMiddleware(reducer, initialState);
}

const serverFetchQueries = cookie => (api, options) => {
	options.headers = options.headers || {};
	options.headers.cookie = options.headers.cookie ?
		`${options.headers.cookie}; ${cookie}` :
		cookie;
	return fetchQueries(api, options);
};

export function createServerStore(routes, reducer, initialState, middleware, request) {
	const cookie = makeCookieHeader(request.state);
	return finalCreateStore(routes, reducer, initialState, middleware, serverFetchQueries(cookie));
}

export default finalCreateStore;

