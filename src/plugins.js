import CsrfPlugin from 'electrode-csrf-jwt';
import Good from 'good';

import config from './util/config';
import GoodTracking from './plugins/good-tracking';
import requestAuthPlugin from './plugins/requestAuthPlugin';

import {
	activitySerializer,
	clickSerializer,
} from './util/avro';


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
 * @param {String} secret the 'salt' for encoding the CSRF tokens
 * @return {Object} the { register, options } object for a `server.register` call.
 */
export function getCsrfPlugin(secret) {
	const register = (server, options, next) => {
		const cookieOptions = {
			path: '/',
			isSecure: config.get('isProd')
		};
		server.state(
			'x-csrf-jwt',  // set by plugin
			{ ...cookieOptions, isHttpOnly: true }  // no client-side interaction needed
		);
		server.state(
			'x-csrf-jwt-header',  // set by onPreResponse
			{ ...cookieOptions, isHttpOnly: false } // the client must read this cookie and return as a custom header
		);

		const registration = CsrfPlugin.register(server, options, next);
		server.ext('onPreResponse', setCsrfCookies);  // this extension must be registered _after_ plugin is registered

		return registration;
	};
	register.attributes = CsrfPlugin.register.attributes;
	return {
		register,
		options: {
			secret,
		}
	};
}

/**
 * Provides Hapi process monitoring and console logging
 *
 * @see {@link https://github.com/hapijs/good}
 */
export function getConsoleLogPlugin() {
	const logFilter = process.env.LOG_FILTER || { include: [], exclude: ['tracking'] };
	return {
		register: Good,
		options: {
			ops: false,  // no ops reporting (for now)
			reporters: {
				console: [
					{  // filter events with good-squeeze
						module: 'good-squeeze',
						name: 'Squeeze',
						args: [{
							error: logFilter,
							log: logFilter,
						}]
					}, {  // format with good-console
						module: 'good-console',
						args: [{
							format: 'YYYY-MM-DD HH:mm:ss.SSS',
						}]
					},
					'stdout'  // pipe to stdout
				],
				activity: [
					{
						module: 'good-squeeze',
						name: 'Squeeze',
						args: [{
							request: 'activity'
						}],
					}, {
						module: GoodTracking,
						args: [ activitySerializer ],
					},
					'stdout'
				],
				click: [
					{
						module: 'good-squeeze',
						name: 'Squeeze',
						args: [{
							request: 'click'
						}],
					}, {
						module: GoodTracking,
						args: [ clickSerializer ],
					},
					'stdout'
				],
			}
		}
	};
}

/**
 * configure and return the plugin that will allow requests to get anonymous
 * oauth tokens to communicate with the API
 */
export function getRequestAuthPlugin() {
	const options = config.getProperties();
	return {
		register: requestAuthPlugin,
		options,
	};
}

export default function getPlugins() {
	return [
		getCsrfPlugin(config.get('csrf_token')),
		getConsoleLogPlugin(),
		getRequestAuthPlugin(),
	];
}

