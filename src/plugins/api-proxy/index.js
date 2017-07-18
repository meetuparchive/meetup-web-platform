// @flow
import { duotones, getDuotoneUrls } from './util/duotone';
import getApiProxyRoutes from './routes';
import proxyApi$ from './proxy';

const API_PROXY_PLUGIN_NAME = 'api-proxy';
const API_ROUTE_PATH = '/mu_api';

export default function register(
	server: Object,
	options: { path?: string }, // optional api request pathname
	next: () => void
) {
	server.expose(
		'duotoneUrls',
		getDuotoneUrls(duotones, server.settings.app.photo_scaler_salt)
	);

	// add a method to the `request` object that can call REST API
	server.decorate('request', 'proxyApi$', proxyApi$, { apply: true });
	// add a route that will receive batched query requests
	server.route(getApiProxyRoutes(options.path || API_ROUTE_PATH));

	next();
}

register.attributes = {
	name: API_PROXY_PLUGIN_NAME,
	version: '1.0.0',
	dependencies: [
		'requestAuth',
		'tracking', // provides request.trackApi()
		'electrode-csrf-jwt', // provides csrf protection for POST
	],
};
