import https from 'https';
import Hapi from 'hapi';
import uuid from 'uuid';

import track from './tracking';
import clickTrackingReader from './clickTrackingReader';

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
	request.id = uuid.v4();

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

	clickTrackingReader(request, reply);
	return reply.continue();
}

export function logResponse(request) {
	const {
		headers,
		id,
		info,
		method,
		response,
		url,
	} = request;

	if (response.isBoom) {
		// response is an Error object
		console.error(JSON.stringify({
			message: `Internal error ${response.message} ${url.pathname}`,
			info: {
				error: response.stack,
				headers,
				id,
				method,
				url,
			},
		}));
		return;
	}

	const log = response.statusCode >= 400 && console.error ||
		response.statusCode >= 300 && console.warn ||
		console.log;

	log(JSON.stringify({
		message: `Outgoing response ${method.toUpperCase()} ${url.pathname} ${response.statusCode}`,
		type: 'response',
		direction: 'out',
		info: {
			headers: response.headers,
			id,
			method,
			referrer: info.referrer,
			remoteAddress: info.remoteAddress,
			time: info.responded - info.received,
			url,
		}
	}));

	return;
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
	}]);
	server.on('response', logResponse);
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
		...config
	};
	server.decorate('reply', 'track', track(platform_agent));

	const appConnection = server.connection(connection);
	return appConnection
		.register(plugins)
		.then(() => registerExtensionEvents(server))
		.then(() => server.auth.strategy('default', 'oauth', true))
		.then(() => server.log(['start'], `${plugins.length} plugins registered, assigning routes...`))
		.then(() => appConnection.route(routes))
		.then(() => server.log(['start'], `${routes.length} routes assigned, starting server...`))
		.then(() => server.start())
		.then(() => server.log(['start'], `Dev server is listening at ${server.info.uri}`))
		.then(() => server);
}

