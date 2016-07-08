
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
     options: {
      // define a string to put between each file in the concatenated output
      separator: ';'
     },
     dist: {
       // the files to concatenate
      src: ['askomics/static/js/*.js','askomics/static/js/**/*.js'],
      // the location of the resulting JS file
      dest: 'dist/<%= pkg.name %>.js'
     }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        files: {
        'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    qunit: {
     files: ['askomics/test/js/*.html']
    },
    jshint: {
      files: ['Gruntfile.js', 'askomics/static/js/*.js','askomics/static/js/**/*.js', 'askomics/test/js/*.js'],
      options: {
        globals: {
          jQuery: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },

    watchqunit: {
      files: ['askomics/test/js/*.js', 'askomics/test/js/*.html', 'askomics/static/js/*.js','askomics/static/js/**/*.js'],
      tasks: ['qunit']
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-concat');
  // Test jshint + qunit
  grunt.registerTask('test', ['jshint', 'qunit']);

  // Uglify : concat + uglify-concat
  grunt.registerTask('uglify2', ['concat', 'uglify']);

  // Default task(s).
  grunt.registerTask('default', ['jshint']);

};
