// @flow
import fs from 'fs';
import util from 'util';
import { duotones, getDuotoneUrls } from './util/duotone';
import getApiProxyRoutes from './routes';
import proxyApi$ from './proxy';

export const API_PROXY_PLUGIN_NAME = 'api-proxy';
export const API_ROUTE_PATH = '/mu_api';

/*
 * When response is sent, the plugin needs to delete any files that were
 * uploaded to the POST/PATCH endpoint
 */
const onResponse = request => {
	const { uploads } = request.plugins.apiProxy;
	const { logger } = request.server.app;
	if (uploads.length) {
		const info = { info: uploads, req: request.raw.req };
		// $FlowFixMe - promisify not yet defined in flow-typed
		Promise.all(uploads.map(util.promisify(fs.unlink))).then(
			() => {
				logger.info(info, 'Deleted uploaded file(s)');
			},
			err => {
				logger.error(info, 'Could not delete uploaded file(s)');
			}
		);
	}
};

export const setPluginState = (request: HapiRequest, reply: HapiReply) => {
	request.plugins.apiProxy = {
		setState: reply.state, // allow plugin to proxy cookies from API
		uploads: [], // keep track of any files that were uploaded
	};

	return reply.continue();
};

export default function register(
	server: Object,
	options: void,
	next: () => void
) {
	// supply duotone urls through `server.plugins['api-proxy'].duotoneUrls`
	server.expose(
		'duotoneUrls',
		getDuotoneUrls(duotones, server.settings.app.photo_scaler_salt)
	);

	// add a method to the `request` object that can call REST API
	server.decorate('request', 'proxyApi$', proxyApi$, { apply: true });
	// plugin state must be available to all routes that use `request.proxyApi$`
	server.ext('onRequest', setPluginState);
	// clean up request state once response is sent
	server.on('response', onResponse);

	// add a route that will receive query requests as querystring params
	const routes = getApiProxyRoutes(API_ROUTE_PATH);
	server.route(routes);

	next();
}

register.attributes = {
	name: API_PROXY_PLUGIN_NAME,
	version: '1.0.0',
	dependencies: [
		'requestAuth', // provides request.plugins.requestAuth.oauth_token
		'tracking', // provides request.trackApi()
		'electrode-csrf-jwt', // provides csrf protection for POST
	],
};
