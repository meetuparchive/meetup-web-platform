import { decodeParams, getMatchedQueries } from './query';

describe('decodeParams', () => {
	it('url-decodes all defined values of object', () => {
		const rawValues = ['&asdfkj%20sfd', 'asdfs', '%dsjdasdf///', '驚くばかり'];
		const encodedValues = rawValues.map(encodeURI);
		const params = encodedValues.reduce(
			(params, v, k) => ({
				...params,
				[k]: v,
			}),
			{}
		);
		const decoded = decodeParams(params);
		expect(Object.keys(decoded)).toEqual(Object.keys(params));
		Object.keys(decoded).forEach(k => {
			expect(decoded[k]).toEqual(rawValues[k]);
		});
	});
	it('skips keys with undefined values', () => {
		const params = { foo: undefined, bar: 'baz', qux: null };
		const decoded = decodeParams(params);
		expect(decoded).toEqual({ bar: 'baz', qux: null });
	});
	it('returns empty object unchanged', () => {
		const object = {};
		const decoded = decodeParams(object);
		expect(decoded).toEqual(object);
	});
});
describe('getMatchedQueries', () => {
	it('returns queries derived from the query function in matched route', () => {
		const location = new URL('http://foo.com/bar/baz');
		const matchedRoute = {
			route: {
				path: '/',
				query: jest.fn(() => 'bar'),
			},
			match: { params: {} },
		};
		const queries = getMatchedQueries(location)([matchedRoute]);
		expect(queries).toEqual(['bar']);
	});
	it('returns empty array when no query functions in matchedRoute', () => {
		const location = new URL('http://foo.com/bar/baz');
		const params = { foo: 'bar' };
		const matchedRoute = {
			route: {
				path: '/',
			},
			match: { params },
		};
		const queries = getMatchedQueries(location)([matchedRoute]);
		expect(queries).toEqual([]);
	});
	it('calls query functions with params + location object', () => {
		const location = new URL('http://foo.com/bar/baz');
		const path = '/';
		const match = {
			isExact: false,
			params: { foo: 'bar' },
			path,
			url: '/',
		};
		const matchedRoute = {
			route: {
				path,
				query: jest.fn(),
			},
			match,
		};
		getMatchedQueries(location)([matchedRoute]);
		expect(matchedRoute.route.query).toHaveBeenCalledWith({
			...match,
			location,
		});
	});
});
