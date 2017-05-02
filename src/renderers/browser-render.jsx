import React from 'react';
import ReactDOM from 'react-dom';
import {
	getInitialState,
	getBrowserCreateStore,
} from '../util/createStoreBrowser';
import BrowserApp from '../components/BrowserApp';

/**
 * @module browser-render
 * @deprecated see CHANGELOG v2.4
 */

/**
 * This function creates a 'renderer', which is just a function that, when
 * called, will call ReactDOM.render() to render the application
 *
 * The routes, reducer, and app-specific middleware are provided by the
 * application - everything else is general to the meetup web platform
 *
 * @deprecated
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
function makeRenderer(routes, reducer, middleware = [], baseUrl = '') {
	return (rootElId = 'outlet') => {
		const createStore = getBrowserCreateStore(routes, middleware, baseUrl);
		const store = createStore(reducer, getInitialState(window.APP_RUNTIME));
		ReactDOM.render(
			<BrowserApp routes={routes} store={store} basename={baseUrl} />,
			document.getElementById(rootElId)
		);
		return store;
	};
}

export default makeRenderer;
