import './util/globals';

import fs from 'fs';
import Http2 from 'spdy'; // eventually this will be a native node module

import config from 'mwp-config';

import getRoutes from './routes';
import getPlugins from './util/getPlugins';
import { configureEnv, server } from './util';

const appConfig = config.getServer().properties;

/**
 * @module server
 */

/**
 * The start function applies the rendering function to the correct application
 * route and combines the provided routes and plugins with the base routes
 * and plugins
 *
 * @param {Object} languageRenderers A mapping of localeCodes to functions that emit
 *   the rendered HTML for the locale-specific request
 * @param {Array} routes additional routes for the app - cannot include a
 *   wildcard route
 * @param {Array} plugins additional plugins for the server, usually to support
 *   features in the additional routes
 * @return {Promise} the Promise returned by Hapi's `server.connection` method
 */
export default function start(
	languageRenderers,
	{ routes = [], plugins = [] }
) {
	// source maps make for better stack traces
	// we might not want this in production if it makes anything slower
	require('source-map-support').install();

	configureEnv(appConfig);

	const baseRoutes = getRoutes();
	const finalRoutes = [...routes, ...baseRoutes];

	const serverConfig = {
		host: '0.0.0.0',
		port: appConfig.app_server.port,

		// accessed via server.settings.app
		app: appConfig,

		// accessed via server.settings.plugins
		plugins: {
			'electrode-csrf-jwt': {
				enabled: false,
			},
			'mwp-logger-plugin': {
				enabled: true,
			},
		},
	};

	if (appConfig.app_server.protocol === 'https') {
		// enable https
		serverConfig.tls = true;

		// enable HTTP/2
		serverConfig.listener = Http2.createServer({
			key: fs.readFileSync(appConfig.app_server.key_file),
			cert: fs.readFileSync(appConfig.app_server.crt_file),
		});
	}

	const finalPlugins = [...plugins, ...getPlugins({ languageRenderers })];

	appConfig.supportedLangs = Object.keys(languageRenderers);
	return server(serverConfig, finalRoutes, finalPlugins, appConfig);
}
