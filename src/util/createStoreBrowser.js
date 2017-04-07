import { applyMiddleware, createStore, compose } from 'redux';

import { fetchQueries } from '../util/fetchUtils';
import getClickTracker from './clickTracking';
import getEpicMiddleware from '../middleware/epic';
import catchMiddleware from '../middleware/catch';


const noopMiddleware = store => next => action => next(action);

export const clickTrackEnhancer = createStore => (reducer, initialState, enhancer) => {
	const store = createStore(reducer, initialState, enhancer);
	const clickTracker = getClickTracker(store);
	document.body.addEventListener('click', clickTracker);
	document.body.addEventListener('change', clickTracker);

	return store;
};

export function getBrowserCreateStore(
	routes,
	middleware=[],
	baseUrl
) {
	const middlewareToApply = [
		catchMiddleware,
		getEpicMiddleware(routes, fetchQueries, baseUrl),
		...middleware,
		window.mupDevTools ? window.mupDevTools() : noopMiddleware,  // must be last middleware
	];
	const middlewareEnhancer = applyMiddleware(...middlewareToApply);

	const enhancer = compose(
		middlewareEnhancer,
		clickTrackEnhancer,
		window.devToolsExtension ? window.devToolsExtension() : fn => fn  // this must be last enhancer
	);
	return enhancer(createStore);
}

