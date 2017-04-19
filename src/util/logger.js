import pino from 'pino';


const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

const reqSerializerDev = req => `${req.method.toUpperCase()} ${req.url.href}`;
const resSerializerDev = res => res.statusCode;

const logger = pino({
	prettyPrint: isDev,
	timestamp: isDev,
	messageKey: 'message',
	enabled: !isTest,
	serializers: {
		req: isDev ? reqSerializerDev : pino.stdSerializers.req,
		res: isDev ? resSerializerDev : pino.stdSerializers.res,
	}
});

export default logger;

