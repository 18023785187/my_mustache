
const path = require('path')
const { merge } = require('webpack-merge')
const commonConfig = require('./common')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = merge(commonConfig, {
    mode: "development",
    devtool: "source-map",
    entry: {
      'mustache': path.resolve('./', 'src/index.ts'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve('./', 'public/index.html'),
            collapseWhitespace: true,
            removeComments: true,
            inject: 'body'
        }),
    ],
    devServer: {
        compress: true,
        port: 8001,
        host: 'localhost',
        open: true,
        hot: true,
        // https: true
    }
})