import CsrfPlugin from 'electrode-csrf-jwt';
import Good from 'good';
import GoodMeetupTracking from './plugins/good-meetup-tracking';
import requestAuthPlugin from './plugins/requestAuthPlugin';

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

export function getCsrfPlugin(secret) {
	const register = (server, options, next) => {
		const cookieOptions = {
			path: '/',
			isHttpOnly: true,
			isSecure: process.env.NODE_ENV === 'production',
		};
		server.state('x-csrf-jwt', cookieOptions);  // set by plugin
		server.state('x-csrf-jwt-header', cookieOptions);  // set by onPreResponse
		const registration = CsrfPlugin.register(server, options, next);
		server.ext('onPreResponse', setCsrfCookies);  // must add this extension _after_ plugin is registered
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
				tracking: [
					{
						module: 'good-squeeze',
						name: 'Squeeze',
						args: [{
							request: 'tracking'
						}],
					}, {
						module: GoodMeetupTracking,
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
export function getRequestAuthPlugin(options) {
	return {
		register: requestAuthPlugin,
		options,
	};
}

export default function getPlugins(config) {
	return [
		getCsrfPlugin(config.CSRF_SECRET),
		getConsoleLogPlugin(),
		getRequestAuthPlugin(config),
	];
}

