const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry: './src/js/game.ts',
    output: {
        path: __dirname + '/dist/',
        filename: './js/game.bundle.js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            favicon: 'favicon.ico',
            template: 'src/index.html'
        }),
    ],
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.css'],
    },
}