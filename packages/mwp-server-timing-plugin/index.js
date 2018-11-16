// @flow
import newrelic from 'newrelic';
const PLUGIN_NAME = 'mwp-server-timing-plugin';

export const setPluginState = (
	request: HapiRequest,
	h: HapiResponseToolkit
) => {
	request.plugins[PLUGIN_NAME] = { values: [] };
	return h.continue;
};

const mapValuesToHeader = ([name, duration, description]) =>
	`${name};dur=${duration};desc=${JSON.stringify(description)}`;

export const setTimingHeader = (
	request: HapiRequest,
	h: HapiResponseToolkit
) => {
	const { response } = request;
	if (response) {
		response.header(
			'server-timing',
			request.plugins[PLUGIN_NAME].values.map(mapValuesToHeader).join(', '),
			{ append: true, separator: ', ' }
		);
	}
	return h.continue;
};

const createTracer = (request: HapiRequest) => (name, handler, description) => {
	const wrappedHandler = (...args) => {
		handler.apply(handler, args);
		const duration = Date.now() - start;
		request.plugins[PLUGIN_NAME].values.push([name, duration, description]);
	};
	const newRelicTraceable = newrelic.startSegment(name, true, wrappedHandler);
	const start = Date.now();
	return newRelicTraceable;
};

export function register(server: HapiServer, options: void) {
	server.decorate('request', 'createTracer', createTracer);
	server.ext('onRequest', setPluginState);
	server.ext('onPreResponse', setTimingHeader);
}
