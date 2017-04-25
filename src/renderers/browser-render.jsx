import React from 'react';
import ReactDOM from 'react-dom';
import { getBrowserCreateStore } from '../util/createStoreBrowser';
import BrowserApp from '../components/BrowserApp';

const getInitialState = APP_RUNTIME => {
	// the initial state is delivered in the HTML from the server as a plain object
	// containing the HTML-escaped JSON string in `window.INITIAL_STATE.escapedState`.
	// unescape the text using native `textarea.textContent` unescaping
	const escape = document.createElement('textarea');
	escape.innerHTML = APP_RUNTIME.escapedState;
	const unescapedStateJSON = escape.textContent;
	return JSON.parse(unescapedStateJSON);
};

/**
 * This function creates a 'renderer', which is just a function that, when
 * called, will call ReactDOM.render() to render the application
 *
 * The routes, reducer, and app-specific middleware are provided by the
 * application - everything else is general to the meetup web platform
 *
 * @param {Object} routes the React Router routes object
 * @param {Function} reducer the root Redux reducer for the app
 * @param {Function} middleware (optional) any app-specific middleware that
 *   should be applied to the store
 * @param {String} baseUrl an optional baseUrl to serve the site from,
 * 	_including_ surrounding slashes, e.g. '/en-US/'
 *
 * @returns {Function} a function that results in a ReactDOM.render call - can
 *   use a custom root element ID or default to `'outlet'`
 */
function makeRenderer(routes, reducer, middleware=[], baseUrl='') {
	return (rootElId='outlet') => {
		const initialState = getInitialState(window.APP_RUNTIME);
		const createStore = getBrowserCreateStore(routes, middleware, baseUrl);
		const store = createStore(reducer, initialState);
		ReactDOM.render(
			<BrowserApp routes={routes} store={store} basename={baseUrl} />,
			document.getElementById(rootElId)
		);
		return store;
	};
}

export default makeRenderer;

