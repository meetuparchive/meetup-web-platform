import React from 'react';

const Div = ({ location, children }) =>
	<div>
		<pre>
			{JSON.stringify(location, null, 2)}
		</pre>
		{children}
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
