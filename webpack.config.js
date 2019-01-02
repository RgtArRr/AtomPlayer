const webpack = require('webpack');

module.exports = {
	entry: {
		app: './resources/js/app.jsx',
		settings: './resources/js/settings.jsx',
	},
	output: {
		path: __dirname + '/',
		filename: './resources/js/[name].min.js',
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
		extensions: ['*', '.js', '.jsx'],
	},
	target: 'electron-renderer',
	plugins: [
		new webpack.DefinePlugin({
			'process.env.FLUENTFFMPEG_COV': false,
		}),
	],
};