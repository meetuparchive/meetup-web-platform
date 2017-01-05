'use strict';

// Load Modules

const avro = require('avsc');
const Hoek = require('hoek');
const Stream = require('stream');
const SafeStringify = require('json-stringify-safe');

// TODO: figure out how to load the JSON from Activity_v3.avsc into the schema
// Might want to just enter it manually
const internals = {
	defaults: {
		schema: avro.parse({
			namespace: 'com.meetup.base.avro',
			type: 'record',
			name: 'Activity',
			doc: 'v3',
			fields: [
				{ name: 'requestId', type: 'string'},
				{ name: 'timestamp', type: 'string'},
				{ name: 'url', type: 'string'},
				{ name: 'aggregratedUrl', type: 'string', default: ''},
				{ name: 'ip', type: 'string', default: ''},
				{ name: 'agent', type: 'string', default: ''},
				{ name: 'memberId', type: 'int'},
				{ name: 'trackId', type: 'string'},
				{ name: 'mobileWeb', type: 'boolean'},
				{ name: 'platform', type: 'string'},
				{ name: 'referer', type: 'string'},
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
		console.log('\n\nstarting\n\n');
		const data = typeof event.data === 'object' ? SafeStringify(event.data) : event.data;

		try {
			const avroBuff = this._settings.schema.toBuffer(data);
			console.log('\n\nhere go\n\n');
			console.log('avrobuff', this._settings.schema.fromBuffer(avroBuff));
			console.log('avrobuff', JSON.stringify(this._settings.schema.fromBuffer(avroBuff)));

			return next(null, avroBuff);
		} catch(e) {
			console.error(e);
			console.log('nopenopenope\n\n');
		}
	}
}

module.exports = GoodMeetupTracking;

