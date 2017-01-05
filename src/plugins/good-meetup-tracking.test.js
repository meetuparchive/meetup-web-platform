import avro from 'avsc';
import GoodMeetupTracking from './good-meetup-tracking';
import Stream from 'stream';

import { logTrack } from '../util/tracking';

describe('GoodMeetupTracking', () => {
	it('creates a transform stream', () => {
		expect(new GoodMeetupTracking() instanceof Stream.Transform).toBe(true);
	});
	it('transforms input into avro Buffer', () => {
		const tracker = new GoodMeetupTracking({
			schema: avro.parse({
				type: 'record',
				fields: [
					{ name: 'requestId', type: 'string'},
				]
			}),
		});
		return new Promise((resolve, reject) => {
			tracker._transform({ data: JSON.stringify({ requestId: 'foo' }) }, null, (err, val) => {
				if (err) {
					reject(err);
				}
				resolve(val);
			});
		})
		.then(val => expect(val instanceof Buffer).toBe(true));
	});
});

describe('Integration with tracking logs', () => {
	const response = {
		request: {
			headers: {},
			log() {}
		}
	};
	const trackInfo = logTrack('WEB')(response, {
		memberId: 1234,
		trackId: 'foo',
		sessionId: 'bar',
		url: 'asdf',
	});

	it('encodes standard output from logTrack', () => {
		const tracker = new GoodMeetupTracking();

		return new Promise((resolve, reject) => {
			tracker._transform({ data: JSON.stringify(trackInfo) }, null, (err, val) => {
				if (err) {
					reject(err);
				}
				resolve(val);
			});
		})
		.then(val => expect(val instanceof Buffer).toBe(true));
	});

});

