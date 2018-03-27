const path = require('path');

const repoRoot = process.cwd(); // expect CLI to be run from consumer repo root
const srcPath = path.resolve(repoRoot, 'src');
const buildPath = path.resolve(repoRoot, 'build');

const output = {
	browser: path.resolve(buildPath, 'browser-app'),
	server: path.resolve(buildPath, 'server-app'),
	serverMap: path.resolve(buildPath, 'server-app', 'serverAppMap.js'), // map server app builds to a single module
	vendor: path.resolve(buildPath, 'vendor'),
};

const src = {
	asset: path.resolve(srcPath, 'assets'), // pre-made static assets
	trns: path.resolve(srcPath, 'trns'),
	browser: {
		app: srcPath,
		entry: path.resolve(srcPath, 'browser-app-entry.js'),
	},
	server: {
		app: srcPath,
		entry: path.resolve(srcPath, 'server-app-entry.js'),
	},
};

const packages = {
	swarmConstants: {
		scss: /node_modules\/swarm-constants\/dist\/scss/,
	},
	webComponents: {
		src: /node_modules\/meetup-web-components\/src/,
		icons: /node_modules\/meetup-web-components\/icons/,
	},
};

module.exports = {
	repoRoot,
	srcPath,
	buildPath,
	output,
	src,
	packages,
};
