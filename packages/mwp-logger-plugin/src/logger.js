import bunyan from 'bunyan';
import LoggingBunyan from '@google-cloud/logging-bunyan';

const loggingBunyan = LoggingBunyan();
const streams = [{ stream: process.stdout }]; // stdout by default
if (process.env.GAE_INSTANCE) {
	streams.push(loggingBunyan.stream()); // also write formatted data to `bunyan_log`
}

const logger = bunyan.createLogger({
	name: 'mwp-logger',
	serializers: bunyan.stdSerializers,
	streams,
});

export default logger;
