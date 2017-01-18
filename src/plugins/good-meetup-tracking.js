'use strict';

// Load Modules

const avro = require('avsc');
const Hoek = require('hoek');
// const request = require('request');
const Stream = require('stream');

const internals = {
	defaults: {
		endpoint: 'http://log.analytics.mup-prod.mup.zone',
		/**
		 * @param {String} endpoint avro logging endpoint
		 * @param {Buffer} body the buffer containing the avro-encoded data
		 */
		// postData: request.post.bind(request),
		postData: () => {},
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
	constructor(config) {
		super({ objectMode: true });

		config = config || {};
		this._settings = Hoek.applyToDefaults(internals.defaults, config);
	}

	/**
	 * Receive event data and do something with it - package into avro buffer,
	 * send it
	 *
	 * @param {Object} data a Good event object
	 */
	_transform(event, enc, next) {
		// log the data to stdout for Stackdriver
		console.log(JSON.stringify(event.data));

		// format data for avro
		const avroBuff = this._settings.schema.toBuffer(event.data);
		this._settings.postData(this._settings.endpoint, { body: avroBuff }, () => {});

		return next(null, avroBuff);
	}
}

module.exports = GoodMeetupTracking;

