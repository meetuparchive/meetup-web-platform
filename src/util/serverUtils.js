import https from 'https';
import Hapi from 'hapi';

import track from './tracking';

/**
 * determine whether a nested object of values contains a string that contains
 * `.dev.meetup.`
 * @param {String|Object} value string or nested object with
 * values that could be URL strings
 * @return {Boolean} whether the `value` contains a 'dev' URL string
 */
export function checkForDevUrl(value) {
	switch(typeof value) {
	case 'string':
		return value.indexOf('.dev.meetup.') > -1;
	case 'object':
		return Object.keys(value).some(key => checkForDevUrl(value[key]));
	}
	return false;
}

export function onRequestExtension(request, reply) {
	console.log(JSON.stringify({
		message: `Incoming request ${request.method.toUpperCase()} ${request.url.href}`,
		type: 'request',
		direction: 'in',
		info: {
			url: request.url,
			method: request.method,
			headers: request.headers,
			id: request.id,
			referrer: request.info.referrer,
			remoteAddress: request.info.remoteAddress,
		}
	}));
	reply.continue();
}

function onPreResponseExtension(request, reply) {
	const {
		headers,
		id,
		info,
		method,
		response,
		url,
	} = request;
	console.log(JSON.stringify({
		message: `Outgoing response ${method.toUpperCase()} ${url} ${response.statusCode}`,
		type: 'response',
		direction: 'out',
		info: {
			url,
			method,
			headers,
			id,
			referrer: info.referrer,
			remoteAddress: info.remoteAddress,
			time: info.responded - info.received
		}
	}));
	reply.continue();
}

/**
 * Use server.ext to add functions to request/server extension points
 * @param {Object} server Hapi server
 * @return {Object} Hapi server
 */
export function registerExtensionEvents(server) {
	server.ext([{
		type: 'onRequest',
		method: onRequestExtension,
	}, {
		type: 'onPreResponse',
		method: onPreResponseExtension,
	}]);
	return server;
}

/**
 * Make any environment changes that need to be made in response to the provided
 * config
 * @param {Object} config
 * @return {Object} the original config object
 */
export function configureEnv(config) {
	// When using .dev.meetup endpoints, ignore self-signed SSL cert
	const USING_DEV_ENDPOINTS = checkForDevUrl(config);
	https.globalAgent.options.rejectUnauthorized = !USING_DEV_ENDPOINTS;

	return config;
}

/**
 * server-starting function
 */
export function server(routes, connection, plugins, platform_agent, config) {
	const server = new Hapi.Server();

	// store runtime state
	// https://hapijs.com/api#serverapp
	server.app = {
		isDevConfig: checkForDevUrl(config),  // indicates dev API or prod API
	};
	server.decorate('reply', 'track', track(platform_agent));

	return server.connection(connection)
		.register(plugins)
		.then(() => registerExtensionEvents(server))
		.then(() => server.auth.strategy('default', 'oauth', true, config))
		.then(() => server.log(['start'], `${plugins.length} plugins registered, assigning routes...`))
		.then(() => server.route(routes))
		.then(() => server.log(['start'], `${routes.length} routes assigned, starting server...`))
		.then(() => server.start())
		.then(() => server.log(['start'], `Dev server is listening at ${server.info.uri}`))
		.then(() => server);
}

