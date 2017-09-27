import bunyan from 'bunyan';
import LoggingBunyan from '@google-cloud/logging-bunyan';

const streams = [{ stream: process.stdout }]; // stdout by default
const { GAE_INSTANCE, GCLOUD_PROJECT, GAE_VERSION, GAE_SERVICE } = process.env;
if (GAE_INSTANCE) {
	console.log(
		`Activating GAE logging for ${GCLOUD_PROJECT} - ${GAE_SERVICE} v${GAE_VERSION}`
	);
	streams.push(
		LoggingBunyan({
			resource: {
				type: 'gae_app',
				labels: {
					project_id: GCLOUD_PROJECT,
					module_id: GAE_SERVICE,
					version_id: GAE_VERSION,
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
