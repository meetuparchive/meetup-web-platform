import avsc from 'avsc';
import { getLogger } from '../activity';
import { clickToClickRecord } from './clickReader';
import * as avro from './avro';

jest.mock('@google-cloud/pubsub', () => {
	const publish = jest.fn(() => Promise.resolve('okay!'));
	const main = jest.fn(() => ({
		topic: jest.fn(() => ({
			publisher: () => ({
				publish,
			}),
		})),
	}));
	main.publish = publish; // hook to make publish calls visible to calling test
	return main;
});

describe('serializers.avro', () => {
	it('encodes record of provided schema', () => {
		const schema = {
			type: 'record',
			fields: [
				{ name: 'requestId', type: 'string' },
				{ name: 'timestamp', type: 'string' },
			],
		};
		const serializer = avro.serializers.avro(schema);
		const data = {
			requestId: 'foo',
			timestamp: new Date().getTime().toString(),
		};
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

describe('deserializers.avro', () => {
	it('decodes an encoded record of provided schema', () => {
		const schema = {
			type: 'record',
			fields: [
				{ name: 'requestId', type: 'string' },
				{ name: 'timestamp', type: 'string' },
			],
		};
		const data = {
			requestId: 'foo',
			timestamp: new Date().getTime().toString(),
		};

		const serializer = avro.serializers.avro(schema);
		const deserializer = avro.deserializers.avro(schema);
		const serialized = serializer(data);
		const deserialized = deserializer(serialized);
		expect(deserialized).toEqual(data);
	});
});

describe('Activity tracking', () => {
	const request = {
		id: 'foo',
		headers: {},
		log() {},
	};
	const trackInfo = getLogger('WEB')(request, {
		memberId: 1234,
		trackId: 'foo',
		sessionId: 'bar', // not part of v3 spec
		url: 'asdf',
	});

	it('encodes standard output from getLogger', () => {
		const serialized = avro.serializers.activity(trackInfo);

		// parse stringified object
		const valObj = JSON.parse(serialized);
		// create a new buffer from that string
		const avroBuffer = new Buffer(valObj.record, 'base64');
		// get the avro-encoded record
		const recordedInfo = avsc.parse(avro.schemas.activity).fromBuffer(avroBuffer);
		const expectedTrackedInfo = {
			...trackInfo,
			aggregratedUrl: '', // misspelled, unused field in v3 spec, default ''
			browserId: '',
		};
		delete expectedTrackedInfo.sessionId; // not part of v3 spec
		expect(recordedInfo).toEqual(expectedTrackedInfo);
	});
});

describe('Click tracking', () => {
	const request = {
		id: 'foo',
		state: {},
	};
	const click = {
		timestamp: new Date(0).toISOString(),
		lineage: 'div#foo',
		linkText: 'hello world',
		coords: [23, 45],
	};

	it('encodes standard output from clickToClickRecord', () => {
		const trackInfo = clickToClickRecord(request)(click);
		const serialized = avro.serializers.click(trackInfo);

		// parse stringified object
		const valObj = JSON.parse(serialized);
		// create a new buffer from that string
		const avroBuffer = new Buffer(valObj.record, 'base64');
		// get the avro-encoded record
		const recordedInfo = avsc.parse(avro.schemas.click).fromBuffer(avroBuffer);
		const expectedTrackedInfo = {
			...trackInfo,
			tag: '', // not used in our click data - defaults to empty string
		};
		expect(recordedInfo).toEqual(expectedTrackedInfo);
	});
});

describe('getPlatformAnalyticsLog', () => {
	it('logs to stdout by default', () => {
		spyOn(process.stdout, 'write').and.callThrough();
		const analyticsLog = avro.getPlatformAnalyticsLog();
		analyticsLog('foo');
		expect(process.stdout.write).toHaveBeenCalled();
	});
	it('calls pub/sub topic.publish when isGAE', () => {
		const isGAE = true;
		const analyticsLog = avro.getPlatformAnalyticsLog(isGAE);
		analyticsLog('foo');
		expect(require('@google-cloud/pubsub').publish).toHaveBeenCalled();
	});
});
