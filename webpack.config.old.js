const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');

module.exports = {
	entry: {
		index: './src/index.js',
		//print: './src/print.js',
	},
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: 'dist/',
		clean: true,
	},

	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				use: [
					{
						loader: 'url-loader',
						options: { limit: 30000 } // Include image in file if size under 30kb
					},
				]
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			title: 'Output Management',
		}),
		new HtmlInlineScriptPlugin(),
	],
};