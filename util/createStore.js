/**
 * A createStore function with middleware and other store enhancers applied
 * @module createStore
 */
import { applyMiddleware, createStore, compose } from 'redux';
import getPlatformMiddleware from '../middleware/epic';
import PostMiddleware from '../middleware/post';

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
function finalCreateStore(routes, reducer, initialState=null, middleware=[]) {
	/**
	 * **All** middleware gets added here
	 * @const
	 */
	const middlewareToApply = [
		getPlatformMiddleware(routes),
		PostMiddleware,
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

export default finalCreateStore;

