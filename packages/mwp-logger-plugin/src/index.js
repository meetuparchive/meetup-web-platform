import pino from 'pino';
import HapiPino from 'hapi-pino';
import logger from './logger';

const onRequestError = (request, err) => {
	console.error(
		JSON.stringify({
			err: err.stack,
			req: pino.stdSerializers.req(request.raw.req),
			res: pino.stdSerializers.res(request.raw.res),
			message: `500 Internal server error: ${err.message}`,
		})
	);
};

const register = (server, options, next) => {
	options = options || { logEvents: ['onPostStart', 'onPostStop', 'response'] };
	options.instance = logger;
	server.on('request-error', onRequestError);
	return HapiPino.register(server, options, next);
};
register.attributes = HapiPino.register.attributes;

export default register;
export logger from './logger'; // named export for easy import
