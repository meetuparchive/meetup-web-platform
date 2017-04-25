import 'rxjs/add/operator/toPromise';

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
				}, '{}'), 2
			)
	);
	mock.jar = jest.fn(() => 'myMockJar');
	return mock;
});

const API_TIMEOUT = 10;
const MOCK_HAPI_REQUEST = { server: { app: { API_TIMEOUT } } };

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
		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
		};
		return makeExternalApiRequest(MOCK_HAPI_REQUEST)(requestOpts)
			.toPromise()
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg).toBe(requestOpts));
	});
	it('throws an error when the API times out', () => {
		const API_TIMEOUT = 1;
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
		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
			jar: 'fooJar',
		};
		return makeExternalApiRequest(MOCK_HAPI_REQUEST)(requestOpts)
			.toPromise()
			.then(([response, body, jar]) => expect(jar).toBe(requestOpts.jar));
	});
});

describe('makeApiRequest$', () => {
	const endpoint = 'foo';
	it('makes a GET request', () => {
		const query = { ...mockQuery(MOCK_RENDERPROPS) };
		return makeApiRequest$(MOCK_HAPI_REQUEST)([{ method: 'get', url: endpoint }, query])
			.toPromise()
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg.method).toBe('get'));
	});
	it('makes a POST request', () => {
		const query = { ...mockQuery(MOCK_RENDERPROPS) };
		return makeApiRequest$(MOCK_HAPI_REQUEST)([{ method: 'post', url: endpoint }, query])
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
					endpoint,
					statusCode: 200,
				},
				type: query.type,
				value: mockResponse,
			}
		};
		return makeApiRequest$(MOCK_HAPI_REQUEST)([{ url: endpoint, method: 'get' }, query])
			.toPromise()
			.then(response => expect(response).toEqual(expectedResponse));
	});
});

