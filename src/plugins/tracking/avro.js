// @flow
const log = require('../../util/logger').default;
const avro = require('avsc');

/*
 * There are currently 2 distinct analytics logging methods
 * 1. `stdout`, which will be consumed automatically from apps running in
 *    Google Container Engine
 * 2. Google Pub/Sub, which is used from inside Google App Engine
 *
 * The Pub/Sub setup _only_ works when the environment is configured to
 * automatically authorize Pub/Sub messages, so we use an `isGAE` env variable
 * to determine whether the app is running in GAE.
 *
 * @see https://meetup.atlassian.net/wiki/display/MUP/Analytics+Logging#AnalyticsLogging-Theinputmechanism
 */
const getPlatformAnalyticsLog = (
	isGAE: ?string = process.env.GAE_INSTANCE
): (string => void) => {
	if (isGAE) {
		const pubsub = require('@google-cloud/pubsub')();
		const analyticsLog = pubsub.topic('analytics-log-json');
		return (serializedRecord: string) => {
			analyticsLog.publish(serializedRecord).then(
				(messageIds, apiResponse) => {
					if (messageIds) {
						log.info({ messageIds }, 'GAE PubSub');
					}
				},
				err => log.error(err)
			);
		};
	}
	return (serializedRecord: string) => {
		process.stdout.write(`analytics=${serializedRecord}\n`);
	};
};

const analyticsLog = getPlatformAnalyticsLog();

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
// https://github.dev.meetup.com/meetup/meetup/blob/master/modules/base/src/main/versioned_avro/Activity_v3.avsc
const activity = {
	namespace: 'com.meetup.base.avro',
	type: 'record',
	name: 'Activity',
	doc: 'v3',
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
					'NATIVE',
					'NATIVE_APP_WEB_VIEW',
					'THIRD_PARTY_UNKNOWN',
					'UNKNOWN',
				],
			},
			default: 'UNKNOWN',
		},
	],
};

type Serializer = Object => string;

const avroSerializer: Object => Serializer = schema => data => {
	const record = avro.parse(schema).toBuffer(data);
	// data.timestamp _must_ be ISOString if it exists
	const timestamp = data.timestamp || new Date().toISOString();
	const analytics = {
		record: record.toString('base64'),
		schema: `gs://meetup-logs/avro_schemas/${schema.name}_${schema.doc}.avsc`,
		date: timestamp.substr(0, 10), // YYYY-MM-DD
	};
	return JSON.stringify(analytics);
};

const logger = (serializer: Serializer) => (record: Object) => {
	const serializedRecord = serializer(record);
	analyticsLog(serializedRecord);
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
const loggers = {
	activity: logger(serializers.activity),
	click: logger(serializers.click),
};

module.exports = {
	avroSerializer,
	getPlatformAnalyticsLog,
	schemas,
	serializers,
	loggers,
};
