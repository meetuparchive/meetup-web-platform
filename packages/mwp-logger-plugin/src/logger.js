import bunyan from 'bunyan';
import bunyanDebugStream from 'bunyan-debug-stream';
import LoggingBunyan from '@google-cloud/logging-bunyan';

/*
 * convert a millisecond value into a 'Duration' object, defined as
 * `{ seconds, nanos }`, where `nanos` is the nanosecond component of the
 * time
 * 
 * https://developers.google.com/protocol-buffers/docs/reference/google.protobuf#google.protobuf.Duration
 */
const formatDuration = ms => {
	const seconds = Math.floor(ms / 1000); // whole seconds
	const nanos = ms % 1000 * 1000 * 1000; // remainder milliseconds in nanoseconds (= ms * 1,000,000)
	return {
		seconds,
		nanos,
	};
};

const serializers = {
	...bunyan.stdSerializers,
};

/*
 * Format a Hapi request object as a Stackdriver httpRequest for pretty logging
 * https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#httprequest
 */
serializers.httpRequest = request => {
	const requestInfo = {
		requestMethod: request.method.toUpperCase(),
		requestUrl: request.url.href,
		requestSize: request.headers['content-length'],
		userAgent: request.headers['user-agent'],
		remoteIp: request.info.remoteAddress,
		serverIp: request.server.info.address, // internal IP
		referer: request.info.referrer,
	};
	if (request.response) {
		requestInfo.responseSize = request.response.headers['content-length'];
		requestInfo.status = request.response.statusCode;
		requestInfo.latency = formatDuration(
			request.info.responded - request.info.received
		);
	}
	return requestInfo;
};

const streams = []; // stdout by default
const {
	NODE_ENV,
	GAE_INSTANCE,
	GCLOUD_PROJECT,
	GAE_VERSION,
	GAE_SERVICE,
} = process.env;
if (!NODE_ENV || NODE_ENV === 'development') {
	streams.push({
		type: 'raw',
		stream: bunyanDebugStream({ forceColor: true, basepath: process.cwd() }),
	});
}

if (GAE_INSTANCE) {
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

if (
	streams.length === 0 &&
	(NODE_ENV !== 'test' || process.argv.includes('--verbose'))
) {
	// fallback if no stream specified
	streams.push({ stream: process.stdout });
}

const logger = bunyan.createLogger({
	name: 'mwp-logger',
	logName: 'mwp-log',
	serializers,
	streams,
});

export default logger;
