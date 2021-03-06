const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = env => {

    const envKeys = env ? Object.keys(env).reduce((result, name) => {
            result[`process.env.${name}`] = JSON.stringify(env[name]);
            return result;
        }, {}) : {};

    return {
        devtool: 'source-map',
        mode: env.mode === 'production' ? 'production' : 'development',
        entry: [
            './src/index'
        ],
        output: {
            path: path.join(__dirname, 'dist'),
            filename: 'bundle.js'
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            new webpack.DefinePlugin(envKeys),
            new HtmlWebpackPlugin({
                title: 'Render Loop Example Application',
                template: 'src/index.html'
            })
        ],
        resolve: {
            extensions: [ '.js', '.jsx' ],
            modules: [ 'node_modules' ],
            alias: { mobx: __dirname + '/node_modules/mobx/lib/mobx.es6.js' }
        },
        module: {
            rules: [ {
                test: /\.(js|jsx)$/,
                use: [ 'babel-loader' ],
                include: path.join(__dirname, 'src')
            },
            {
                test: /\.css$/,
                use: [ 'style-loader', 'css-loader' ]
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'babel-loader'
                    },
                    {
                        loader: 'react-svg-loader',
                        options: {
                            svgo: {
                                plugins: [
                                    { removeTitle: false }
                                ]
                            },
                            jsx: true // true outputs JSX tags
                        }
                    }
                ]
            }
            ]
        }
    };
};
