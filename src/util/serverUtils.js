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

	server.decorate('reply', 'track', track(platform_agent));

	return server.connection(connection)
		.register(plugins)
		.then(() => server.auth.strategy('default', 'oauth', true, config))
		.then(() => server.log(['start'], `${plugins.length} plugins registered, assigning routes...`))
		.then(() => server.route(routes))
		.then(() => server.log(['start'], `${routes.length} routes assigned, starting server...`))
		.then(() => server.start())
		.then(() => server.log(['start'], `Dev server is listening at ${server.info.uri}`))
		.then(() => server);
}

