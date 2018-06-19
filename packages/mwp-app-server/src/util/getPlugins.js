import Inert from 'inert';
import CsrfPlugin from 'electrode-csrf-jwt';

import config from 'mwp-config';
import loggerPlugin from 'mwp-logger-plugin';
import appRoutePlugin from 'mwp-app-route-plugin';
import requestAuthPlugin from 'mwp-auth-plugin';
import activityPlugin from 'mwp-tracking-plugin/lib/activity';
import clickPlugin from 'mwp-tracking-plugin/lib/click';
import languagePlugin from 'mwp-language-plugin';
import serviceWorkerPlugin from 'mwp-sw-plugin';
import apiProxyPlugin from 'mwp-api-proxy-plugin';

/**
 * Hapi plugins for the dev server
 *
 * @module ServerPlugins
 */

export function setCsrfCookies(request, h) {
	const csrfHeader = (request.response.headers || {})['x-csrf-jwt'];
	if (csrfHeader) {
		h.state('x-csrf-jwt-header', csrfHeader);
	}
	return h.continue();
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
	return {
		register: loggerPlugin,
		options,
	};
}

export function getActivityTrackingPlugin({ agent, isProdApi }) {
	return {
		register: activityPlugin,
		options: {
			agent,
			isProdApi,
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
	const { package: { agent }, getServer } = config;
	return [
		getAppRoutePlugin({ languageRenderers }),
		getApiProxyPlugin(),
		getLanguagePlugin(),
		getLogger(),
		getCsrfPlugin(),
		getRequestAuthPlugin(),
		getActivityTrackingPlugin({
			agent,
			isProdApi: getServer().properties.api.isProd,
		}),
		getClickTrackingPlugin(),
		getServiceWorkerPlugin(),
		Inert,
	];
}
