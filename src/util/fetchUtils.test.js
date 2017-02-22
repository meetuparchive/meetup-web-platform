import cookie from 'cookie';
import url from 'url';
import {
	mockQuery,
} from 'meetup-web-mocks/lib/app';
import {
	MOCK_GROUP,
} from 'meetup-web-mocks/lib/api';
import * as fetchUtils from './fetchUtils';

const serverRequest = {
	state: {
		bar: 'baz',
	},
	url: url.parse('http://example.com'),
	raw: {
		req: {
			headers: {
				cookie: 'foo=bar',
			},
		},
	},
};

describe('fetchQueries', () => {
	const API_URL = new URL('http://api.example.com/');
	const queries = [mockQuery({})];
	const meta = { foo: 'bar' };
	const responses = [MOCK_GROUP];
	const csrfJwt = 'encodedstuff';
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

		return fetchUtils.fetchQueries(API_URL.toString(), { method: 'GET' })(queries)
			.then(response => {
				expect(response.queries).toEqual(jasmine.any(Array));
				expect(response.responses).toEqual(jasmine.any(Array));
			});
	});
	it('returns an object with csrf prop read from response headers', () => {
		spyOn(global, 'fetch').and.callFake(fakeSuccess);

		return fetchUtils.fetchQueries(API_URL.toString(), { method: 'GET' })(queries)
			.then(response => expect(response.csrf).toEqual(csrfJwt));
	});
	it('returns a promise that will reject when response contains error prop', () => {
		spyOn(global, 'fetch').and.callFake(fakeSuccessError);

		return fetchUtils.fetchQueries(API_URL.toString(), { method: 'GET' })(queries)
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
				{ method: 'GET' }
			)(queries, { ...meta, logout: true })
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					const url = new URL(calledWith[0]);
					expect(url.origin).toBe(API_URL.origin);
					expect(url.searchParams.has('queries')).toBe(true);
					expect(url.searchParams.has('metadata')).toBe(true);
					expect(url.searchParams.has('logout')).toBe(true);
					expect(calledWith[1].method).toEqual('GET');
				});
		});
		it('GET without meta calls fetch without metadata querystring params', () => {
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils.fetchQueries(
				API_URL.toString(),
				{ method: 'GET' }
			)(queries).then(() => {
				const calledWith = global.fetch.calls.mostRecent().args;
				const url = new URL(calledWith[0]);
				expect(url.origin).toBe(API_URL.origin);
				expect(url.searchParams.has('queries')).toBe(true);
				expect(url.searchParams.has('metadata')).toBe(false);
				expect(calledWith[1].method).toEqual('GET');
			});
		});
	});
	describe('POST', () => {
		it('POST calls fetch with API url; csrf header; queries and metadata body params', () => {
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils.fetchQueries(
				API_URL.toString(),
				{ method: 'POST', csrf: csrfJwt }
			)(queries, meta)
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					const url = new URL(calledWith[0]);
					const options = calledWith[1];
					expect(url.toString()).toBe(API_URL.toString());
					expect(options.method).toEqual('POST');
					// build a dummy url to hold the url-encoded body as searchstring
					const dummyUrl = new URL(`http://example.com?${options.body}`);
					expect(dummyUrl.searchParams.has('queries')).toBe(true);
					expect(dummyUrl.searchParams.has('metadata')).toBe(true);
					expect(options.headers['x-csrf-jwt']).toEqual(csrfJwt);
				});
		});
		it('POST without meta calls fetch without metadata body params', () => {
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils.fetchQueries(
				API_URL.toString(),
				{ method: 'POST', csrf: csrfJwt }
			)(queries)
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					const url = new URL(calledWith[0]);
					const options = calledWith[1];
					expect(url.toString()).toBe(API_URL.toString());
					expect(options.method).toEqual('POST');
					const dummyUrl = new URL(`http://example.com?${options.body}`);
					expect(dummyUrl.searchParams.has('queries')).toBe(true);
					expect(dummyUrl.searchParams.has('metadata')).toBe(false);
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

describe('cleanBadCookies', () => {
	const goodHeader = 'foo=bar; baz=boom';
	it('removes bad cookies from the cookie header', () => {
		const badHeader = fetchUtils.BAD_COOKIES.reduce(
			(badHeader, badCookie) => `${badHeader}; ${badCookie}=whatever`,
			goodHeader
		);

		const cleanedHeader = fetchUtils.cleanBadCookies(badHeader);
		fetchUtils.BAD_COOKIES.forEach(badCookie => {
			// bad header _has_ bad cookie
			expect(cookie.parse(badHeader)[badCookie]).toBeDefined();
			// clean header does _not_ have bad cookie
			expect(cookie.parse(cleanedHeader)[badCookie]).toBeUndefined();
		});
	});
	it('leaves a clean cookie header intact', () => {
		expect(fetchUtils.cleanBadCookies(goodHeader)).toEqual(goodHeader);
	});
});

