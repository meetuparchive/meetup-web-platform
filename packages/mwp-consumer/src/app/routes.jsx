import React from 'react';

const Div = ({ children }) =>
	<div>
		{children}
	</div>;

const routes = [
	{
		path: '/',
		component: Div,
		query: [],
		indexRoute: {
			component: Div,
		},
		routes: [
			{
				path: 'foo',
				component: Div,
			},
		],
	},
];

export default routes;
