const webpack = require('webpack');

module.exports = [
	// Tells loaders to optimize what they can since in minimize mode
	new webpack.LoaderOptionsPlugin({
		minimize: true,
		debug: false,
		quiet: true,
	}),

	new webpack.optimize.UglifyJsPlugin({
		compress: {
			warnings: false,
		},
		output: {
			comments: false,
		},
		sourceMap: true,
	}),
];
