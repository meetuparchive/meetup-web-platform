import Inert from 'inert';
import pino from 'pino';
import HapiPino from 'hapi-pino';
import CsrfPlugin from 'electrode-csrf-jwt';
import config from 'mwp-cli/src/config';

import logger from '../util/logger';
import appRoutePlugin from './app-route';
import requestAuthPlugin from './requestAuthPlugin';
import activityPlugin from './tracking/activity';
import clickPlugin from './tracking/click';
import languagePlugin from './language';
import serviceWorkerPlugin from './service-worker';
import apiProxyPlugin from './api-proxy';

/**
 * Hapi plugins for the dev server
 *
 * @module ServerPlugins
 */

export function setCsrfCookies(request, reply) {
	const csrfHeader = (request.response.headers || {})['x-csrf-jwt'];
	if (csrfHeader) {
		reply.state('x-csrf-jwt-header', csrfHeader);
	}
	return reply.continue();
}

/**
 * The CSRF plugin we use - 'electrode-csrf-jwt' compares a cookie token to a
 * header token in non-GET requests. By default, it will set the cookie token
 * itself ('x-csrf-jwt'), and supply the corresponding header token in a custom
 * header (also 'x-csrf-jwt'). However, we update this flow to also supply the
 * header token as a cookie ('x-csrf-jwt-header') so that it syncs across
 * browser tabs.
 *
 * In order to ensure that both cookie values have parallel settings, this
 * function calls `server.state` for both cookie names before registering the
 * plugin.
 *
 * @return {Object} the { register } object for a `server.register` call.
 */
export function getCsrfPlugin() {
	const register = (server, options, next) => {
		const cookieOptions = {
			path: '/',
			isSecure: server.settings.app.isProd,
		};

		options.secret = server.settings.app.csrf_secret;

		server.state(
			'x-csrf-jwt', // set by plugin
			{ ...cookieOptions, isHttpOnly: true } // no client-side interaction needed
		);

		server.state(
			'x-csrf-jwt-header', // set by onPreResponse
			{ ...cookieOptions, isHttpOnly: false } // the client must read this cookie and return as a custom header
		);

		const registration = CsrfPlugin.register(server, options, next);
		server.ext('onPreResponse', setCsrfCookies); // this extension must be registered _after_ plugin is registered

		return registration;
	};

	register.attributes = CsrfPlugin.register.attributes;

	return {
		register,
	};
}

export function getAppRoutePlugin(options) {
	return {
		register: appRoutePlugin,
		options,
	};
}
/**
 * configure and return the plugin that
 * allows requests to get anonymous oauth tokens
 * to communicate with the API
 */
export function getRequestAuthPlugin() {
	return {
		register: requestAuthPlugin,
	};
}

export function getLogger(
	options = { logEvents: ['onPostStart', 'onPostStop', 'response'] }
) {
	const onRequestError = (request, err) => {
		console.error(
			JSON.stringify({
				err: err.stack,
				req: pino.stdSerializers.req(request.raw.req),
				res: pino.stdSerializers.res(request.raw.res),
				message: `500 Internal server error: ${err.message}`,
			})
		);
	};
	const register = (server, options, next) => {
		server.on('request-error', onRequestError);
		return HapiPino.register(server, options, next);
	};
	register.attributes = HapiPino.register.attributes;

	options.instance = logger;
	return {
		register,
		options,
	};
}

export function getActivityTrackingPlugin({ agent, isProd }) {
	return {
		register: activityPlugin,
		options: {
			agent,
			isProd,
		},
	};
}

export function getClickTrackingPlugin() {
	return {
		register: clickPlugin,
	};
}

function getServiceWorkerPlugin() {
	return {
		register: serviceWorkerPlugin,
	};
}

export function getApiProxyPlugin() {
	return {
		register: apiProxyPlugin,
	};
}

function getLanguagePlugin() {
	return {
		register: languagePlugin,
	};
}

export default function getPlugins({ languageRenderers }) {
	const { package: { agent }, env: { properties: { isProd } } } = config;
	return [
		getAppRoutePlugin({ languageRenderers }),
		getLogger(),
		getCsrfPlugin(),
		getRequestAuthPlugin(),
		getActivityTrackingPlugin({ agent, isProd }),
		getClickTrackingPlugin(),
		getServiceWorkerPlugin(),
		getApiProxyPlugin(),
		getLanguagePlugin(),
		Inert,
	];
}
