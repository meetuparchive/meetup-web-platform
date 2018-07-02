import logger from './logger';

export function logResponse(request) {
	const { response, route, id, server: { app: { logger } } } = request;

	if (!response) {
		// client hung up
		logger.info({ httpRequest: request, id, ...request.raw });
		return;
	}
	if (response.isBoom) {
		// response is an Error object
		logger.error({
			err: response,
			context: request,
			...request.raw,
		});
	}

	const routePluginSettings = route.settings.plugins['mwp-logger-plugin'];

	if (routePluginSettings && !routePluginSettings.enabled) {
		// short circuit the normal logs for routes that opt-out
		return;
	}

	const log = ((response.statusCode >= 500 && logger.error) ||
		(response.statusCode >= 400 && logger.warn) ||
		logger.info)
		.bind(logger);

	log({ httpRequest: request, id, ...request.raw });

	return;
}

// this might be redundant with the `logResponse` behavior
const onRequestError = (request, event, tags) => {
	if (!tags.error) {
		return;
	}

	const err =
		event.error && event.error.message ? event.error.message : 'unknown error';

	logger.error({
		err: `Request ${event.request} failed: ${err}`,
		context: request,
		...request.raw,
	});
};

const onRequestExtension = (request, h) => {
	// log at debug level to make it easy to filter out
	logger.debug({
		httpRequest: request,
		...request.raw,
	});
	return h.continue;
};

export function register(server, options) {
	// might also want to add default logging for 'onPostStart', 'onPostStop'
	server.ext([
		{
			type: 'onRequest',
			method: onRequestExtension,
		},
	]);
	server.events.on({ name: 'request', channels: 'error' }, onRequestError);
	server.events.on('response', logResponse);
	server.app.logger = logger;
}

export {
	default as logger,
	httpRequestSerializers as serializers,
	MetricLogging,
} from './logger'; // named export for easy import

exports.plugin = {
	register,
	name: 'mwp-logger-plugin',
	version: '1.0.0',
};
