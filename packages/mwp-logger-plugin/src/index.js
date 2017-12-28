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
const onRequestError = (request, err) => {
	logger.error({
		err,
		context: request,
		...request.raw,
	});
};

const onRequestExtension = (request, reply) => {
	// log at debug level to make it easy to filter out
	logger.debug({
		httpRequest: request,
		...request.raw,
	});
	return reply.continue();
};

export default function register(server, options, next) {
	// might also want to add default logging for 'onPostStart', 'onPostStop'
	server.ext([
		{
			type: 'onRequest',
			method: onRequestExtension,
		},
	]);
	server.on('request-error', onRequestError);
	server.on('response', logResponse);
	server.app.logger = logger;

	next();
}

register.attributes = {
	name: 'mwp-logger-plugin',
	version: '1.0.0',
};

export {
	default as logger,
	httpRequestSerializers as serializers,
} from './logger'; // named export for easy import
