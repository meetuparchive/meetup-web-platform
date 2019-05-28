import React from 'react';

const Div = ({ location }) =>
	<div>
		<h1>MWP-Consumer</h1>
		<pre>
			{JSON.stringify(location.path, null, 2)}
		</pre>
	</div>;

const routes = [
	{
		path: '/',
		component: Div,
		query: [
			() => ({
				endpoint: 'noop',
				params: {},
				mockResponse: {},
			}),
		],
		indexRoute: {
			component: Div,
		},
		routes: [
			{
				path: '/foo',
				component: Div,
				query: [
					() => ({
						endpoint: 'noop',
						params: {},
						mockResponse: {},
					}),
				],
			},
		],
	},
];

export default routes;
