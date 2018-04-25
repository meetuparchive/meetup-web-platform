// @flow weak
import { applyMiddleware, createStore, compose } from 'redux';
import getClickWriter from 'mwp-tracking-plugin/lib/util/clickWriter';
import { getApiMiddleware } from 'mwp-api-state';

import catchMiddleware from '../middleware/catch';
import fetchQueries from './fetchQueries';

declare var document: Object; // ignore 'potentially null' document.body

const noopMiddleware = store => next => action => next(action);

export const clickTrackEnhancer = createStore => (
	reducer,
	initialState,
	enhancer
) => {
	const store = createStore(reducer, initialState, enhancer);
	const clickTracker = getClickWriter(store);
	document.body.addEventListener('click', clickTracker);
	document.body.addEventListener('change', clickTracker);

	return store;
};

/**
 * the initial state is delivered in the HTML from the server as a plain object
 * containing the HTML-escaped JSON string in `window.INITIAL_STATE.escapedState`.
 * unescape the text using native `textarea.textContent` unescaping
 */
export const getInitialState = (APP_RUNTIME: { escapedState: string }): ?Object => {
	if (!APP_RUNTIME) {
		return;
	}
	const escape = document.createElement('textarea');
	escape.innerHTML = APP_RUNTIME.escapedState;
	const unescapedStateJSON = escape.textContent;
	return JSON.parse(unescapedStateJSON);
};

export function getBrowserCreateStore(resolveRoutes, middleware = []) {
	const middlewareToApply = [
		catchMiddleware(console.error),
		getApiMiddleware(resolveRoutes, fetchQueries),
		...middleware,
		window.mupDevTools ? window.mupDevTools() : noopMiddleware, // must be last middleware
	];
	const middlewareEnhancer = applyMiddleware(...middlewareToApply);

	const enhancer = compose(
		middlewareEnhancer,
		clickTrackEnhancer,
		window.devToolsExtension ? window.devToolsExtension() : fn => fn // this must be last enhancer
	);
	return enhancer(createStore);
}
