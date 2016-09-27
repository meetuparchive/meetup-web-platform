import https from 'https';
import Hapi from 'hapi';

import './util/globals';

import getConfig from './util/config';
import getPlugins from './plugins';
import getRoutes from './routes';

/**
 * @module server
 */

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
export function server(routes, connection, plugins=[]) {
	const server = new Hapi.Server();

	return server.connection(connection)
		.register(plugins)
		.then(() => server.log(['start'], `${plugins.length} plugins registered, assigning routes...`))
		.then(() => server.route(routes))
		.then(() => server.log(['start'], `${routes.length} routes assigned, starting server...`))
		.then(() => server.start())
		.then(() => server.log(['start'], `Dev server is listening at ${server.info.uri}`));
}

/**
 * The start function applies the rendering function to the correct application
 * route and combines the provided routes and plugins with the base routes
 * and plugins
 *
 * @param {Object} renderRequestMap A mapping of localeCodes to functions that emit
 *   the rendered HTML for the locale-specific request
 * @param {Array} routes additional routes for the app - cannot include a
 *   wildcard route
 * @param {Array} plugins additional plugins for the server, usually to support
 *   features in the additional routes
 * @return {Promise} the Promise returned by Hapi's `server.connection` method
 */
export default function start(renderRequestMap, options) {
	const {
		routes,
		plugins,
	} = options;
	// source maps make for better stack traces - we might not want this in
	// production if it makes anything slower, though
	// (process.env.NODE_ENV === 'production')
	require('source-map-support').install();

	return getConfig()
		.then(configureEnv)
		.then(config => {
			const baseRoutes = getRoutes(renderRequestMap, config);
			const finalRoutes = [ ...routes, ...baseRoutes ];

			const connection = {
				host: '0.0.0.0',
				port: config.DEV_SERVER_PORT,
			};

			const finalPlugins = [ ...plugins, ...getPlugins(config) ];

			return server(finalRoutes, connection, finalPlugins);
		});
}

