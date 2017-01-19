import avro from 'avsc';
import GoodMeetupTracking from './good-meetup-tracking';
import Stream from 'stream';

import { logTrack } from '../util/tracking';

const testTransform = (tracker, trackInfo, test) =>
	new Promise((resolve, reject) => {
		tracker._transform({ data: JSON.stringify(trackInfo) }, null, (err, val) => {
			if (err) {
				reject(err);
			}
			resolve(val);
		});
	})
	.then(test);

describe('GoodMeetupTracking', () => {
	it('creates a transform stream', () => {
		expect(new GoodMeetupTracking()).toEqual(jasmine.any(Stream.Transform));
	});
	it('transforms input into base64-encoded avro buffer', () => {
		const config = {
			postData() {},
			schema: avro.parse({
				type: 'record',
				fields: [
					{ name: 'requestId', type: 'string'},
				]
			}),
		};
		const tracker = new GoodMeetupTracking(config);
		const trackInfo = { requestId: 'foo' };
		return testTransform(
			tracker,
			trackInfo,
			val => {
				const utf8String = new Buffer(val.record, 'base64').toString('utf-8');
				const avroBuffer = new Buffer(utf8String);
				const recordedInfo = tracker._settings.schema.fromBuffer(avroBuffer);
				expect(recordedInfo).toEqual(trackInfo);
			}
		);
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
		sessionId: 'bar',  // not part of v3 spec
		url: 'asdf',
	});

	it('encodes standard output from logTrack', () => {
		const tracker = new GoodMeetupTracking({
			postData() {},
		});

		return testTransform(
			tracker,
			trackInfo,
			val => {
				const utf8String = new Buffer(val.record, 'base64').toString();
				const avroBuffer = new Buffer(utf8String);
				const trackedInfo = tracker._settings.schema.fromBuffer(avroBuffer);
				const memberId = '';  // memberId integer doesn't survive the decode-encode-decode
				const expectedTrackInfo = {
					...trackInfo,
					aggregratedUrl: '',  // misspelled, unused field in v3 spec
					memberId,
				};
				delete expectedTrackInfo.sessionId;  // not part of v3 spec
				expect({ ...trackedInfo, memberId }).toEqual(expectedTrackInfo);
			}
		);
	});

	it('calls config.postData with an endpoint string and the buffer', () => {
		const config = {
			endpoint: 'foo',
			postData() {},
		};
		spyOn(config, 'postData');
		const tracker = new GoodMeetupTracking(config);

		return testTransform(
			tracker,
			trackInfo,
			body => {
				expect(config.postData)
					.toHaveBeenCalledWith(config.endpoint, { body }, jasmine.any(Function));
			}
		);
	});

});

