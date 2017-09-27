import bunyan from 'bunyan';
import LoggingBunyan from '@google-cloud/logging-bunyan';

const streams = [{ stream: process.stdout }]; // stdout by default
if (process.env.GAE_INSTANCE) {
	console.log('Activating GAE logging');
	streams.push(
		LoggingBunyan({
			resource: {
				type: 'gae_app',
				labels: {
					project_id: process.env.GCLOUD_PROJECT,
					version_id: process.env.GAE_VERSION,
				},
			},
		}).stream()
	);
}

const logger = bunyan.createLogger({
	name: 'mwp-logger',
	logName: 'mwp-log',
	serializers: bunyan.stdSerializers,
	streams,
});

export default logger;
