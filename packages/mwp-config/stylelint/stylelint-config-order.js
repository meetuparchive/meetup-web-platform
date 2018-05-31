module.exports = {
	plugins: ['stylelint-order'],
	rules: {
		'order/order': [
			'dollar-variables',
			'custom-properties',
			{
				type: 'at-rule',
				name: 'extend',
			},
			{
				type: 'at-rule',
				name: 'include',
				hasBlock: false,
			},
			'declarations',
			{
				type: 'at-rule',
				hasBlock: true,
			},
			{
				type: 'at-rule',
				name: 'include',
				parameter: 'atMediaUp',
				hasBlock: true,
			},
			{
				type: 'at-rule',
				name: 'include',
				parameter: 'browser-ie11',
				hasBlock: true,
			},
		],
		'order/properties-alphabetical-order': true,
	},
};
