import React from 'react';
import Helmet from 'react-helmet';
import makeRootReducer from 'mwp-store/lib/reducer';
import { Forbidden, NotFound, Redirect } from 'mwp-router';

export const clientFilename = 'client.whatever.js';
export const reducer = makeRootReducer();

export const ROOT_INDEX_CONTENT = 'this is the life';
const ChildWrap = props =>
	<div>
		{props.children}
	</div>;
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
		component: ChildWrap,
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
				component: ChildWrap,
				indexRoute: {
					component: MockFooIndex,
					query: () => ({
						type: 'mock',
						ref: 'foo_index',
						params: {},
					}),
				},
				getNestedRoutes: () =>
					import('./mockAsyncRoute').then(r => r.default),
			},
			{
				path: '/badImplementation',
				component: props => {
					// use querystring to render 'bad' implementations
					if (props.location.search.endsWith('forbidden')) {
						// multiple child components not allowed
						return (
							<Forbidden>
								<div />
								<div />
							</Forbidden>
						);
					}
					if (props.location.search.endsWith('redirect')) {
						// multiple child components not allowed
						return (
							<Redirect>
								<div />
								<div />
							</Redirect>
						);
					}
					if (props.location.search.endsWith('notfound')) {
						// multiple child components not allowed
						return (
							<NotFound>
								<div />
								<div />
							</NotFound>
						);
					}
					/*
					 * the `property` prop for `meta` must be a string in order for
					 * <Helmet> to process it correctly - this is a 'bad implementation'
					 * that will throw an error because `property` is an object.
					 * It's possible that 'react-helmet' will change this behavior in the
					 * future and related tests will start failing because they expect the
					 * error to be thrown, but this implementation exposes a tricky bug in
					 * the platform that was fixed in WP-429 and is useful for preventing
					 * regression
					 */
					return (
						<Helmet>
							<meta property={{}} content="foo" />
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
				component: ChildWrap,
				query: ({ params }) => ({
					type: 'mock',
					ref: 'param1',
					params,
				}),
				routes: [
					{
						path: '/:param2',
						component: ChildWrap,
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
