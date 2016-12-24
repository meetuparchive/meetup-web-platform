import {
	mockQuery,
	MOCK_RENDERPROPS,
} from 'meetup-web-mocks/lib/app';

import {
	makeApiRequest$,
	makeExternalApiRequest,
} from './apiUtils';

// Mock the request module with a an empty response delayed by 200ms
jest.mock('request', () =>
	jest.fn(
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
				}, '{}'), 200)
	)
);

describe('makeExternalApiRequest', () => {
	it('calls externalRequest with requestOpts', () => {
		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
		};
		return makeExternalApiRequest({}, 5000)(requestOpts)
			.toPromise()
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg).toBe(requestOpts));
	});
	it('throws an error when the API times out', () => {
		const timeout = 100;
		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
		};
		return makeExternalApiRequest({}, timeout)(requestOpts)
			.toPromise()
			.then(
				() => expect(true).toBe(false),  // should not be called
				err => expect(err).toEqual(jasmine.any(Error))
			);
	});
});

describe('makeApiRequest$', () => {
	const endpoint = 'foo';
	it('makes a GET request', () => {
		const query = { ...mockQuery(MOCK_RENDERPROPS) };
		return makeApiRequest$({ log: () => {} }, 5000, {})([{ method: 'get', url: endpoint }, query])
			.toPromise()
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg.method).toBe('get'));
	});
	it('makes a POST request', () => {
		const query = { ...mockQuery(MOCK_RENDERPROPS) };
		return makeApiRequest$({ log: () => {} }, 5000, {})([{ method: 'post', url: endpoint }, query])
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
					flags: {},
					requestId: 'mock request',
					endpoint
				},
				type: query.type,
				value: mockResponse,
			}
		};
		return makeApiRequest$({ log: () => {} }, 5000, {})([{ url: endpoint }, query])
			.toPromise()
			.then(response => expect(response).toEqual(expectedResponse));
	});
});

