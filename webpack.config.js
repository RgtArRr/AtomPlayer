const webpack = require('webpack');

module.exports = {
	entry: {
		app: './resources/js/app.jsx',
		settings: './resources/js/settings.jsx',
	},
	output: {
		path: __dirname + '/',
		filename: './dist/[name].min.js',
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: ['babel-loader'],
			},
		],
	},
	resolve: {
		extensions: ['*', '.js', '.jsx', '.json'],
	},
	target: 'electron-renderer',
	plugins: [
		new webpack.DefinePlugin({
			'process.env.FLUENTFFMPEG_COV': false,
		}),
	],
};
