const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: {
		//index: './src/index.js',
		//print: './src/print.js',
		index: path.join(__dirname, 'src', 'indexReact.js'),
	},
	output: {
		//filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
		//publicPath: 'dist/',
		clean: true,
		publicPath: '/',
	},

	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: "asset",
				parser: { dataUrlCondition: { maxSize: 30000 } },
			},
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env', '@babel/preset-react'],
						plugins: ['@babel/plugin-transform-runtime'],
					}
				}
			},
			{
			    test: /\.(frag|vert|glsl)$/,
			    use: { 
			        loader: 'glsl-shader-loader',
			        options: {}  
			    }
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({ template: './src/index.html' }),
	],
	devtool: 'inline-source-map',
	devServer: {
		static: './dist',
		historyApiFallback: true,
	},
};