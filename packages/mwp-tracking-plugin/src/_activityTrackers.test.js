import url from 'url';
import rison from 'rison';
import { getTrackActivity, getTrackApiResponses } from './_activityTrackers';

describe('getTrackActivity', () => {
	const PROXY_URL = url.parse('http://www.example.com/mu_api');
	const trackApiResponses = jest.fn();
	const REQUEST_BASE = { trackApiResponses };
	const trackActivity = getTrackActivity();
	const fields = { foo: 'bar' }; // arbitrary additional params to merge with url+referrer
	test('server render record', () => {
		const request = {
			...REQUEST_BASE,
			url: url.parse('http://www.current.com/foo'),
			method: 'get',
			query: {},
			info: { referrer: 'http://www.previous.com/bar' },
		};
		trackActivity(request)(fields);
		expect(trackApiResponses.mock.calls[0][0]).toMatchInlineSnapshot(`
Object {
  "foo": "bar",
  "referrer": "http://www.previous.com/bar",
  "url": "/foo",
}
`);
	});
	test('SPA navigation (referrer override)', () => {
		trackApiResponses.mockClear();
		const request = {
			...REQUEST_BASE,
			url: PROXY_URL,
			method: 'get',
			query: {
				metadata: rison.encode_object({
					referrer: 'http://www.previous.com/foo',
				}),
			},
			info: { referrer: 'http://www.current.com/bar' },
		};
		trackActivity(request)(fields);
		expect(trackApiResponses.mock.calls[0][0]).toMatchInlineSnapshot(`
Object {
  "foo": "bar",
  "referrer": "http://www.previous.com/foo",
  "url": "http://www.current.com/bar",
}
`);
	});
	test('lazy-loaded data', () => {
		trackApiResponses.mockClear();
		const request = {
			...REQUEST_BASE,
			url: PROXY_URL,
			method: 'get',
			query: {},
			info: { referrer: 'http://www.current.com/foo' },
		};
		trackActivity(request)(fields);
		expect(trackApiResponses.mock.calls[0][0]).toMatchInlineSnapshot(`
Object {
  "foo": "bar",
  "referrer": "http://www.current.com/foo",
  "url": "/mu_api",
}
`);
	});
	test('lazy-track', () => {
		trackApiResponses.mockClear();
		const request = {
			...REQUEST_BASE,
			url: PROXY_URL,
			method: 'get',
			query: {},
			info: { referrer: 'http://www.current.com/foo' },
		};
		trackActivity(request)(fields);
		expect(trackApiResponses.mock.calls[0][0]).toMatchInlineSnapshot(`
Object {
  "foo": "bar",
  "referrer": "http://www.current.com/foo",
  "url": "/mu_api",
}
`);
	});
});

describe('getTrackApiResponses', () => {
	test('passes along arbitrary fields', () => {
		const trackApiResponses = getTrackApiResponses({
			log: (x, record) => record,
		})({
			state: {},
			plugins: { tracking: {} },
		});
		expect(trackApiResponses({ foo: 'bar' }).foo).toBe('bar');
	});
});
