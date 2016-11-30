var path = require('path');
var fs = require('fs');
var webpack = require('webpack');
// var HappyPack = require('happypack');

module.exports = {
  profile: true,
  devtool: 'inline-source-map',
  cache: true,
  watch: true,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 300
  },

  entry: {
    app: [
      './src/app'
    ],
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
    rules: [{
      test: /\.jsx?$/,
      include: [
        path.resolve(__dirname, 'src'),
      ],
      use: [
        'babel-loader?cacheDirectory'
      ],
      // happy: { id: 'js' },
    }, {
      test: /\.s?css$/,
      include: [
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, './node_modules', 'antd'),
      ],
      use: [
        'style-loader',
        'css-loader?sourceMap',
        'sass-loader?sourceMap&sourceMapContents&includePaths[]=' + encodeURIComponent(path.resolve(__dirname, './src/styles'))
      ],
      // happy: { id: 'scss' },
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
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en-gb|zh-cn/),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('development')
      },
      __DEV__: true,
    }),
    new webpack.HotModuleReplacementPlugin(),
    // new HappyPack({ id: 'js' }),
    // new HappyPack({ id: 'scss' }),
  ],
};
