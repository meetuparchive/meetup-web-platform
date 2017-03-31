'use strict';

// Load Modules

const Hoek = require('hoek');
const Stream = require('stream');
const { avroLog } = require('../util/avro');

const internals = {
	defaults: {
		// currently the schema is manually copied from
		// https://github.dev.meetup.com/meetup/meetup/blob/master/modules/base/src/main/versioned_avro/Activity_v3.avsc
		schema: {
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
		},
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
		const eventData = JSON.parse(eventData);
		const log = avroLog(this._settings.schema, eventData);
		// send the encoded data for logging to stdout
		return next(null, `analytics=${log}\n`);
	}
}

module.exports = GoodMeetupTracking;

