// Require modules
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const StatsPlugin = require('webpack-stats-plugin').StatsWriterPlugin;

// Build settings
const paths = require('../paths');
const env = require('../env');
const prodPlugins = require('./prodPlugins');
const rules = require('./rules');

/*
 * Webpack config object determined by passed-in localeCode. The language is
 * used to resolve the translated message module paths in applications that
 * support translations (currently not supported by starter kit), but also
 * to determine the output path, and to inject a WEBPACK_BASE_URL constant
 * referenced in built files
 *
 * The server app is a module that exports a rendering function that can be
 * imported by the server and used to render requests to the app route.
 */
function getConfig(localeCode) {
	const baseWebfontDir = path.resolve(
		paths.src.server.app,
		'assets',
		'fonts'
	);
	const webfontDir =
		localeCode === 'ru-RU'
			? path.resolve(baseWebfontDir, localeCode)
			: baseWebfontDir;
	const publicPath = `/${localeCode}/`;
	const config = {
		entry: {
			'server-app': [paths.src.server.entry],
		},

		// write a CommonJS module that can be imported into Node server scripts
		output: {
			libraryTarget: 'commonjs2',
			path: path.join(paths.output.server, localeCode),
			filename: '[name].js',
			publicPath,
		},

		devtool: 'eval',

		module: { rules: [rules.file, rules.css, rules.js.server, rules.raw] },

		plugins: [
			new webpack.EnvironmentPlugin({
				NODE_ENV: 'development', // required for prod build of React
			}),
			new webpack.DefinePlugin({
				// server bundles must reference _browser_ bundle public path
				// - inject it as a 'global variable' here
				WEBPACK_ASSET_PUBLIC_PATH: JSON.stringify(publicPath),
				VENDOR_MANIFEST_PATH: JSON.stringify(
					path.resolve(paths.output.browser, 'manifest.json')
				),
				BROWSER_MANIFEST_PATH: JSON.stringify(
					path.resolve(
						paths.output.browser,
						localeCode,
						'manifest.json'
					)
				),
			}),
			new StatsPlugin({ fields: null }), // null means 'all fields in stats file'
		],

		target: 'node',

		externals: [
			nodeExternals({
				modulesDir: process.env.NODE_PATH
					? process.env.NODE_PATH
					: null,
				whitelist: [
					/^meetup-web-components/,
					/^swarm-icons\/dist\/sprite\/sprite\.inc$/,
				],
			}),
			/.*?build\//,
		],

		resolveLoader: {
			alias: {
				'require-loader': path.resolve(__dirname, 'require-loader.js'),
			},
		},

		resolve: {
			alias: {
				src: paths.src.server.app,
				trns: path.resolve(paths.src.trns, 'modules', localeCode),
				webfont: webfontDir,
			},
			// module name extensions that Webpack will try if no extension provided
			extensions: ['.js', '.jsx', '.json'],
		},
	};
	if (env.properties.isProd) {
		config.plugins = config.plugins.concat(prodPlugins);
	}

	return config;
}

// export the config-building function for programmatic consumption
module.exports = getConfig;
