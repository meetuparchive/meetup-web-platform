import logger from './logger';

export function logResponse(request) {
	const {
		response,
		route,
		id,
		server: {
			app: { logger },
		},
	} = request;

	const logRequestObj = {
		request: request.raw.req,
		headers: request.raw.headers,
		response: request.raw.resp,
	};

	if (!response) {
		// client hung up
		logger.info({ id, ...logRequestObj });
		return;
	}

	if (response.isBoom) {
		// response is an Error object
		logger.error({
			err: response,
			...logRequestObj,
		});
	}

	const routePluginSettings = route.settings.plugins['mwp-logger-plugin'];

	if (routePluginSettings && !routePluginSettings.enabled) {
		// short circuit the normal logs for routes that opt-out
		return;
	}

	const log = (
		(response.statusCode >= 500 && logger.error) ||
		(response.statusCode >= 400 && logger.warn) ||
		logger.info
	).bind(logger);

	log({ id, ...logRequestObj });

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
		req: request.raw.req,
		headers: request.raw.headers,
		res: request.raw.res,
	});
};

export function register(server, options) {
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
