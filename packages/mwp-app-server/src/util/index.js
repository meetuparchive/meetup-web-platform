import https from 'https';
import Hapi from 'hapi';
import uuid from 'uuid';

/**
 * determine whether a nested object of values has
 * a string that contains `.dev.meetup.`
 *
 * @param {String|Object} value string or nested object
 * with values that could be URL strings
 *
 * @return {Boolean} whether the `value` contains a 'dev' URL string
 */
export function checkForDevUrl(value) {
	switch (typeof value) {
		case 'string':
			return value.indexOf('.dev.meetup.') > -1;
		case 'object':
			return Object.keys(value).some(key => checkForDevUrl(value[key]));
	}

	return false;
}

export function onRequestExtension(request, reply) {
	request.id = uuid.v4(); // provide uuid for request instead of default Hapi id
	return reply.continue();
}

/**
 * Use server.ext to add functions to request/server extension points
 * @see {@link https://hapijs.com/api#request-lifecycle}
 * @param {Object} server Hapi server
 * @return {Object} Hapi server
 */
export function registerExtensionEvents(server) {
	server.ext([
		{
			type: 'onRequest',
			method: onRequestExtension,
		},
	]);
	return server;
}

/**
 * Make any environment changes that need to be made in response to the provided
 * config
 *
 * @param {Object} config the environment configuration object
 *
 * @return null
 */
export function configureEnv(config) {
	// When using .dev.meetup endpoints, ignore self-signed SSL cert
	const USING_DEV_ENDPOINTS = checkForDevUrl(config);

	https.globalAgent.options.rejectUnauthorized = !USING_DEV_ENDPOINTS;
}

/**
 * server-starting function
 */
export function server(routes, connection, plugins, config) {
	const server = new Hapi.Server();

	// store runtime state - must modify existing server.settings.app in order to keep
	// previously-defined properties
	// https://hapijs.com/api#serverapp
	server.settings.app = Object.assign(server.settings.app || {}, config);

	const appConnection = server.connection(connection);
	return appConnection
		.register(plugins)
		.then(() => registerExtensionEvents(server))
		.then(() => server.auth.strategy('default', 'oauth', true))
		.then(() => appConnection.route(routes))
		.then(() => server.start())
		.then(() => server);
}
