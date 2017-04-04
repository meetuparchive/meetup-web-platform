import avsc from 'avsc';
import { logTrack } from './tracking';
import { clickToClickRecord } from './clickTrackingReader';
import * as avro from './avro';

describe('avroSerializer', () => {
	it('encodes record of provided schema', () => {
		const schema = {
			type: 'record',
			fields: [
				{ name: 'requestId', type: 'string' },
				{ name: 'timestamp', type: 'string' },
			]
		};
		const serializer = avro.avroSerializer(schema);
		const data = { requestId: 'foo', timestamp: new Date().getTime().toString() };
		const serialized = serializer(data);

		// parse stringified object
		const valObj = JSON.parse(serialized);
		// create a new buffer from that string
		const avroBuffer = new Buffer(valObj.record, 'base64');
		// get the avro-encoded record
		const recordedInfo = avsc.parse(schema).fromBuffer(avroBuffer);
		expect(recordedInfo).toEqual(data);
	});
});

describe('Activity tracking', () => {
	const response = {
		request: {
			id: 'foo',
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
		const serialized = avro.activitySerializer(trackInfo);

		// parse stringified object
		const valObj = JSON.parse(serialized);
		// create a new buffer from that string
		const avroBuffer = new Buffer(valObj.record, 'base64');
		// get the avro-encoded record
		const recordedInfo = avsc.parse(avro.schemas.activity).fromBuffer(avroBuffer);
		const expectedTrackedInfo = {
			...trackInfo,
			aggregratedUrl: '',  // misspelled, unused field in v3 spec, default ''
		};
		delete expectedTrackedInfo.sessionId;  // not part of v3 spec
		expect(recordedInfo).toEqual(expectedTrackedInfo);
	});
});

describe('Click tracking', () => {
	const request = {
		id: 'foo',
		state: {},
	};
	const click = {
		lineage: 'div#foo',
		linkText: 'hello world',
		coords: [23, 45],
	};
	const trackInfo = clickToClickRecord(request)(click);

	it('encodes standard output from logTrack', () => {
		const serialized = avro.clickSerializer(trackInfo);

		// parse stringified object
		const valObj = JSON.parse(serialized);
		// create a new buffer from that string
		const avroBuffer = new Buffer(valObj.record, 'base64');
		// get the avro-encoded record
		const recordedInfo = avsc.parse(avro.schemas.click).fromBuffer(avroBuffer);
		const expectedTrackedInfo = {
			...trackInfo,
			tag: '',  // not used in our click data - defaults to empty string
		};
		expect(recordedInfo).toEqual(expectedTrackedInfo);
	});
});

