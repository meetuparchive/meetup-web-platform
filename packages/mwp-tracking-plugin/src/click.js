// @flow
import clickReader from './util/clickReader';
export { clickMiddleware, clickTrackEnhancer } from './util/clickStore';

export const CLICK_PLUGIN_NAME = 'mwp-click-tracking';

export function onPreHandlerExtension(
	request: HapiRequest,
	h: HapiResponseToolkit
) {
	try {
		const pluginSettings =
			request.route.settings.plugins[CLICK_PLUGIN_NAME] || {};
		if (pluginSettings.click && pluginSettings.click(request)) {
			clickReader(request, h);
		}
	} catch (err) {
		request.server.app.logger.error({ err, context: request, ...request.raw });
	}
	return h.continue;
}

/*
 * The plugin register function that will 'decorate' the `request` interface with
 * all tracking functions returned from `getTrackers`, as well as assign request
 * lifecycle event handlers that can affect the response, e.g. by setting cookies
 */
export function register(server: Object, options: void) {
	server.ext('onPreHandler', onPreHandlerExtension);
}

export const plugin = {
	register,
	name: CLICK_PLUGIN_NAME,
	version: '1.0.0',
	dependencies: [
		'mwp-logger-plugin', // provides server.app.logger
	],
};
