'use strict';

// Load Modules

const avro = require('avsc');
const Hoek = require('hoek');
const request = require('request');
const Stream = require('stream');

const internals = {
	defaults: {

		endpoint: 'http://log.analytics.mup-prod.mup.zone/log',
		// in prod, make a `request` call, otherwise no-op
		postData: process.env.NODE_ENV === 'production' ?
			request.post.bind(request) :
			() => {},
		// currently the schema is manually copied from
		// https://github.dev.meetup.com/meetup/meetup/blob/master/modules/base/src/main/versioned_avro/Activity_v3.avsc
		schema: avro.parse({
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
		}),
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
	 * @param {Error|null} err error returned from failed request
	 * @param {http.IncomingMessage} response the response object
	 * @param {String} body the body of the response
	 * @return {undefined} side effects only
	 */
	static postDataCallback(err, response, body) {
		if (err) {
			console.error(err);
			return;
		}
		if (response && response.statusCode !== 200) {
			console.error(`Activity track logging error: ${body}`);
		}
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
		// log the data to stdout for Stackdriver
		const eventData = JSON.parse(event.data);
		console.log(JSON.stringify({
			message: 'Tracking log',
			payload: eventData,
		}));

		const record = this._settings.schema.toBuffer(eventData);

		const eventDate = new Date(parseInt(eventData.timestamp, 10));
		const data = {
			name: 'Activity',
			record: record.toString('base64'),
			version: 3,
			schemaUrl: 'gs://meetup-logs/avro_schemas/Activity_v3.avsc',
			date: eventDate.toISOString().substr(0, 10),  // YYYY-MM-DD
		};

		const body = JSON.stringify(data);
		const headers = {
			'Content-Type': 'application/json',
		};

		// format data for avro
		this._settings.postData(
			this._settings.endpoint,
			{ headers, body },
			GoodMeetupTracking.postDataCallback
		);

		return next(null, data);
	}
}

module.exports = GoodMeetupTracking;

