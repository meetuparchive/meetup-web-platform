import React from 'react';
import ReactDOM from 'react-dom';
import BrowserApp from '../components/BrowserApp';

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
		const app = ReactDOM.render(
			<BrowserApp routes={routes} reducer={reducer} middleware={middleware} baseUrl={baseUrl} />,
			document.getElementById(rootElId)
		);
		return app.store;
	};
}

export default makeRenderer;

