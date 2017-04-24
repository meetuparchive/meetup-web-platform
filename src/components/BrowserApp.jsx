import React from 'react';
import PropTypes from 'prop-types';
import { getBrowserCreateStore } from '../util/createStoreBrowser';
import BrowserRouter from 'react-router-dom/BrowserRouter';
import PlatformApp from '../components/PlatformApp';

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
class BrowserApp extends React.Component {
	constructor(props) {
		super(props);
		// the initial state is delivered in the HTML from the server as a plain object
		// containing the HTML-escaped JSON string in `window.INITIAL_STATE.escapedState`.
		// unescape the text using native `textarea.textContent` unescaping
		const escape = document.createElement('textarea');
		escape.innerHTML = window.APP_RUNTIME.escapedState;
		const unescapedStateJSON = escape.textContent;
		const initialState = JSON.parse(unescapedStateJSON);
		const createStore = getBrowserCreateStore(props.routes, props.middleware, props.baseUrl);
		this.store = createStore(props.reducer, initialState);
	}
	render() {
		const { baseUrl, routes } = this.props;
		return (
			<BrowserRouter basename={baseUrl}>
				<PlatformApp store={this.store} routes={routes} />
			</BrowserRouter>
		);
	}
}

BrowserApp.propTypes = {
	routes: PropTypes.array.isRequired,
	reducer: PropTypes.func.isRequired,
	middleware: PropTypes.array.isRequired,
	baseUrl: PropTypes.string.isRequired,
};
BrowserApp.defaultProps = {
	middleware: [],
	baseUrl: '',
};

export default BrowserApp;

