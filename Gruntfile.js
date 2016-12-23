module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-concurrent');

  grunt.initConfig({
    ts: {
      default: {
        src: [ 'src/**/*.ts' ],
        watch: 'src',
        options: {
          rootDir: 'src/'
        },
        outDir: 'dist/',
        tsconfig: './src/tsconfig.json'
      }
    },
    nodemon: {
      base: {
        script: 'dist/index.js',
        options: {
          watch: ['dist']
        }
      }
    },
    concurrent: {
      target: {
        tasks: ['ts', 'nodemon'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });

  grunt.registerTask('default', ['concurrent'])
}
