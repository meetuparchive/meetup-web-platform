import React from 'react';
import { addComponentToRoute, resolveRoute, resolveAllRoutes } from './resolve';

const Component = () => <div />;
const bar = {
	path: '/bar',
	getComponent: () => Promise.resolve(Component),
};
const barResolved = {
	path: '/bar',
	component: Component,
	routes: [],
};

const foo = {
	path: '/foo',
	getComponent: () => Promise.resolve(Component),
	routes: [bar],
};
const fooResolved = {
	path: '/foo',
	component: Component,
	routes: [barResolved],
};
const qux = {
	path: '/qux',
	getComponent: () => Promise.resolve(Component),
};
const quxResolved = {
	path: '/qux',
	component: Component,
	routes: [],
};
const baz = {
	path: '/baz',
	component: Component,
	routes: [qux],
};
const bazResolved = {
	path: '/baz',
	component: Component,
	routes: [quxResolved],
};
const root = {
	path: '/',
	getComponent: () => Promise.resolve(Component),
	routes: [foo, baz],
};
const rootResolved = {
	path: '/',
	component: Component,
	routes: [fooResolved, bazResolved],
};
describe('addComponentToRoute', () => {
	it('adds a component to the route', () =>
		expect(addComponentToRoute(qux)(Component)).toEqual({
			path: '/qux',
			component: Component,
		}));
});
describe('resolveRoute', () => {
	it('resolves a single route', () =>
		Promise.all([foo].map(resolveRoute)).then(resolvedRoutes =>
			expect(resolvedRoutes).toEqual([fooResolved])
		));
});
describe('resolveAllRoutes', () => {
	it('resolves all routes', () =>
		resolveAllRoutes([root]).then(resolvedRoutes => {
			expect(resolvedRoutes).toEqual([rootResolved]);
		}));
});
