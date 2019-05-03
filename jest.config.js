module.exports = {
	collectCoverageFrom: [
		'packages/**/*.{js,jsx}',
		'!**/{node_modules,lib,coverage,scripts}/**',
	],
	coverageDirectory: '<rootDir>/coverage',
	moduleFileExtensions: ['js', 'jsx', 'json'],
	setupFiles: ['<rootDir>/tests/util/setupTest.js'],
	snapshotSerializers: ['enzyme-to-json/serializer'],
	testEnvironment: 'node',
	testRegex: 'src/.*\\.test\\.jsx?$',
};
