const avro = require('avsc');

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
		{ name: 'tag', type: 'string', default: '' }
	]
};

// currently the schema is manually copied from
// https://github.dev.meetup.com/meetup/meetup/blob/master/modules/base/src/main/versioned_avro/Activity_v3.avsc
const activity = {
	namespace: 'com.meetup.base.avro',
	type: 'record',
	name: 'Activity',
	doc: 'v3',
	fields: [
		{ name: 'requestId', type: 'string'},
		{ name: 'timestamp', type: 'string'},
		{ name: 'url', type: 'string'},
		{ name: 'aggregratedUrl', type: 'string', default: ''},  // it's misspelled in the original spec
		{ name: 'ip', type: 'string', default: ''},
		{ name: 'agent', type: 'string', default: ''},
		{ name: 'memberId', type: 'int'},
		{ name: 'trackId', type: 'string'},
		{ name: 'mobileWeb', type: 'boolean'},
		{ name: 'platform', type: 'string'},
		{ name: 'referer', type: 'string'},  // it's misspelled in the original spec
		{ name: 'trax', type: { type: 'map', values: 'string'}},
		{
			name: 'platformAgent',
			type: {
				type: 'enum',
				name: 'PlatformAgent',
				symbols: ['WEB', 'NATIVE', 'NATIVE_APP_WEB_VIEW', 'THIRD_PARTY_UNKNOWN', 'UNKNOWN']
			},
			default:'UNKNOWN'
		}
	]
};

const avroSerializer = schema => data => {
	const record = avro.parse(schema).toBuffer(data);
	const eventDate = new Date(parseInt(data.timestamp, 10));
	const analytics = {
		record: record.toString('base64'),
		schema: `gs://meetup-logs/avro_schemas/${schema.name}_${schema.doc}.avsc`,
		date: eventDate.toISOString().substr(0, 10),  // YYYY-MM-DD
	};
	return JSON.stringify(analytics);
};

module.exports = {
	avroSerializer,
	activitySerializer: avroSerializer(activity),
	clickSerializer: avroSerializer(click),
	schemas: {
		activity,
		click,
	},
};

