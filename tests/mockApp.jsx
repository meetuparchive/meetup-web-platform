import React from 'react';
import Helmet from 'react-helmet';
import makeRootReducer from '../src/reducers/platform';
import Redirect from '../src/components/Redirect';

export const clientFilename = 'client.whatever.js';
export const assetPublicPath = '//whatever';
export const reducer = makeRootReducer();

export const ROOT_INDEX_CONTENT = 'this is the life';
const MockRootIndex = props =>
	<div>
		{ROOT_INDEX_CONTENT}
	</div>;
export const FOO_INDEX_CONTENT = 'yo dawg i heard you like foo';
const MockFooIndex = props =>
	<div>
		<Helmet />
		{FOO_INDEX_CONTENT}
	</div>;
export const EXTERNAL_REDIRECT_URL = 'http://example.com/foo?return=foo';
export const INTERNAL_REDIRECT_PATH = '/foo';
const MockRedirect = props => {
	const to =
		props.match.params.redirectType === 'internal'
			? INTERNAL_REDIRECT_PATH
			: new URL(EXTERNAL_REDIRECT_URL);
	const permanent = props.match.params.isPermanent;
	return (
		<div>
			<Redirect to={to} permanent={permanent} />
		</div>
	);
};

export const routes = [
	{
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
		routes: [
			{
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
				getNestedRoutes: () => import('./mockAsyncRoute').then(r => r.default),
			},
			{
				path: '/badImplementation',
				component: () => {
					// eslint-disable-next-line no-unreachable
					return (
						<Helmet>
							<meta property={{}} content={undefined} />
						</Helmet>
					);
				},
			},
			{
				path: '/redirect/:redirectType?/:isPermanent?',
				component: MockRedirect,
			},
			{
				// param-based route
				path: '/:param1',
				component: 'div',
				query: ({ params }) => ({
					type: 'mock',
					ref: 'param1',
					params,
				}),
				routes: [
					{
						path: '/:param2',
						component: 'div',
						query: ({ params }) => ({
							type: 'mock',
							ref: 'param2',
							params,
						}),
					},
				],
			},
		],
	},
];
