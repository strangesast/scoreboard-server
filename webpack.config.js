var path = require("path");
var webpack = require("webpack");
module.exports = {
  cache: true,
  entry: './src/index.ts',
  output: {
    path: path.join(__dirname, "dist"),
    publicPath: "dist/",
    filename: "bundle.js"
  },
  module: {
    loaders: [
      /*
      // required to write "require('./style.css')"
      { test: /\.css$/,    loader: "style-loader!css-loader" },
      
      // required for bootstrap icons
      { test: /\.woff$/,   loader: "url-loader?prefix=font/&limit=5000&mimetype=application/font-woff" },
      { test: /\.ttf$/,    loader: "file-loader?prefix=font/" },
      { test: /\.eot$/,    loader: "file-loader?prefix=font/" },
      { test: /\.svg$/,    loader: "file-loader?prefix=font/" },
      
      // required for react jsx
      { test: /\.js$/,    loader: "jsx-loader" },
      { test: /\.jsx$/,   loader: "jsx-loader?insertPragma=React.DOM" },
      */
      { test: /\.tsx?$/, exclude: /node_modules/, loader: 'ts-loader' },
      { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader', query: { presets: 'es2015' }}
    ]
  },
  resolve: {
    extensions: [ '', '.webpack.js', '.web.js', '.ts', 'tsx', '.js', '.jsx']
  },
  plugins: []
};
