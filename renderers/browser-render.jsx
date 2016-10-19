import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { RouterProvider, initializeCurrentLocation } from 'redux-little-router';
import { createBrowserStore } from '../util/createStore';

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
 *
 * @returns {Function} a function that results in a ReactDOM.render call - can
 *   use a custom root element ID or default to `'outlet'`
 */
function makeRenderer(App, routes, reducer, middleware) {
	// the initial state is delivered in the HTML from the server as a plain object
	// containing the HTML-escaped JSON string in `window.INITIAL_STATE.escapedState`.
	// unescape the text using native `textarea.textContent` unescaping
	const escape = document.createElement('textarea');
	escape.innerHTML = window.APP_RUNTIME.escapedState;
	const unescapedStateJSON = escape.textContent;
	const initialState = JSON.parse(unescapedStateJSON);
	const store = createBrowserStore(routes, reducer, initialState, middleware);
	const initialLocation = store.getState().router;
	if (initialLocation) {
		store.dispatch(initializeCurrentLocation(initialLocation));
	}

	return (rootElId='outlet') => {
		ReactDOM.render(
			<Provider store={store}>
				<RouterProvider store={store}>
					<App />
				</RouterProvider>
			</Provider>,
			document.getElementById(rootElId)
		);
		return store;
	};
}

export default makeRenderer;

