'use strict';

const Stream = require('stream');

/**
 * A stream that transforms a Good event into an Avro buffer according to a
 * schema
 */
class GoodMeetupTracking extends Stream.Transform {
	/**
	 * @param {Object} config the config options for a Stream.Transform
	 * @return {undefined} side effects only
	 */
	constructor(encoder) {
		super({ objectMode: true });
		this.serializer = encoder || JSON.stringify;
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
		const log = this.serializer ?
			this.serializer(JSON.parse(event.data)) :
			event.data;

		return next(null, `analytics=${log}\n`);
	}
}

module.exports = GoodMeetupTracking;

