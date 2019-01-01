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
	resolve: {
		extensions: ['.js', '.jsx'],
	},
	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
				query: {
					cacheDirectory: true,
					presets: ['react', 'es2015'],
				},
			},
		],
	},
	target: 'electron-renderer',
	plugins: [
		new webpack.DefinePlugin({
			'process.env.FLUENTFFMPEG_COV': false,
		}),
	],
};