var path = require('path');
var fs = require('fs');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var sassLoader = 'css!sass?sourceMap=true&sourceMapContents=true' +
  '&includePaths[]=' + encodeURIComponent(path.resolve(__dirname, './src/styles'));

module.exports = {
  entry: {
    app: ['./src/app'],
    vendors: [
      'react', 'react-dom', 'react-router', 'redux', 'react-redux',
      'react-router-redux', 'history', 'lodash', 'moment', 'd3'
    ],
  },

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    publicPath: '/static/',
  },

  module: {
    loaders: [{
      test: /\.jsx?$/,
      include: [
        path.resolve(__dirname, 'src'),
      ],
      use: ['babel'],
    }, {
      test: /\.s?css$/,
      include: [
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, './node_modules', 'antd'),
      ],
      loader: ExtractTextPlugin.extract({
        fallbackLoader: "style-loader",
        loader: sassLoader
      }),
    }]
  },

  resolve: {
    alias: {
      'react': path.resolve(__dirname, './node_modules', 'react'),
      'react-dom': path.resolve(__dirname, './node_modules', 'react-dom'),
      'utils': path.join(__dirname, './src/utils'),
      'pages': path.join(__dirname, './src/pages'),
      'styles': path.join(__dirname, './src/styles'),
      'components': path.join(__dirname, './src/components'),
    },
    extensions: ['.js', '.jsx', '.scss', '.css'],
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors',
      filename: 'vendors.js'
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      comments: false,
      compress: {
        unused: true,
        dead_code: true,
      },
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      },
      __DEV__: false,
    }),
    new ExtractTextPlugin({
      filename: "app.css",
      disable: false,
      allChunks: true,
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    new webpack.NoErrorsPlugin(),
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en-gb|zh-cn/),
  ],
};
