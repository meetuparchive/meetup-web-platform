const core = {
	compact: true,
	presets: ['flow', 'react', 'stage-2'],
	plugins: [
		'transform-class-properties',
		['react-intl', { extractSourceLocation: true }],
		[
			'transform-runtime',
			{
				polyfill: false,
				regenerator: true,
			},
		],
	],
};

module.exports = {
	presets: {
		browser: [
			...core.presets,
			[
				'env',
				{
					targets: {
						browsers: ['last 2 versions', 'not ie < 11', 'android >= 4.2'],
					},
				},
			],
		],
		server: [...core.presets, ['env', { targets: { node: 'current' } }]],
	},
	plugins: {
		browser: [...core.plugins],
		server: [...core.plugins],
	},
};
