// @flow
import clickTrackingReader from './util/clickTrackingReader';

export const CLICK_PLUGIN_NAME = 'mwp-click-tracking';

export function onPreHandlerExtension(request: HapiRequest, reply: HapiReply) {
	try {
		clickTrackingReader(request, reply);
	} catch (err) {
		console.error(err);
		request.server.app.logger.error(err);
	}
	return reply.continue();
}

/*
 * The plugin register function that will 'decorate' the `request` interface with
 * all tracking functions returned from `getTrackers`, as well as assign request
 * lifecycle event handlers that can affect the response, e.g. by setting cookies
 */
export default function register(
	server: Object,
	options: void,
	next: () => void
) {
	server.ext('onPreHandler', onPreHandlerExtension);

	next();
}

register.attributes = {
	name: CLICK_PLUGIN_NAME,
	version: '1.0.0',
	dependencies: ['hapi-pino'],
};
