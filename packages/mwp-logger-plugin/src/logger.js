import bunyan from 'bunyan';

const logger = bunyan.createLogger({
	name: 'mwp-logger',
	serializers: bunyan.stdSerializers,
});

export default logger;
