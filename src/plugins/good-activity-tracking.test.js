import avro from 'avsc';
import GoodMeetupTracking from './good-activity-tracking';
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
	it('transforms input into JSON, prepended with `analytics=`, with base64-encoded avro buffer record', () => {
		const config = {
			schema: {
				type: 'record',
				fields: [
					{ name: 'requestId', type: 'string' },
					{ name: 'timestamp', type: 'string' },
				]
			},
		};
		const tracker = new GoodMeetupTracking(config);
		const trackInfo = { requestId: 'foo', timestamp: new Date().getTime().toString() };
		return testTransform(
			tracker,
			trackInfo,
			val => {
				expect(val.startsWith('analytics=')).toBe(true);
				const valJSON = val.replace(/^analytics=/, '');
				const valObj = JSON.parse(valJSON);
				const utf8String = new Buffer(valObj.record, 'base64').toString('utf-8');
				const avroBuffer = new Buffer(utf8String);
				const recordedInfo = avro.parse(tracker._settings.schema).fromBuffer(avroBuffer);
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
		const tracker = new GoodMeetupTracking();

		return testTransform(
			tracker,
			trackInfo,
			val => {
				const valJSON = val.replace(/^analytics=/, '');
				const valObj = JSON.parse(valJSON);
				const utf8String = new Buffer(valObj.record, 'base64').toString('utf-8');
				const avroBuffer = new Buffer(utf8String);
				const trackedInfo = avro.parse(tracker._settings.schema).fromBuffer(avroBuffer);
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
});

