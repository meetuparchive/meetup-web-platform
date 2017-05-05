import MockContainer from './MockContainer';

export default [
	{
		path: '/bar',
		component: MockContainer,
		query: () => ({
			type: 'mock',
			ref: 'foo_bar',
			params: {},
		}),
	},
];
