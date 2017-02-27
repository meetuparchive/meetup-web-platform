import makeRootReducer from '../src/reducers/platform';

import MockContainer from './MockContainer';

export const clientFilename = 'client.whatever.js';
export const assetPublicPath = '//whatever';
export const reducer = makeRootReducer();

export const routes = [{
	path: '',
	component: 'div',
	query: () => ({
		type: 'mock',
		ref: 'root',
		params: {},
	}),
	routes: [{
		path: '/foo',
		component: 'div',
		routes: [{
			path: '/bar',
			component: MockContainer,
			query: () => ({
				type: 'mock',
				ref: 'foobar',
				params: {},
			}),
		}]
	}],
}];

