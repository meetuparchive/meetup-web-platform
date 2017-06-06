import url from 'url';
import { routes } from '../../tests/mockApp';
import asyncRoutes from '../../tests/mockAsyncRoute';
import {
	activeRouteQueries,
	decodeParams,
	getChildRoutes,
	resolveChildRoutes,
	getRouteResolver,
	getMatchedQueries,
} from './routeUtils';

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

describe('getChildRoutes', () => {
	it('returns [route.indexRoute] for exact match', () => {
		const matchedRoute = {
			route: { indexRoute: 'foo' },
			match: { isExact: true },
		};
		const childRoutes = getChildRoutes(matchedRoute);
		expect(childRoutes).toEqual([matchedRoute.route.indexRoute]);
	});
	it('returns route.routes for not-exact match', () => {
		const matchedRoute = {
			route: { indexRoute: 'foo', routes: ['bar', 'baz'] },
			match: { isExact: false },
		};
		const childRoutes = getChildRoutes(matchedRoute);
		expect(childRoutes).toEqual(matchedRoute.route.routes);
	});
	it('returns empty array for exact match without index route', () => {
		const matchedRoute = {
			route: { routes: ['bar', 'baz'] },
			match: { isExact: true },
		};
		const childRoutes = getChildRoutes(matchedRoute);
		expect(childRoutes).toEqual([]);
	});
	it('returns empty array for not-exact match without route.routes', () => {
		const matchedRoute = {
			route: { indexRoute: 'foo' },
			match: { isExact: false },
		};
		const childRoutes = getChildRoutes(matchedRoute);
		expect(childRoutes).toEqual([]);
	});
});

describe('resolveChildRoutes', () => {
	it('returns [route.indexRoute] for exact match', () => {
		const matchedRoute = {
			route: { indexRoute: 'foo' },
			match: { isExact: true },
		};
		return resolveChildRoutes(matchedRoute).then(childRoutes => {
			expect(childRoutes).toEqual([matchedRoute.route.indexRoute]);
		});
	});
	it('returns route.routes for not-exact match', () => {
		const matchedRoute = {
			route: { indexRoute: 'foo', routes: ['bar', 'baz'] },
			match: { isExact: false },
		};
		return resolveChildRoutes(matchedRoute).then(childRoutes => {
			expect(childRoutes).toEqual(matchedRoute.route.routes);
		});
	});
	it('returns empty array for exact match without index route', () => {
		const matchedRoute = {
			route: { routes: ['bar', 'baz'] },
			match: { isExact: true },
		};
		return resolveChildRoutes(matchedRoute).then(childRoutes => {
			expect(childRoutes).toEqual([]);
		});
	});
	it('returns empty array for not-exact match without route.routes', () => {
		const matchedRoute = {
			route: { indexRoute: 'foo' },
			match: { isExact: false },
		};
		return resolveChildRoutes(matchedRoute).then(childRoutes => {
			expect(childRoutes).toEqual([]);
		});
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
		const params = { foo: 'bar' };
		const matchedRoute = {
			route: {
				path: '/',
				query: jest.fn(() => 'bar'),
			},
			match: { params },
		};
		getMatchedQueries(location)([matchedRoute]);
		expect(matchedRoute.route.query).toHaveBeenCalledWith({
			location,
			params,
		});
	});
});

describe('getRouteResolver', () => {
	const bar = {
		path: '/bar',
	};
	const foo = {
		path: '/foo',
		routes: [bar],
	};
	const qux = {
		path: '/qux',
	};
	const baz = {
		path: '/baz',
		getNestedRoutes: () => Promise.resolve([qux]),
	};
	const root = {
		path: '/',
		routes: [foo, baz],
	};
	const resolveRoutes = getRouteResolver([root]);
	it('returns all matched synchronous routes', () => {
		const location = new URL('http://example.com/foo/bar');
		return resolveRoutes(location).then(matchedRoutes => {
			expect(matchedRoutes.map(({ route }) => route)).toEqual([root, foo, bar]);
		});
	});
	it('returns all matched asynchronous routes', () => {
		const location = new URL('http://example.com/baz/qux');
		return resolveRoutes(location).then(matchedRoutes => {
			expect(matchedRoutes.map(({ route }) => route)).toEqual([root, baz, qux]);
		});
	});
});
