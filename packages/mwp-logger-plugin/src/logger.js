import pino from 'pino';

const prettyPrint = process.env.NODE_ENV !== 'production';
const enabled = process.env.NODE_ENV !== 'test'; // don't print when running tests

const reqSerializerDev = req => `${req.method.toUpperCase()} ${req.url.href}`;
const resSerializerDev = res => res.statusCode;

const pretty = pino.pretty({
	forceColor: true,
	messageKey: 'message', // Stackdriver uses this key for log summary
});

pretty.pipe(process.stdout);

const logger = pino(
	{
		timestamp: prettyPrint, // prod logs provide their own timestamp
		messageKey: 'message', // Stackdriver uses this key for log summary
		enabled,
		serializers: {
			req: prettyPrint ? reqSerializerDev : pino.stdSerializers.req,
			res: prettyPrint ? resSerializerDev : pino.stdSerializers.res,
		},
	},
	prettyPrint ? pretty : process.stdout
);

export default logger;
