// @flow
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/first';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import StaticRouter from 'react-router-dom/StaticRouter';

import { getServerCreateStore } from '../util/createStoreServer';
import Dom from '../components/dom';
import NotFound from '../components/NotFound';
import PlatformApp from '../components/PlatformApp';
import IntlPolyfill from 'intl';

import { SERVER_RENDER } from '../actions/syncActionCreators';
import {
	configureApiUrl,
	configureBaseUrl,
} from '../actions/configActionCreators';

// Ensure global Intl for use with FormatJS
Intl.NumberFormat = IntlPolyfill.NumberFormat;
Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;

const DOCTYPE = '<!DOCTYPE html>';

/**
 * An async module that renders the full app markup for a particular URL/location
 * using [ReactDOMServer]{@link https://facebook.github.io/react/docs/top-level-api.html#reactdomserver}
 *
 * @module ServerRender
 */

function getHtml(baseUrl, assetPublicPath, clientFilename, initialState={}, appMarkup='') {
	const htmlMarkup = ReactDOMServer.renderToString(
		<Dom
			baseUrl={baseUrl}
			assetPublicPath={assetPublicPath}
			clientFilename={clientFilename}
			initialState={initialState}
			appMarkup={appMarkup}
		/>
	);
	return `${DOCTYPE}${htmlMarkup}`;
}

/**
 * Using the current route information and Redux store, render the app to an
 * HTML string and server response code.
 *
 * There are three parts to the render:
 *
 * 1. `appMarkup`, which corresponds to the markup that will be rendered
 * on the client by React. This string is built before the full markup because
 * it sets the data needed by other parts of the DOM, such as `<head>`.
 * 2. `htmlMarkup`, which wraps `appMarkup` with the remaining DOM markup.
 * 3. `doctype`, which is just the doctype element that is a sibling of `<html>`
 *
 * @param {Object} renderProps
 * @param {ReduxStore} store the store containing the initial state of the app
 * @return {Object} the statusCode and result used by Hapi's `reply` API
 *   {@link http://hapijs.com/api#replyerr-result}
 */
const getRouterRenderer = (
	routes,
	store,
	location,
	baseUrl,
	clientFilename,
	assetPublicPath
) => {
	// pre-render the app-specific markup, this is the string of markup that will
	// be managed by React on the client.
	//
	// **IMPORTANT**: this string is built separately from `<Dom />` because it
	// initializes page-specific state that `<Dom />` needs to render, e.g.
	// `<head>` contents
	const initialState = store.getState();
	let appMarkup;
	let result;
	let statusCode;
	const context = {};

	appMarkup = ReactDOMServer.renderToString(
		<StaticRouter
			basename={baseUrl}
			location={location}
			context={context}
		>
			<PlatformApp store={store} routes={routes} />
		</StaticRouter>
	);

	if (context.url) {
		// redirect
	}

	// all the data for the full `<html>` element has been initialized by the app
	// so go ahead and assemble the full response body
	result = getHtml(
		baseUrl,
		assetPublicPath,
		clientFilename,
		initialState,
		appMarkup
	);

	statusCode = NotFound.rewind() ||  // if NotFound is mounted, return 404
		200;

	return {
		statusCode,
		result
	};
};

/**
 * Curry a function that takes a Hapi request and returns an observable
 * that will emit the rendered HTML
 *
 * The outer function takes app-specific information about the routes,
 * reducer, and optional additional middleware
 *
 * @param {Object} routes the React Router routes object
 * @param {Function} reducer the root Redux reducer for the app
 * @param {Function} middleware (optional) any app-specific middleware that
 *   should be applied to the store
 *
 * @return {Function}
 *
 * -- Returned Fn --
 * @param {Request} request The request to render - must already have an
 * `oauth_token` in `state`
 * @return {Observable}
 */
const makeRenderer = (
	routes: Array<Object>,
	reducer: Reducer,
	clientFilename: string,
	assetPublicPath: string,
	middleware: Array<Function> = [],
	baseUrl: string = ''
) => (request: Object) => {

	middleware = middleware || [];
	const {
		connection,
		headers,
		info,
		url,
		server,
		raw: { req },
	} = request;

	// request protocol might be different from original request that hit proxy
	// we want to use the proxy's protocol
	const requestProtocol = headers['x-forwarded-proto'] || connection.info.protocol;
	const host = `${requestProtocol}://${info.host}`;
	const apiUrl = `${host}/mu_api`;

	// create the store
	const initialState = {};
	const createStore = getServerCreateStore(routes, middleware, request, baseUrl);
	const store = createStore(reducer, initialState);

	// load initial config
	store.dispatch(configureApiUrl(apiUrl));
	store.dispatch(configureBaseUrl(host));

	// render skeleton if requested - the store is ready
	if ('skeleton' in request.query) {
		return Observable.of({
			result: getHtml(baseUrl, assetPublicPath, clientFilename, store.getState()),
			statusCode: 200
		});
	}

	// otherwise render using the API and React router
	const storeIsReady$ = Observable.create(obs => {
		obs.next(store.getState());
		return store.subscribe(() => obs.next(store.getState()));
	})
	.first(state => state.preRenderChecklist.every(isReady => isReady));  // take the first ready state

	const action = {
		type: SERVER_RENDER,
		payload: url,
	};
	server.app.logger.debug(
		{ type: 'dispatch', action, req },
		`Dispatching RENDER for ${request.url.href}`
	);
	store.dispatch(action);
	return storeIsReady$
		.map(() => getRouterRenderer(routes, store, url, baseUrl, clientFilename, assetPublicPath));
};

export default makeRenderer;

