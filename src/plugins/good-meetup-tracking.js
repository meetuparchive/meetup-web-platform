'use strict';

// Load Modules

const avro = require('avsc');
const Hoek = require('hoek');
const Stream = require('stream');

// currently the schema is manually copied from
// https://github.dev.meetup.com/meetup/meetup/blob/master/modules/base/src/main/versioned_avro/Activity_v3.avsc
const schemaDef = {
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

const internals = {
	defaults: {
		// in prod, make a `request` call, otherwise no-op
		logData: data => console.log(data),
		schema: avro.parse(schemaDef),
	},
};

/**
 * A stream that transforms a Good event into an Avro buffer according to a
 * schema
 */
class GoodMeetupTracking extends Stream.Transform {
	/**
	 * @param {Object} config the config options for a Stream.Transform
	 * @return {undefined} side effects only
	 */
	constructor(config) {
		super({ objectMode: true });

		config = config || {};
		this._settings = Hoek.applyToDefaults(internals.defaults, config);
	}

	/**
	 * Receive event data and do something with it - package into avro buffer,
	 * send it
	 *
	 * @param {Object} event a Good event object
	 * @param {String|undefined} enc Not sure what this is used for - ignored
	 * @param {Function} next the next transform in the chain of Stream.Transform
	 * @return {Object} the output of calling the next transform in the chain
	 */
	_transform(event, enc, next) {
		const eventData = JSON.parse(event.data);

		// log readable tracking data - non-encoded
		console.log(JSON.stringify({
			message: 'Tracking log',
			payload: eventData,
		}));

		const { schema, logData } = this._settings;

		const record = schema.toBuffer(eventData);

		const eventDate = new Date(parseInt(eventData.timestamp, 10));
		const analytics = {
			record: record.toString('base64'),
			schemaUrl: `gs://meetup-logs/avro_schemas/${schemaDef.name}_${schemaDef.doc}.avsc`,
			date: eventDate.toISOString().substr(0, 10),  // YYYY-MM-DD
		};

		// log encoded data that will be picked up by fluentd
		logData(`analytics=${JSON.stringify(analytics)}`);

		return next(null, analytics);
	}
}

module.exports = GoodMeetupTracking;

