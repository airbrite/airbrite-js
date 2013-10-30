module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['src/*.js'],
      options: {
        '-W030': true
      }
    },
    mocha: {
      tests: {
        src: ['test/**/*.html'],
        options: {
          run: true,
          reporter: 'Nyan',
          timeout: 10000
        }
      }
    },
    concat: {
      dist: {
        src: [
          'src/nested-extensions.js',
          'src/core.js',
          'src/product.js',
          'src/order.js'
        ],
        dest: 'build/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        files: {
          'build/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-mocha');

  // Default task(s).
  grunt.registerTask('default', ['jshint','mocha','concat','uglify']);
  grunt.registerTask('test', ['mocha']);
};
