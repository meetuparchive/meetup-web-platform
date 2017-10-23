import { parseQueryResponse, getAuthedQueryFilter } from './fetchUtils';

describe('parseQueryResponse', () => {
	it('categorizes query responses into success and failure arrays of [query, response] tuples', () => {
		const goodRef = 'foo';

		const goodQuery = { ref: goodRef };
		const goodResponse = { value: 'bar', ref: goodRef };
		const badRef = 'bar';
		const badQuery = { ref: badRef };
		const badResponse = { value: 'whatever', error: 'Bad news', ref: badRef };
		const proxyResponse = { responses: [goodResponse, badResponse] };
		const parse = parseQueryResponse([goodQuery, badQuery]);
		expect(parse(proxyResponse)).toEqual({
			successes: [{ query: goodQuery, response: goodResponse }],
			errors: [{ query: badQuery, response: badResponse }],
		});
	});
	it('errors when no responses provided', () => {
		const proxyResponse = { foo: 'bar' };
		expect(() => parseQueryResponse()(proxyResponse)).toThrowError(
			JSON.stringify(proxyResponse)
		);
	});
	it('errors when responses length is different from queries length', () => {
		const queries = [{}, {}];
		const responses = [{}];
		const proxyResponse = { responses };
		expect(() => parseQueryResponse(queries)(proxyResponse)).toThrowError(
			/do not match/
		);
	});
});

describe('getAuthedQueryFilter', () => {
	const memberSelfQuery = {
		endpoint: 'members/self',
		params: {},
	};
	const loggedIn = { id: 1234 };
	const loggedOut = { id: 0 }; // 'undefined' also considered logged-out
	it('returns false for "members/self" query for logged-out users', () => {
		expect(getAuthedQueryFilter(loggedOut)(memberSelfQuery)).toBe(false);
		expect(getAuthedQueryFilter(undefined)(memberSelfQuery)).toBe(false);
	});
	it('returns true for "members/self" for logged-in users', () => {
		expect(getAuthedQueryFilter(loggedIn)(memberSelfQuery)).toBe(true);
	});
});
