// @flow
import newrelic from 'newrelic';
import type { Reducer } from 'redux';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import Helmet from 'react-helmet';
import MobileDetect from 'mobile-detect';

import { API_ROUTE_PATH } from 'mwp-api-proxy-plugin';
import { Forbidden, NotFound, Redirect, SERVER_RENDER } from 'mwp-router';
import SetCookie from '@meetup/mwp-cookie/lib/SetCookie';
import { getFindMatches, resolveAllRoutes } from 'mwp-router/lib/util';
import { getServerCreateStore } from 'mwp-store/lib/server';
import Dom from 'mwp-app-render/lib/components/Dom';
import ServerApp from 'mwp-app-render/lib/components/ServerApp';
import { parseMemberCookie } from 'mwp-core/lib/util/cookieUtils';

import {
	getVariants,
	parseBrowserIdCookie,
	parseSiftSessionCookie,
} from '../util/cookieUtils';
import { getLaunchDarklyUser } from '../util/launchDarkly';

const DOCTYPE = '<!DOCTYPE html>';
const DUMMY_DOMAIN = 'http://mwp-dummy-domain.com';

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

export function getRedirect(context: { url?: string, permanent?: boolean }) {
	if (!context || !context.url) {
		return;
	}
	// use `URL` to ensure valid character encoding (e.g. escaped emoji)
	const url: string = context.url;
	const isFragment = url.startsWith('/');
	const urlToFormat = isFragment ? `${DUMMY_DOMAIN}${url}` : url;
	const formattedUrl = new URL(urlToFormat).toString();
	return {
		redirect: {
			url: formattedUrl.replace(DUMMY_DOMAIN, ''),
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
	cookie: SetCookie.rewind(),
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
 * HTML string and server response code, with optional cookies to write
 */

const getRouterRenderer = ({
	request,
	h,
	appContext,
	routes,
	store,
	location,
	scripts,
	cssLinks,
}): RenderResult => {
	// pre-render the app-specific markup, this is the string of markup that will
	// be managed by React on the client.
	//
	// **IMPORTANT**: this string is built separately from `<Dom />` because it
	// initializes page-specific state that `<Dom />` needs to render, e.g.
	// `<head>` contents
	const initialState = store.getState();
	let appMarkup;
	const routerContext: { url?: string, permanent?: boolean } = {};

	try {
		appMarkup = ReactDOMServer.renderToString(
			<ServerApp
				request={request}
				h={h}
				appContext={appContext}
				location={location}
				routerContext={routerContext}
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

	const cookies = sideEffects.cookie;

	const externalRedirect = getRedirect(sideEffects.redirect);
	const internalRedirect = getRedirect(routerContext);
	const redirect = internalRedirect || externalRedirect;

	if (redirect) {
		return {
			...redirect,
			cookies,
		};
	}

	// cssLinks can be an Array or a Function that returns an array
	if (typeof cssLinks === 'function') {
		// invoke function and provide initialState
		cssLinks = cssLinks(initialState);
	}

	// all the data for the full `<html>` element has been initialized by the app
	// so go ahead and assemble the full response body
	const result = getHtml(
		<Dom
			head={sideEffects.head}
			initialState={initialState}
			appContext={appContext}
			appMarkup={appMarkup}
			scripts={scripts}
			cssLinks={cssLinks}
		/>
	);

	// prioritized status code fallbacks
	const statusCode = sideEffects.forbidden || sideEffects.notFound || 200;

	return {
		cookies,
		statusCode,
		result,
	};
};

// get initial server-rendered app metadata that can be consumed by the application
// from mwp-app-render/src/components/AppContext.Consumer
const getAppContext = (request: HapiRequest, enableServiceWorker: boolean) => {
	const { url, headers, info, server, state } = request;
	// request protocol and host might be different from original request that hit proxy
	// we want to use the proxy's protocol and host
	const requestProtocol = headers['x-forwarded-proto'] || server.info.protocol;
	const domain: string =
		headers['x-forwarded-host'] || headers['x-meetup-host'] || info.host;
	const clientIp =
		request.query.__set_geoip ||
		headers['fastly-client-ip'] ||
		info.remoteAddress;
	const host = `${requestProtocol}://${domain}`;
	const userAgent = headers['user-agent'];
	const userAgentDevice = headers['x-ua-device'] || ''; // set by fastly
	const requestLanguage = request.getLanguage();

	return {
		apiUrl: API_ROUTE_PATH,
		baseUrl: host,
		basename: requestLanguage === 'en-US' ? '' : `/${requestLanguage}`, // basename is the 'base path' for the application - usually a localeCode
		enableServiceWorker,
		requestLanguage,
		supportedLangs: server.settings.app.supportedLangs,
		initialNow: new Date().getTime(),
		isProdApi: server.settings.app.api.isProd,
		isQL: parseMemberCookie(state).ql === 'true',
		memberId: parseMemberCookie(state).id, // deprecated, use member.id
		// the member cookie is not structured the same way as the member object returned from /member/self
		// be careful relying on it to have the same properties downstream
		member: parseMemberCookie(state),
		variants: getVariants(state),
		entryPath: url.pathname, // the path that the user entered the app on
		media: getMedia(userAgent, userAgentDevice),
		browserId: parseBrowserIdCookie(state),
		clientIp,
		siftSessionId: parseSiftSessionCookie(state),
	};
};

/**
 * Curry a function that takes a Hapi request and returns a Promise
 * that will emit the rendered HTML
 *
 * The outer function takes app-specific information about the routes,
 * reducer, and optional additional middleware
 */
const makeRenderer = (renderConfig: {
	routes: Array<Object>,
	reducer: Reducer<MWPState, FluxStandardAction>,
	middleware: Array<Function>,
	scripts: Array<string>,
	enableServiceWorker: boolean,
	cssLinks: ?(Array<string> | (MWPState => Array<string>)),
}) => {
	const {
		routes,
		reducer,
		middleware,
		scripts,
		cssLinks,
		enableServiceWorker,
	} = renderConfig;
	// set up a Promise that emits the resolved routes - this single Promise will
	// be reused for all subsequent requests, so we're not resolving the routes repeatedly
	// hooray performance
	const routesPromise = resolveAllRoutes(routes);
	return (request: HapiRequest, h: HapiResponseToolkit): Promise<RenderResult> => {
		if (!scripts.length) {
			throw new Error('No client script assets specified');
		}

		const appContext = getAppContext(request, enableServiceWorker);

		// create the store with populated `config`
		const initializeStore = resolvedRoutes => {
			const createStore = getServerCreateStore(
				getFindMatches(resolvedRoutes, appContext.basename),
				middleware || [],
				request
			);
			const initialState = { config: appContext };
			return Promise.resolve(createStore(reducer, initialState));
		};

		// otherwise render using the API and React router
		// addFlags is called twice in order to ensure that
		// there is a full member object available in state
		// feature flags can be selected based on member id,
		// email, and other properties.
		// feature flags based on member id are available before the store is populated.
		const addFlags = (populatedStore, member) => {
			// Populate a LaunchDarklyUser object from member and request details
			const launchDarklyUser = getLaunchDarklyUser(member, request);
			return request.server.plugins['mwp-app-route']
				.getFlags(launchDarklyUser)
				.then(flags =>
					populatedStore.dispatch({
						type: 'UPDATE_FLAGS',
						payload: flags,
					})
				);
		};

		const checkReady = state =>
			state.preRenderChecklist.every(isReady => isReady);
		const populateStore = store =>
			new Promise((resolve, reject) => {
				// dispatch SERVER_RENDER to kick off API middleware
				store.dispatch({ type: SERVER_RENDER, payload: request.url });

				if (checkReady(store.getState())) {
					// we need to use the _latest_ version of the member object
					// which is why memberObj is defined after the checkReady call.
					const memberObj = (store.getState().api.self || {}).value || {};
					addFlags(store, memberObj).then(() => {
						resolve(store);
					});
					return;
				}
				const unsubscribe = store.subscribe(() => {
					if (checkReady(store.getState())) {
						// we need to use the _latest_ version of the member object
						// which is why memberObj is defined after the checkReady call.
						const memberObj =
							(store.getState().api.self || {}).value || {};
						addFlags(store, memberObj).then(() => {
							resolve(store);
							unsubscribe();
						});
					}
				});
			});

		return routesPromise.then(resolvedRoutes =>
			initializeStore(resolvedRoutes).then(store => {
				// the initial addFlags call will only be key'd by member ID
				return addFlags(store, { id: parseMemberCookie(request.state).id })
					.then(() => populateStore(store))
					.then(
						store =>
							// create tracer and immediately invoke the resulting function.
							// trace should start before rendering, finish after rendering
							newrelic.createTracer('serverRender', getRouterRenderer)({
								request,
								h,
								appContext,
								routes: resolvedRoutes,
								store,
								scripts,
								cssLinks,
							}) // immediately invoke callback
					);
			})
		);
	};
};

export default makeRenderer;
