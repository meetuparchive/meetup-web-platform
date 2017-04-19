import fs from 'fs';
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

	request.server.logger()
		.info(`Incoming request ${request.method.toUpperCase()} ${request.url.href}`);

	return reply.continue();
}

export function onPreHandlerExtension(request, reply) {
	try {
		clickTrackingReader(request, reply);
	} catch(err) {
		console.error(err);
		request.server.logger().error(err);
	}
	return reply.continue();
}

export function onResponse(request) {
	logResponse(request);
	if (request.app.upload) {
		fs.unlink(request.app.upload, err => {
			if (err) {
				request.server.logger().error(
					{ info: request.app.upload },
					'Could not delete uploaded file'
				);
			}
		});
	}
}

export function logResponse(request) {
	const {
		method,
		response,
		id,
		info,
		server,
		url,
	} = request;

	const logger = server.logger();
	if (response.isBoom) {
		// response is an Error object
		logger.error(`Internal error ${response.message} ${url.pathname}`,
			{ error: response.stack }
		);
		return;
	}

	const log = (response.statusCode >= 400 && logger.error ||
		response.statusCode >= 300 && logger.warn ||
		logger.info).bind(logger);

	log(
		{
			headers: response.headers,
			id,
			method,
			referrer: info.referrer,
			remoteAddress: info.remoteAddress,
			time: info.responded - info.received,
			href: url.href,
		},
		`Outgoing response ${method.toUpperCase()} ${url.pathname} ${response.statusCode}`
	);

	return;
}

/**
 * Use server.ext to add functions to request/server extension points
 * @see {@link https://hapijs.com/api#request-lifecycle}
 * @param {Object} server Hapi server
 * @return {Object} Hapi server
 */
export function registerExtensionEvents(server) {
	server.ext([{
		type: 'onRequest',
		method: onRequestExtension,
	}, {
		type: 'onPreHandler',
		method: onPreHandlerExtension,
	}]);
	server.on('response', onResponse);
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
		...server.app,
		isDevConfig: checkForDevUrl(config),  // indicates dev API or prod API
		...config
	};
	server.decorate('reply', 'track', track(platform_agent));

	const appConnection = server.connection(connection);
	return appConnection
		.register(plugins)
		.then(() => registerExtensionEvents(server))
		.then(() => server.auth.strategy('default', 'oauth', true))
		.then(() => appConnection.route(routes))
		.then(() => server.start())
		.then(() => server);
}

