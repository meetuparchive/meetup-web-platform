import { parseQueryResponse, getValidQueries } from './fetchUtils';

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

describe('getValidQueries', () => {
	const memberSelfQuery = {
		endpoint: 'members/self',
		params: {},
	};
	const fooQuery = {
		endpoint: 'foo/bar',
		params: {},
	};
	const loggedIn = 'id=1234&other=data';
	const loggedOut = 'id=0&other=data'; // 'undefined' also considered logged-out
	it('filters "members/self" for logged-out users', () => {
		expect(getValidQueries(loggedOut)([memberSelfQuery])).toHaveLength(0);
		expect(getValidQueries(loggedOut)([memberSelfQuery, fooQuery])).toEqual([
			fooQuery,
		]);
		expect(getValidQueries(undefined)([memberSelfQuery])).toHaveLength(0);
	});
	it('does not filter "members/self" for logged-in users', () => {
		const queries = [memberSelfQuery, fooQuery];
		expect(getValidQueries(loggedIn)(queries)).toEqual(queries);
	});
});
