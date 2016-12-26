var path = require('path');
module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-concurrent');

	var webpack = require("webpack");
	var webpackConfig = require("./webpack.config.js");

	grunt.initConfig({
    webpack: {
      options: webpackConfig,
      build: {
        plugins: webpackConfig.plugins.concat(
          new webpack.DefinePlugin({
            "process.env": {
              "NODE_ENV": JSON.stringify("production")
            }
          }),
          new webpack.optimize.DedupePlugin(),
          new webpack.optimize.UglifyJsPlugin()
        )
      },
      "build-dev": {
        devtool: "sourcemap",
        debug: true
      }
    },
    watch: {
      app: {
        files: ["app/**/*", "web_modules/**/*"],
        tasks: ["webpack:build-dev"],
        options: {
          spawn: false
        }
      }
    },
    nodemon: {
      base: {
        script: path.join(
                    webpackConfig.output.path,
                    webpackConfig.output.filename
                    ),
        options: { watch: ['dist'] }
      }
    },
    concurrent: {
      target: {
        tasks: ['webpack:build-dev', 'watch'],
        options: { logConcurrentOutput: true }
      }
    }
  });

  grunt.registerTask("default", ["webpack:build-dev", "concurrent"]);
  grunt.registerTask("build", ["webpack:build"]);
};
