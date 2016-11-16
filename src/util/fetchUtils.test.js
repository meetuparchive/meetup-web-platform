import * as fetchUtils from './fetchUtils';
import {
	MOCK_OAUTH_COOKIES,
	mockQuery,
} from './mocks/app';
import {
	MOCK_GROUP,
} from './mocks/api';

describe('fetchQueries', () => {
	const API_URL = new URL('http://api.example.com/');
	const auth = MOCK_OAUTH_COOKIES;
	const queries = [mockQuery({})];
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

	it('calls fetch with authorization header', () => {
		spyOn(global, 'fetch').and.callFake(fakeSuccess);

		return fetchUtils.fetchQueries(API_URL.toString(), { auth, method: 'GET' })(queries)
			.then(() => {
				const authHeader = global.fetch.calls.mostRecent().args[1].headers.Authorization;
				expect(authHeader.startsWith('Bearer ')).toBe(true);
				expect(authHeader.endsWith(MOCK_OAUTH_COOKIES.oauth_token)).toBe(true);
			});
	});
	it('returns an object with queries and responses arrays', () => {
		spyOn(global, 'fetch').and.callFake(fakeSuccess);

		return fetchUtils.fetchQueries(API_URL.toString(), { auth, method: 'GET' })(queries)
			.then(response => {
				expect(response.queries).toEqual(jasmine.any(Array));
				expect(response.responses).toEqual(jasmine.any(Array));
			});
	});
	it('returns an object with csrf prop read from response headers', () => {
		spyOn(global, 'fetch').and.callFake(fakeSuccess);

		return fetchUtils.fetchQueries(API_URL.toString(), { auth, method: 'GET' })(queries)
			.then(response => expect(response.csrf).toEqual(csrfJwt));
	});
	it('rejects with an Error without calling fetch when no oauth', () => {
		spyOn(global, 'fetch');

		return fetchUtils.fetchQueries(API_URL.toString(), { auth: {}, method: 'GET' })(queries)
			.then(() => expect(true).toBe(false))  // should never be called!
			.catch(err => {
				expect(err).toEqual(jasmine.any(Error));
				expect(global.fetch).not.toHaveBeenCalled();
			});
	});
	describe('GET', () => {
		it('calls fetch with API url with GET and querystring', () => {
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils.fetchQueries(API_URL.toString(), { auth, method: 'GET' })(queries)
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					const url = new URL(calledWith[0]);
					expect(url.origin).toBe(API_URL.origin);
					expect(new URLSearchParams(url.search).has('queries')).toBe(true);
					expect(calledWith[1].method).toEqual('GET');
				});
		});
	});
	describe('POST', () => {
		it('calls fetch API url with POST method and body params', () => {
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils.fetchQueries(API_URL.toString(), { auth, method: 'POST' })(queries)
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					const url = new URL(calledWith[0]);
					expect(url.toString()).toBe(API_URL.toString());
					expect(calledWith[1].method).toEqual('POST');
					expect(calledWith[1].body.has('queries')).toBe(true);
				});
		});
	});
});
