import url from 'url';
import { routes } from 'mwp-test-utils/lib/mockApp';
import asyncRoutes from 'mwp-test-utils/lib/mockAsyncRoute';

import { activeRouteQueries, decodeParams, getMatchedQueries } from './query';

describe('activeRouteQueries', () => {
	it('gathers queries from nested routes', () => {
		const location = url.parse('/foo/bar');
		const expectedQueries = [routes[0].query(), asyncRoutes[0].query()];
		return activeRouteQueries(routes)(location).then(receivedQueries =>
			expect(receivedQueries).toEqual(expectedQueries)
		);
	});
	it('gathers queries from root index route', () => {
		const location = url.parse('/');
		const expectedQueries = [routes[0].query(), routes[0].indexRoute.query()];
		return activeRouteQueries(routes)(location).then(receivedQueries =>
			expect(receivedQueries).toEqual(expectedQueries)
		);
	});
	it('gathers queries from nested index route', () => {
		const location = url.parse('/foo');
		const expectedQueries = [
			routes[0].query(),
			routes[0].routes[0].indexRoute.query(),
		];
		return activeRouteQueries(routes)(location).then(receivedQueries =>
			expect(receivedQueries).toEqual(expectedQueries)
		);
	});
	it('matches nested wildcard urls', () => {
		const location = url.parse('/param1value/param2value');
		return activeRouteQueries(routes)(location).then(
			receivedQueries => expect(receivedQueries).toHaveLength(3) // root, param1, param2
		);
	});
	it('passes all parsed url params into query', () => {
		const param1 = 'param1value';
		const param2 = 'param2value';
		const location = url.parse(`/${param1}/${param2}`);
		const expectedParams = [{}, { param1 }, { param1, param2 }];
		return activeRouteQueries(routes)(location).then(receivedQueries =>
			expect(receivedQueries.map(({ params }) => params)).toEqual(
				expectedParams
			)
		);
	});
	it('passes all parsed url params into query when provided baseUrl', () => {
		const baseUrl = '/fr-FR';
		const param1 = 'param1value';
		const param2 = 'param2value';
		const location = url.parse(`${baseUrl}/${param1}/${param2}`);
		const expectedParams = [{}, { param1 }, { param1, param2 }];
		return activeRouteQueries(routes, baseUrl)(location).then(receivedQueries =>
			expect(receivedQueries.map(({ params }) => params)).toEqual(
				expectedParams
			)
		);
	});
	it('matches utf-8 urls', () => {
		const param1 = '驚くばかり';
		const location = url.parse(`/${param1}`);
		const expectedParams = [{}, { param1 }];
		return activeRouteQueries(routes)(location).then(receivedQueries =>
			expect(receivedQueries.map(({ params }) => params)).toEqual(
				expectedParams
			)
		);
	});
});

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
