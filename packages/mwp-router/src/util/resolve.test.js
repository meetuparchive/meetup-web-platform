import { getChildRoutes, resolveChildRoutes, getRouteResolver } from './resolve';

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
