// @flow
const log = require('mwp-logger-plugin').logger;
const avro = require('avsc');

const canUsePubSub =
	process.env.GAE_INSTANCE || process.env.GOOGLE_APPLICATION_CREDENTIALS;

/*
 * There are currently 2 distinct analytics logging methods
 * 1. `stdout`: used in dev and compatible with https://github.com/meetup/blt-fluentd
 *    in k8s-based applications in GCP 
 * 2. Google Pub/Sub, which is used in GAE and any environment with GOOGLE_APPLICATION_CREDENTIALS
 *    environment variable set to point toward Google JSON client credentials file
 *
 * @see https://meetup.atlassian.net/wiki/display/MUP/Analytics+Logging#AnalyticsLogging-Theinputmechanism
 */
const getPlatformAnalyticsLog = (
	usePubSub: ?string = canUsePubSub
): (string => void) => {
	if (usePubSub) {
		const pubsub = require('@google-cloud/pubsub')({
			projectId: 'meetup-prod',
		});
		const publisher = pubsub.topic('analytics-log-json').publisher();
		return (serializedRecord: string) => {
			publisher
				.publish(new Buffer(serializedRecord))
				.catch(err => log.error(err));
		};
	}

	// stdout log - can be used with https://github.com/meetup/blt-fluentd or generic environment
	return (serializedRecord: string) => {
		process.stdout.write(`analytics=${serializedRecord}\n`);
	};
};

const analyticsLog = getPlatformAnalyticsLog();
const debugLog = deserializedRecord =>
	console.log(JSON.stringify(deserializedRecord));

// currently the schema is manually copied from
// https://github.dev.meetup.com/meetup/meetup/blob/master/modules/base/src/main/versioned_avro/Click_v2.avsc
const click = {
	namespace: 'com.meetup.base.avro',
	type: 'record',
	name: 'Click',
	doc: 'v2',
	fields: [
		{ name: 'timestamp', type: 'string' },
		{ name: 'requestId', type: 'string' },
		{ name: 'memberId', type: 'int' },
		{ name: 'lineage', type: 'string' },
		{ name: 'linkText', type: 'string' },
		{ name: 'coordX', type: 'int' },
		{ name: 'coordY', type: 'int' },
		{ name: 'tag', type: 'string', default: '' },
	],
};

// currently the schema is manually copied from
// https://github.com/meetup/meetup/blob/master/modules/base/src/main/versioned_avro/Activity_v8.avsc
const activity = {
	namespace: 'com.meetup.base.avro',
	type: 'record',
	name: 'Activity',
	doc: 'v8',
	fields: [
		{ name: 'requestId', type: 'string' },
		{ name: 'timestamp', type: 'string' },
		{ name: 'url', type: 'string' },
		{ name: 'aggregratedUrl', type: 'string', default: '' }, // it's misspelled in the original spec
		{ name: 'ip', type: 'string', default: '' },
		{ name: 'agent', type: 'string', default: '' },
		{ name: 'memberId', type: 'int' },
		{ name: 'trackId', type: 'string' },
		{ name: 'mobileWeb', type: 'boolean' },
		{ name: 'platform', type: 'string' },
		{ name: 'referer', type: 'string' }, // it's misspelled in the original spec
		{ name: 'trax', type: { type: 'map', values: 'string' } },
		{
			name: 'platformAgent',
			type: {
				type: 'enum',
				name: 'PlatformAgent',
				symbols: [
					'WEB',
					'MUP_WEB',
					'PRO_WEB',
					'NATIVE',
					'NATIVE_APP_WEB_VIEW',
					'THIRD_PARTY_UNKNOWN',
					'UNKNOWN',
				],
			},
			default: 'UNKNOWN',
		},
		{ name: 'isUserActivity', type: 'boolean', default: true },
		{ name: 'browserId', type: 'string', default: '' },
		{ name: 'parentRequestId', type: ['null', 'string'], default: null },
		{ name: 'oauthConsumerId', type: ['null', 'int'], default: null },
		{ name: 'apiVersion', type: ['null', 'string'], default: null },
		{ name: 'viewName', type: ['null', 'string'], default: null },
		{ name: 'subViewName', type: ['null', 'string'], default: null },
	],
};

type Serializer = Object => string;
type Deserializer = string => Object;

const avroSerializer: Object => Serializer = schema => {
	const codec = avro.parse(schema);
	const schemaPath = `gs://meetup-logs/avro_schemas/${schema.name}_${schema.doc}.avsc`;
	return data => {
		const record = codec.toBuffer(data);
		// data.timestamp _must_ be ISOString if it exists
		const timestamp = data.timestamp || new Date().toISOString();
		const analytics = {
			record: record.toString('base64'),
			schema: schemaPath,
			date: timestamp.substr(0, 10), // YYYY-MM-DD
		};
		return JSON.stringify(analytics);
	};
};

const avroDeserializer: Object => Deserializer = schema => {
	const codec = avro.parse(schema);
	return serialized => {
		const { record } = JSON.parse(serialized);
		const avroBuffer = new Buffer(record, 'base64');
		return codec.fromBuffer(avroBuffer);
	};
};

const logger = (serializer: Serializer, deserializer: Deserializer) => (
	record: Object
) => {
	const serializedRecord = serializer(record);
	const deserializedRecord = deserializer(serializedRecord);
	analyticsLog(serializedRecord);
	if (process.argv.includes('--debug')) {
		debugLog(deserializedRecord);
	}
};

const schemas = {
	activity,
	click,
};
const serializers = {
	avro: avroSerializer,
	activity: avroSerializer(schemas.activity),
	click: avroSerializer(schemas.click),
};
const deserializers = {
	avro: avroDeserializer,
	activity: avroDeserializer(schemas.activity),
	click: avroDeserializer(schemas.click),
};
const loggers = {
	activity: logger(serializers.activity, deserializers.activity),
	click: logger(serializers.click, deserializers.click),
};

module.exports = {
	avroSerializer,
	getPlatformAnalyticsLog,
	schemas,
	serializers,
	deserializers,
	loggers,
};
