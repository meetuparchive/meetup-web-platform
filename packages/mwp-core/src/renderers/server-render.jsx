// @flow
import newrelic from 'newrelic';
import type { Reducer } from 'redux';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import Helmet from 'react-helmet';
import MobileDetect from 'mobile-detect';

import { API_ROUTE_PATH } from 'mwp-api-proxy-plugin';
import { Forbidden, NotFound, Redirect, SERVER_RENDER } from 'mwp-router';
import { getFindMatches, resolveAllRoutes } from 'mwp-router/lib/util';
import { getServerCreateStore } from 'mwp-store/lib/server';
import Dom from 'mwp-app-render/lib/components/Dom';
import ServerApp from 'mwp-app-render/lib/components/ServerApp';
import { parseMemberCookie } from 'mwp-core/lib/util/cookieUtils';

import { getVariants } from '../util/cookieUtils';

const DOCTYPE = '<!DOCTYPE html>';

/**
 * An async module that renders the full app markup for a particular URL/location
 * using [ReactDOMServer]{@link https://facebook.github.io/react/docs/top-level-api.html#reactdomserver}
 *
 * @module ServerRender
 */

function getHtml(el) {
	const htmlMarkup = ReactDOMServer.renderToString(el);
	return `${DOCTYPE}${htmlMarkup}`;
}

function getRedirect(context) {
	if (!context || !context.url) {
		return;
	}
	return {
		redirect: {
			url: encodeURI(decodeURI(context.url)), // ensure that the url is encoded for the redirect header
			permanent: context.permanent,
		},
	};
}

/*
 * A helper to collect react-side-effect data from all components in the
 * application that utilize side effects
 *
 * Any component class that uses react-side-effect should be 'rewound' in this
 * function to prevent memory leaks and invalid state carrying over into other
 * requests
 */
const resolveSideEffects = () => ({
	head: Helmet.rewind(),
	redirect: Redirect.rewind(),
	forbidden: Forbidden.rewind(),
	notFound: NotFound.rewind(),
});

/**
 * Get media from X-UA-Device header set by Fastly which parses the user agent string
 */
const getMedia = (userAgent: string, userAgentDevice: string) => {
	const isAtSmallUp = true;
	let isMobile = true;
	let isTablet = false;

	if (userAgentDevice) {
		isMobile =
			userAgentDevice === 'smartphone' ||
			userAgentDevice === 'mobilebot' ||
			userAgentDevice === 'mobile';
		isTablet = userAgentDevice === 'tablet';
	} else {
		const mobileDetect = new MobileDetect(userAgent);
		isMobile = Boolean(mobileDetect.phone());
		isTablet = Boolean(mobileDetect.tablet());
	}

	return {
		isAtSmallUp,
		isAtMediumUp: isTablet || !isMobile,
		isAtLargeUp: !isMobile && !isTablet,
	};
};

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
type RenderResult =
	| { result: string, statusCode: number }
	| { redirect: { url: string, permanent?: boolean } };

const getRouterRenderer = ({
	routes,
	store,
	location,
	basename,
	scripts,
	cssLinks,
	userAgent,
}): RenderResult => {
	// pre-render the app-specific markup, this is the string of markup that will
	// be managed by React on the client.
	//
	// **IMPORTANT**: this string is built separately from `<Dom />` because it
	// initializes page-specific state that `<Dom />` needs to render, e.g.
	// `<head>` contents
	const initialState = store.getState();
	let appMarkup;
	const staticContext: { url?: string, permanent?: boolean } = {};

	try {
		appMarkup = ReactDOMServer.renderToString(
			<ServerApp
				basename={basename}
				location={location}
				context={staticContext}
				store={store}
				routes={routes}
			/>
		);
	} catch (err) {
		// cleanup all react-side-effect components to prevent error/memory leaks
		resolveSideEffects();
		// now we can re-throw and let the caller handle the error
		throw err;
	}

	const sideEffects = resolveSideEffects();

	const externalRedirect = getRedirect(sideEffects.redirect);
	const internalRedirect = getRedirect(staticContext);
	const redirect = internalRedirect || externalRedirect;
	if (redirect) {
		return redirect;
	}

	// all the data for the full `<html>` element has been initialized by the app
	// so go ahead and assemble the full response body
	const result = getHtml(
		<Dom
			basename={basename}
			head={sideEffects.head}
			initialState={initialState}
			appMarkup={appMarkup}
			scripts={scripts}
			cssLinks={cssLinks}
			userAgent={userAgent}
		/>
	);

	// prioritized status code fallbacks
	const statusCode = sideEffects.forbidden || sideEffects.notFound || 200;

	return {
		statusCode,
		result,
	};
};

const makeRenderer$ = (renderConfig: {
	routes: Array<Object>,
	reducer: Reducer<MWPState, FluxStandardAction>,
	middleware: Array<Function>,
	scripts: Array<string>,
	enableServiceWorker: boolean,
	cssLinks: ?Array<string>,
}) =>
	makeRenderer(
		renderConfig.routes,
		renderConfig.reducer,
		renderConfig.middleware,
		renderConfig.scripts,
		renderConfig.enableServiceWorker,
		renderConfig.cssLinks
	);

/**
 * Curry a function that takes a Hapi request and returns an observable
 * that will emit the rendered HTML
 *
 * The outer function takes app-specific information about the routes,
 * reducer, and optional additional middleware
 */
const makeRenderer = (
	routes: Array<Object>,
	reducer: Reducer<MWPState, FluxStandardAction>,
	middleware: Array<Function> = [],
	scripts: Array<string> = [],
	enableServiceWorker: boolean,
	cssLinks: ?Array<string>
) => {
	// set up a Promise that emits the resolved routes - this single Promise will
	// be reused for all subsequent requests, so we're not resolving the routes repeatedly
	// hooray performance
	const routesPromise = resolveAllRoutes(routes);
	return (request: HapiRequest, reply: HapiReply): Promise<RenderResult> => {
		middleware = middleware || [];

		if (!scripts.length) {
			throw new Error('No client script assets specified');
		}

		const {
			connection,
			headers,
			info,
			url,
			server: { settings: { app: { supportedLangs } } },
			state,
		} = request;
		const requestLanguage = request.getLanguage();
		// basename is the 'base path' for the application - usually a localeCode
		const basename = requestLanguage === 'en-US' ? '' : `/${requestLanguage}`;

		// request protocol and host might be different from original request that hit proxy
		// we want to use the proxy's protocol and host
		const requestProtocol =
			headers['x-forwarded-proto'] || connection.info.protocol;
		const domain: string =
			headers['x-forwarded-host'] || headers['x-meetup-host'] || info.host;
		const host = `${requestProtocol}://${domain}`;
		const userAgent = headers['user-agent'];
		const userAgentDevice = headers['x-ua-device'] || ''; // set by fastly

		// create the store with populated `config`
		const initializeStore = resolvedRoutes => {
			const initialState = {
				config: {
					apiUrl: API_ROUTE_PATH,
					baseUrl: host,
					enableServiceWorker,
					requestLanguage,
					supportedLangs,
					initialNow: new Date().getTime(),
					isQL: parseMemberCookie(state).ql === 'true',
					variants: getVariants(state),
					entryPath: url.pathname, // the path that the user entered the app on
					media: getMedia(userAgent, userAgentDevice),
				},
			};

			const createStore = getServerCreateStore(
				getFindMatches(resolvedRoutes, basename),
				middleware,
				request
			);
			return Promise.resolve(createStore(reducer, initialState));
		};

		// otherwise render using the API and React router
		const addFlags = store => {
			// use the api self object first if it exists,
			// else, use the member id on the member cookie,
			// else, this person's a guest and they'll get a
			// default id of 0
			const memberObj = (store.getState().api.self || {}).value || {
				id: parseMemberCookie(request.state).id,
			};

			return request.server.plugins['mwp-app-route']
				.getFlags(memberObj)
				.then(flags =>
					store.dispatch({
						type: 'UPDATE_FLAGS',
						payload: flags,
					})
				);
		};
		const checkReady = state =>
			state.preRenderChecklist.every(isReady => isReady);
		const populateStore = store =>
			addFlags(store).then(() => {
				// dispatch SERVER_RENDER to kick off API middleware
				store.dispatch({ type: SERVER_RENDER, payload: url });

				return new Promise((resolve, reject) => {
					// check whether store is already ready
					// and resolve immediately if so
					if (checkReady(store.getState())) {
						resolve(store);
					}
					// otherwise, subscribe and add flags
					// when store is ready
					const unsubscribe = store.subscribe(() => {
						if (checkReady(store.getState())) {
							addFlags(store).then(() => {
								resolve(store);
								unsubscribe();
							});
						}
					});
				});
			});

		return routesPromise.then(resolvedRoutes =>
			initializeStore(resolvedRoutes).then(store => {
				if ('skeleton' in request.query) {
					// render skeleton if requested - the store is ready
					return {
						result: getHtml(
							<Dom
								basename={basename}
								head={Helmet.rewind()}
								initialState={store.getState()}
								scripts={scripts}
								cssLinks={cssLinks}
							/>
						),
						statusCode: 200,
					};
				}
				return populateStore(store).then(
					store =>
						// create tracer and immediately invoke the resulting function.
						// trace should start before rendering, finish after rendering
						newrelic.createTracer('serverRender', getRouterRenderer)({
							routes: resolvedRoutes,
							store,
							location: url,
							basename,
							scripts,
							cssLinks,
							userAgent,
						}) // immediately invoke callback
				);
			})
		);
	};
};

export { makeRenderer$, makeRenderer };
export default makeRenderer;
