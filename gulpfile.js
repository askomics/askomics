var gulp = require('gulp');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var mocha = require('gulp-mocha');
var mochaPhantomJS = require('gulp-mocha-phantomjs');

gulp.task('default', function() {
    return gulp.src([
            'askomics/static/js/AskomicsRestManagement.js',
            'askomics/static/js/AskomicsUserAbstraction.js',
            'askomics/static/js/integration.js',
            'askomics/static/js/query-handler.js',
            'askomics/static/js/AskomicsMenuFile.js',
            'askomics/static/js/AskomicsMenuView.js',
            'askomics/static/js/node/GraphNode.js',
            'askomics/static/js/node/AskomicsNode.js',
            'askomics/static/js/node/AskomicsPositionableNode.js',
            'askomics/static/js/link/GraphLink.js',
            'askomics/static/js/link/AskomicsLink.js',
            'askomics/static/js/link/AskomicsPositionableLink.js',
            'askomics/static/js/view/AskomicsObjectView.js',
            'askomics/static/js/view/AskomicsLinkView.js',
            'askomics/static/js/view/AskomicsNodeView.js',
            'askomics/static/js/view/AskomicsPositionableLinkView.js',
            'askomics/static/js/view/AskomicsPositionableNodeView.js',
            'askomics/static/js/AskomicsGraphBuilder.js',
            'askomics/static/js/AskomicsForceLayoutManager.js',
            'askomics/static/js/MainAskomics.js'
        ])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(sourcemaps.init())
        .pipe(concat('askomics.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('askomics/static/dist'));
});

gulp.task('test', ['default'],function () {
    return gulp
    .src(
      [
        'askomics/test/client/GraphBuilder.html',
        'askomics/test/client/GraphNode.html'
      ])
    .pipe(mochaPhantomJS());
});
