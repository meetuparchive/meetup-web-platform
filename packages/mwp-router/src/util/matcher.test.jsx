import React from 'react';
import { getMatchedChildRoutes, getFindMatches } from './matcher';

describe('getMatchedChildRoutes', () => {
	it('returns [route.indexRoute] for exact match', () => {
		const matchedRoute = {
			route: { indexRoute: 'foo' },
			match: { isExact: true },
		};
		const childRoutes = getMatchedChildRoutes(matchedRoute);
		expect(childRoutes).toEqual([matchedRoute.route.indexRoute]);
	});
	it('returns route.routes for not-exact match', () => {
		const matchedRoute = {
			route: { indexRoute: 'foo', routes: ['bar', 'baz'] },
			match: { isExact: false },
		};
		const childRoutes = getMatchedChildRoutes(matchedRoute);
		expect(childRoutes).toEqual(matchedRoute.route.routes);
	});
	it('returns empty array for exact match without index route', () => {
		const matchedRoute = {
			route: { routes: ['bar', 'baz'] },
			match: { isExact: true },
		};
		const childRoutes = getMatchedChildRoutes(matchedRoute);
		expect(childRoutes).toEqual([]);
	});
	it('returns empty array for not-exact match without route.routes', () => {
		const matchedRoute = {
			route: { indexRoute: 'foo' },
			match: { isExact: false },
		};
		const childRoutes = getMatchedChildRoutes(matchedRoute);
		expect(childRoutes).toEqual([]);
	});
});

describe('getFindMatches', () => {
	const Component = () => <div />;
	const bar = {
		path: '/bar',
		getComponent: () => Promise.resolve(Component),
	};
	const foo = {
		path: '/foo',
		getComponent: () => Promise.resolve(Component),
		routes: [bar],
	};
	const qux = {
		path: '/qux',
		getComponent: () => Promise.resolve(Component),
	};
	const baz = {
		path: '/baz',
		component: Component,
		routes: [qux],
	};
	const root = {
		path: '/',
		getComponent: () => Promise.resolve(Component),
		routes: [foo, baz],
	};
	const findMatches = getFindMatches([root]);
	it('returns all matched synchronous routes', () => {
		const location = new URL('http://example.com/foo/bar');
		expect(findMatches(location).map(({ route }) => route)).toEqual([
			root,
			foo,
			bar,
		]);
	});
	it('returns all matched asynchronous routes', () => {
		const location = new URL('http://example.com/baz/qux');
		expect(findMatches(location).map(({ route }) => route)).toEqual([
			root,
			baz,
			qux,
		]);
	});
});
