import logger from './logger';

export function logResponse(request) {
	const { response, id, server: { app: { logger } } } = request;

	if (response.isBoom) {
		// response is an Error object
		logger.error({
			err: response,
			...request.raw,
		});
	}

	const log = ((response.statusCode >= 500 && logger.error) ||
		(response.statusCode >= 400 && logger.warn) ||
		logger.info)
		.bind(logger);

	const routePluginSettings =
		request.route.settings.plugins['mwp-logger-plugin'];
	if (!routePluginSettings || routePluginSettings.enabled) {
		log({ httpRequest: request, id });
	}

	return;
}

const onRequestError = (request, err) => {
	logger.error({
		err,
		...request.raw,
	});
};

export default function register(server, options, next) {
	// might also want to add default logging for 'onPostStart', 'onPostStop',
	//'response' in the future
	const onRequestExtension = (request, reply) => {
		logger.debug({
			httpRequest: request,
			...request.raw,
		});
		return reply.continue();
	};

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

export { default as logger } from './logger'; // named export for easy import
