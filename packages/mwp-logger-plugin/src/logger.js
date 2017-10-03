import http from 'http';
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
 * These serializers correspond to the 2 major types of 'request'/'response'
 * objects that are used in MWP apps - Hapi requests and http.IncomingMessage
 * responses that are returned from the `request` library for server-to-server
 * requests.
 */
export const httpRequestSerializers = {
	hapi: request => {
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
	},
	incomingMessage: message => {
		const messageInfo = {
			requestMethod: message.request.method.toUpperCase(),
			requestUrl: message.request.uri.href,
			responseSize: message.body.length,
			status: message.statusCode,
			latency: message.elapsedTime && formatDuration(message.elapsedTime),
			userAgent: message.request.headers['user-agent'],
			remoteIp:
				message.request.headers['x_forwarded_for'] ||
				message.request.headers['remote_addr'],
			referer: message.request.headers['referer'],
		};
		return messageInfo;
	},
};

/*
 * Parse an http.IncomingMessage instance from `request` into an error `context`
 * object defined by https://cloud.google.com/error-reporting/docs/formatting-error-messages
 */
const errorContextSerializers = {
	hapi: request => ({
		httpRequest: {
			method: request.method.toUpperCase(),
			url: request.url.href,
			userAgent: request.headers['user-agent'],
			referrer: request.headers['referer'],
			responseStatusCode: (request.response || {}).statusCode || 500,
			remoteIp:
				request.headers['x_forwarded_for'] || request.headers['remote_addr'],
		},
	}),
	incomingMessage: response => ({
		httpRequest: {
			method: response.request.method.toUpperCase(),
			url: response.request.uri.href,
			userAgent: response.request.headers['user-agent'],
			referrer: response.request.headers['referer'],
			responseStatusCode: response.statusCode,
			remoteIp:
				response.request.headers['x_forwarded_for'] ||
				response.request.headers['remote_addr'],
		},
	}),
};

serializers.context = request => {
	const { hapi, incomingMessage } = errorContextSerializers;
	// choose the serializer based on the type of the object
	if (request.server) {
		// assume a Hapi request
		return hapi(request);
	}
	if (request instanceof http.IncomingMessage) {
		return incomingMessage(request);
	}
	return request;
};
/*
 * Format a Hapi request object as a Stackdriver httpRequest for pretty logging
 * https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#httprequest
 */
serializers.httpRequest = request => {
	const { hapi, incomingMessage } = httpRequestSerializers;
	// choose the serializer based on the type of the object
	if (request.server) {
		// assume a Hapi request
		return hapi(request);
	}
	if (request instanceof http.IncomingMessage) {
		return incomingMessage(request);
	}
	logger.warn(request, 'Unsupported httpRequest object');
	return {};
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
	const GAELogger = LoggingBunyan({
		logName: 'mwp_log',
		resource: {
			type: 'gae_app',
			labels: {
				project_id: GCLOUD_PROJECT,
				module_id: GAE_SERVICE,
				version_id: GAE_VERSION,
			},
		},
	}).stream();
	GAELogger.on('error', err =>
		console.error({ logName: 'mwp_log', payload: { message: err.stack } })
	);

	streams.push(
		LoggingBunyan({
			logName: 'mwp_log',
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
	serializers,
	streams,
});

export default logger;
