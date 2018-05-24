module.exports = {
	rules: {
		'selector-class-pattern': [
			'^(?:[a-z]+[a-zA-Z0-9]+_)*(?:[a-z]+[a-zA-Z0-9]+)*(?:-[a-zA-Z0-9]+)*(?:--[a-zA-Z0-9]+)?$',
			{ resolveNestedSelectors: true },
		],
	},
};
