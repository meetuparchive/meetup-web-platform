import {
	mockQuery,
} from 'meetup-web-mocks/lib/app';
import {
	MOCK_GROUP,
} from 'meetup-web-mocks/lib/api';
import * as fetchUtils from './fetchUtils';

describe('mergeClickCookie', () => {
	it('merges stringified clicktracking data into "clickTracking" cookie header string', () => {
		const initHeader = 'foo=bar';
		const clickTracking = {
			clicks: [{ bar: 'foo' }],
		};
		expect(fetchUtils.mergeClickCookie(initHeader, clickTracking))
			.toEqual(`foo=bar; clickTracking=${JSON.stringify(clickTracking)}`);
	});
	it('creates stringified clicktracking cookie header string when no header string provided', () => {
		const initHeader = undefined;
		const clickTracking = {
			clicks: [{ bar: 'foo' }],
		};
		expect(fetchUtils.mergeClickCookie(initHeader, clickTracking))
			.toEqual(`clickTracking=${JSON.stringify(clickTracking)}`);
	});
	it('returns unmodified header when no clicks', () => {
		const clickTracking = { clicks: [] };
		const undefinedHeader = undefined;
		const stringHeader = 'foo=bar';
		expect(fetchUtils.mergeClickCookie(undefinedHeader, clickTracking))
			.toBe(undefinedHeader);
		expect(fetchUtils.mergeClickCookie(stringHeader, clickTracking))
			.toBe(stringHeader);
	});
});

describe('fetchQueries', () => {
	const API_URL = new URL('http://api.example.com/');
	const queries = [mockQuery({})];
	const meta = { foo: 'bar', clickTracking: { clicks: [] } };
	const responses = [MOCK_GROUP];
	const csrfJwt = 'encodedstuff';
	const getRequest = { method: 'GET', headers: {} };
	const postRequest = { method: 'POST', csrf: csrfJwt, headers: {} };
	const fakeSuccess = () =>
		Promise.resolve({
			json: () => Promise.resolve(responses),
			headers: {
				get: key => ({
					'x-csrf-jwt': csrfJwt,
				}[key]),
			},
		});
	const fakeSuccessError = () =>
		Promise.resolve({
			json: () => Promise.resolve({ error: 'you lose' }),
			headers: {
				get: key => ({
					'x-csrf-jwt': csrfJwt,
				}[key]),
			},
		});


	it('returns an object with queries and responses arrays', () => {
		spyOn(global, 'fetch').and.callFake(fakeSuccess);

		return fetchUtils.fetchQueries(API_URL.toString(), getRequest)(queries)
			.then(response => {
				expect(response.queries).toEqual(jasmine.any(Array));
				expect(response.responses).toEqual(jasmine.any(Array));
			});
	});
	it('returns an object with csrf prop read from response headers', () => {
		spyOn(global, 'fetch').and.callFake(fakeSuccess);

		return fetchUtils.fetchQueries(API_URL.toString(), getRequest)(queries)
			.then(response => expect(response.csrf).toEqual(csrfJwt));
	});
	it('returns a promise that will reject when response contains error prop', () => {
		spyOn(global, 'fetch').and.callFake(fakeSuccessError);

		return fetchUtils.fetchQueries(API_URL.toString(), getRequest)(queries)
			.then(
				response => expect(true).toBe(false),
				err => expect(err).toEqual(jasmine.any(Error))
			);
	});
	describe('GET', () => {
		it('GET calls fetch with API url and queries, metadata, logout querystring params', () => {
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils.fetchQueries(
				API_URL.toString(),
				getRequest
			)(queries, { ...meta, logout: true })
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					const url = new URL(calledWith[0]);
					expect(url.origin).toBe(API_URL.origin);
					expect(new URLSearchParams(url.search).has('queries')).toBe(true);
					expect(new URLSearchParams(url.search).has('metadata')).toBe(true);
					expect(new URLSearchParams(url.search).get('logout')).toBe('true');
					expect(calledWith[1].method).toEqual('GET');
				});
		});

		it('GET calls fetch with cookie header containing clicktracking', () => {
			const clickTracking = {
				clicks: [{ bar: 'foo' }],
			};
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils.fetchQueries(
				API_URL.toString(),
				getRequest
			)(queries, { ...meta, clickTracking, logout: true })
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					expect(calledWith[1].headers.cookie)
						.toEqual(`clickTracking=${JSON.stringify(clickTracking)}`);
				});
		});

		it('GET without meta calls fetch without metadata querystring params', () => {
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils.fetchQueries(
				API_URL.toString(),
				getRequest
			)(queries).then(() => {
				const calledWith = global.fetch.calls.mostRecent().args;
				const url = new URL(calledWith[0]);
				expect(url.origin).toBe(API_URL.origin);
				expect(new URLSearchParams(url.search).has('queries')).toBe(true);
				expect(new URLSearchParams(url.search).has('metadata')).toBe(false);
				expect(calledWith[1].method).toEqual('GET');
			});
		});
	});
	describe('POST', () => {
		it('POST calls fetch with API url; csrf header; queries and metadata body params', () => {
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils.fetchQueries(
				API_URL.toString(),
				postRequest
			)(queries, meta)
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					const url = new URL(calledWith[0]);
					const options = calledWith[1];
					expect(url.toString()).toBe(API_URL.toString());
					expect(options.method).toEqual('POST');
					expect(options.body.has('queries')).toBe(true);
					expect(options.body.has('metadata')).toBe(true);
					expect(options.headers['x-csrf-jwt']).toEqual(csrfJwt);
				});
		});
		it('POST without meta calls fetch without metadata body params', () => {
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils.fetchQueries(
				API_URL.toString(),
				postRequest
			)(queries)
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					const url = new URL(calledWith[0]);
					const options = calledWith[1];
					expect(url.toString()).toBe(API_URL.toString());
					expect(options.method).toEqual('POST');
					expect(options.body.has('queries')).toBe(true);
					expect(options.body.has('metadata')).toBe(false);
					expect(options.headers['x-csrf-jwt']).toEqual(csrfJwt);
				});
		});
	});
});

describe('tryJSON', () => {
	const reqUrl = 'http://example.com';
	const goodResponse = { foo: 'bar' };
	const goodFetchResponse = {
		text: () => Promise.resolve(JSON.stringify(goodResponse)),
	};
	const errorResponse = {
		status: 400,
		statusText: '400 Bad Request',
		text: () => Promise.resolve('There was a problem'),
	};
	const badJSON = 'totally not JSON';
	const badJSONResponse = {
		text: () => Promise.resolve(badJSON),
	};
	it('returns a Promise that resolves to the parsed fetch response JSON', () => {
		const theFetch = fetchUtils.tryJSON(reqUrl)(goodFetchResponse);
		expect(theFetch).toEqual(jasmine.any(Promise));

		return theFetch.then(response => expect(response).toEqual(goodResponse));
	});
	it('returns a rejected Promise with Error when response has 400+ status', () => {
		const theFetch = fetchUtils.tryJSON(reqUrl)(errorResponse);
		expect(theFetch).toEqual(jasmine.any(Promise));
		return theFetch.then(
			response => expect(true).toBe(false),  // should not run - promise should be rejected
			err => expect(err).toEqual(jasmine.any(Error))
		);
	});
	it('returns a rejected Promise with Error when response fails JSON parsing', () => {
		const theFetch = fetchUtils.tryJSON(reqUrl)(badJSONResponse);
		expect(theFetch).toEqual(jasmine.any(Promise));
		return theFetch.then(
			response => expect(true).toBe(false),  // should not run - promise should be rejected
			err => expect(err).toEqual(jasmine.any(Error))
		);
	});
});

describe('mergeCookies', () => {
	it('makes a cookie header string from a { key<string> : value<string> } object', () => {
		expect(fetchUtils.mergeCookies('bim=bam', { foo: 'foo', bar: 'bar' }))
			.toEqual('bim=bam; foo=foo; bar=bar');
	});
	it('overwrites existing cookies with new cookies', () => {
		expect(fetchUtils.mergeCookies('foo=meetup', { foo: 'foo', bar: 'bar' }))
			.toEqual('foo=foo; bar=bar');
	});
});

