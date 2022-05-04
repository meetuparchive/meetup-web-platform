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
		const avroBuffer = Buffer.from(valObj.record, 'base64');
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
		state: {},
		log() {},
		server: { settings: { app: { api: {} } } },
	};
	const trackInfo = getLogger('WEB')(request, {
		memberId: 1234,
		trackId: 'foo',
		sessionId: 'bar', // not part of v3 spec
		url: 'asdf',
		viewName: 'foo view',
		subViewName: 'foo subview',
	});

	it('encodes chapinEnvelope output from getLogger', () => {
		const serialized = avro.serializers.awsactivity(trackInfo);

		// // parse stringified object
		const valObj = JSON.parse(serialized);
		// // create a new buffer from that string
		const avroBuffer = Buffer.from(valObj.data, 'base64');
		// // get the avro-encoded record
		const recordedInfo = avsc.parse(avro.schemas.activity).fromBuffer(avroBuffer);
		delete recordedInfo.timestamp;
		expect(recordedInfo).toMatchSnapshot();
	});
});

describe('Click tracking', () => {
	const request = {
		id: 'foo',
		state: {},
		server: { settings: { app: { api: {} } } },
	};
	const click = {
		timestamp: new Date(0).toISOString(),
		lineage: 'div#foo',
		linkText: 'hello world',
		coords: [23, 45],
		elementName: 'test',
		containerName: 'test-container',
	};

	it('encodes chapinEnvelope output from clickToClickRecord', () => {
		const trackInfo = clickToClickRecord(request)(click);
		const serialized = avro.serializers.awsclick(trackInfo);

		// parse stringified object
		const valObj = JSON.parse(serialized);
		// create a new buffer from that string
		const avroBuffer = Buffer.from(valObj.data, 'base64');
		// get the avro-encoded record
		const recordedInfo = avsc.parse(avro.schemas.click).fromBuffer(avroBuffer);
		const expectedTrackedInfo = {
			...trackInfo,
			tag: '', // not used in our click data - defaults to empty string
			// not used in our click data - defaults to empty string
			serverTime: '',
			eventRef: null,
			eventSource: null,
			viewId: null,
		};
		expect(recordedInfo).toEqual(expectedTrackedInfo);
	});
});
