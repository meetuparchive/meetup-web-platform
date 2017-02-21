import { createStore, compose } from 'redux';

import { fetchQueries } from '../util/fetchUtils';
import getClickTracker from './clickTracking';
import { getPlatformMiddlewareEnhancer } from './createStore';


export const clickTrackEnhancer = createStore => (reducer, initialState, enhancer) => {
	const store = createStore(reducer, initialState, enhancer);
	const clickTracker = getClickTracker(store);
	document.body.addEventListener('click', clickTracker);
	document.body.addEventListener('change', clickTracker);

	return store;
};

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
		clickTrackEnhancer,
		window.devToolsExtension ? window.devToolsExtension() : fn => fn  // this must be last enhancer
	);
	return enhancer(createStore);
}

