import GoodTracking from './good-tracking';
import Stream from 'stream';

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

describe('GoodTracking', () => {
	it('creates a transform stream', () => {
		expect(new GoodTracking()).toEqual(jasmine.any(Stream.Transform));
	});
	it('prepends event.data string with `analytics=`', () => {
		const tracker = new GoodTracking();  // default to JSON.stringify
		const data = { requestId: 'foo', timestamp: new Date().getTime().toString() };
		const trackInfo = JSON.stringify(data);
		return testTransform(
			tracker,
			trackInfo,
			val => {
				expect(val.startsWith('analytics=')).toBe(true);
				const valJSON = val.replace(/^analytics=/, '');
				const valObj = JSON.parse(valJSON);
				expect(valObj).toEqual(data);
			}
		);
	});
	it('uses supplied serializer to encode data', () => {
		const serializer = str => new Buffer(str).toString('base64');
		const tracker = new GoodTracking(serializer);
		const data = { requestId: 'foo', timestamp: new Date().getTime().toString() };
		const trackInfo = JSON.stringify(data);
		return testTransform(
			tracker,
			trackInfo,
			val => {
				expect(val.startsWith('analytics=')).toBe(true);
				const valString = val.replace(/^analytics=/, '');
				expect(valString).toEqual(serializer(data));
			}
		);
	});
});

