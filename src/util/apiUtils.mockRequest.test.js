import {
	mockQuery,
	MOCK_RENDERPROPS,
} from 'meetup-web-mocks/lib/app';

import {
	createCookieJar,
	makeApiRequest$,
	makeExternalApiRequest,
} from './apiUtils';

// Mock the request module with a an empty response delayed by 200ms
jest.mock('request', () => {
	const mock = jest.fn(
		(requestOpts, cb) =>
			setTimeout(() =>
				cb(null, {
					headers: {},
					statusCode: 200,
					elapsedTime: 1234,
					request: {
						uri: {
							query: 'foo=bar',
							pathname: '/foo',
						},
						method: 'get',
					},
				}, '{}'), 200
			)
	);
	mock.jar = jest.fn(() => 'myMockJar');
	return mock;
});

describe('createCookieJar', () => {
	it('returns a cookie jar for /sessions endpoint', () => {
		const jar = createCookieJar('/sessions?asdfasd');
		expect(jar).not.toBeNull();
	});
	it('returns null for non-sessions endpoint', () => {
		const jar = createCookieJar('/not-sessions?asdfasd');
		expect(jar).toBeNull();
	});
});

describe('makeExternalApiRequest', () => {
	it('calls externalRequest with requestOpts', () => {
		const API_TIMEOUT = 5000;
		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
		};
		return makeExternalApiRequest({ server: { app: { API_TIMEOUT } } })(requestOpts)
			.toPromise()
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg).toBe(requestOpts));
	});
	it('throws an error when the API times out', () => {
		const API_TIMEOUT = 100;
		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
		};
		return makeExternalApiRequest({ server: { app: { API_TIMEOUT } } })(requestOpts)
			.toPromise()
			.then(
				() => expect(true).toBe(false),  // should not be called
				err => expect(err).toEqual(jasmine.any(Error))
			);
	});
	it('returns the requestOpts jar at array index 2', () => {
		const API_TIMEOUT = 5000;
		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
			jar: 'fooJar',
		};
		return makeExternalApiRequest({ server: { app: { API_TIMEOUT } } })(requestOpts)
			.toPromise()
			.then(([response, body, jar]) => expect(jar).toBe(requestOpts.jar));
	});
});

describe('makeApiRequest$', () => {
	const endpoint = 'foo';
	it('makes a GET request', () => {
		const query = { ...mockQuery(MOCK_RENDERPROPS) };
		return makeApiRequest$({ server: { app: {} }, log: () => {} })([{ method: 'get', url: endpoint }, query])
			.toPromise()
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg.method).toBe('get'));
	});
	it('makes a POST request', () => {
		const query = { ...mockQuery(MOCK_RENDERPROPS) };
		return makeApiRequest$({ server: { app: {} }, log: () => {} })([{ method: 'post', url: endpoint }, query])
			.toPromise()
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg.method).toBe('post'));
	});
	it('responds with query.mockResponse when set', () => {
		const mockResponse = { foo: 'bar' };
		const query = { ...mockQuery(MOCK_RENDERPROPS), mockResponse };
		const expectedResponse = {
			[query.ref]: {
				meta: {
					requestId: 'mock request',
					endpoint
				},
				type: query.type,
				value: mockResponse,
			}
		};
		return makeApiRequest$({ server: { app: {} }, log: () => {} })([{ url: endpoint }, query])
			.toPromise()
			.then(response => expect(response).toEqual(expectedResponse));
	});
});

