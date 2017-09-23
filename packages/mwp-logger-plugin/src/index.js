import bunyan from 'bunyan';
import logger from './logger';

const onRequestError = (request, err) => {
	logger.error(
		{
			err: err.stack,
			req: bunyan.stdSerializers.req(request.raw.req),
			res: bunyan.stdSerializers.res(request.raw.res),
		},
		`500 Internal server error: ${err.message}`
	);
};

export default function register(server, options, next) {
	// options = options || { logEvents: ['onPostStart', 'onPostStop', 'response'] };
	server.on('request-error', onRequestError);
	server.app.logger = logger;

	next();
}

register.attributes = {
	name: 'mwp-logger-plugin',
	version: '1.0.0',
};

export { default as logger } from './logger'; // named export for easy import
