import React from 'react';
import makeRootReducer from '../src/reducers/platform';

export const clientFilename = 'client.whatever.js';
export const assetPublicPath = '//whatever';
export const reducer = makeRootReducer();

export const ROOT_INDEX_CONTENT = 'this is the life';
const MockRootIndex = props => (
	<div>{ROOT_INDEX_CONTENT}</div>
);
export const FOO_INDEX_CONTENT = 'yo dawg i heard you like foo';
const MockFooIndex = props => (
	<div>{FOO_INDEX_CONTENT}</div>
);

export const routes = [{
	path: '/',
	component: 'div',
	query: () => ({
		type: 'mock',
		ref: 'root',
		params: {},
	}),
	indexRoute: {
		component: MockRootIndex,
		query: () => ({
			type: 'mock',
			ref: 'root_index',
			params: {},
		}),
	},
	routes: [{
		path: '/foo',
		component: 'div',
		indexRoute: {
			component: MockFooIndex,
			query: () => ({
				type: 'mock',
				ref: 'foo_index',
				params: {},
			}),
		},
		routes: [{
			path: '/bar',
			load: () => import('./MockContainer'),
			query: () => ({
				type: 'mock',
				ref: 'foo_bar',
				params: {},
			}),
		}]
	}, {
		// param-based route
		path: '/:param1',
		component: 'div',
		query: ({ params }) => ({
			type: 'mock',
			ref: 'param1',
			params,
		}),
		routes: [{
			path: '/:param2',
			component: 'div',
			query: ({ params }) => ({
				type: 'mock',
				ref: 'param2',
				params,
			}),
		}],
	}],
}];

