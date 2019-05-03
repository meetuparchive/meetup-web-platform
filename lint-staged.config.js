module.exports = {
	'{tests,__mocks__,packages}/**/*.{js,jsx}': [
		'prettier --write --single-quote --use-tabs --trailing-comma es5',
		'eslint',
		'git add',
	],
};
