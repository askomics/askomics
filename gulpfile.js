var gulp = require('gulp');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var mocha = require('gulp-mocha');
var inject = require('gulp-inject');
//var rename = require('gulp-rename');
var istanbul = require('gulp-istanbul');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var istanbulReport = require('gulp-istanbul-report');

//console.log(require('istanbul').Report.getReportList());

var askomicsSourceFiles = [
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
    ];

//var askomicsSourceFiles = ['askomics/static/js/**/*.js','!askomics/static/js/third-party/**/*.js'];
gulp.task('default', function() {
    return gulp.src(askomicsSourceFiles)
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

var coverageFile = './coverage/coverage.json';
var mochaPhantomOpts = {
  reporter: 'spec',
  phantomjs: {
    useColors: true,
    hooks: 'mocha-phantomjs-istanbul',
    coverageFile: coverageFile
  }
};

//https://github.com/willembult/gulp-istanbul-report
gulp.task('pre-test', function () {
  return gulp.src(askomicsSourceFiles, {base: "askomics/static/js"})
    .pipe(babel({presets: ['es2015']}))
    .pipe(sourcemaps.init())
    // Covering files
    .pipe(istanbul({coverageVariable: '__coverage__'}))
    .pipe(sourcemaps.write('.'))
    // Write the covered files to a temporary directory
    .pipe(gulp.dest('askomics/test/client/js/istanbul/'));
});

// writing dependancies about node_modules test framework
var testFrameworkFiles=[
  'node_modules/mocha/mocha.js',
  'node_modules/mocha/mocha.css',
  'node_modules/should/should.js',
  'node_modules/chai/chai.js'
];
// New Askomics files instrumented for coverage
var askomicsInstrumentedSourceFiles = askomicsSourceFiles.slice();
askomicsInstrumentedSourceFiles.forEach(function(element, index) {
  askomicsInstrumentedSourceFiles[index] = askomicsInstrumentedSourceFiles[index].replace('askomics/static/js','askomics/test/client/js/istanbul');
});

// Askomics test files
var askomicsTestSourceFiles = ['askomics/test/client/js/*.js'];

gulp.task('test', ['default','pre-test'],function () {
    return gulp
    .src('askomics/test/client/index_tpl.html')
    .pipe(inject(gulp.src(testFrameworkFiles, {read: false}) , {relative: true, name: 'testFramework'}))
    .pipe(inject(gulp.src(askomicsInstrumentedSourceFiles, {read: false}), {relative: true, name: 'askomics'}))
    .pipe(inject(gulp.src(askomicsTestSourceFiles, {read: false}) , {relative: true, name: 'askomicsTestFiles'}))
    //.pipe(rename('index.html'))
    .pipe(gulp.dest('askomics/test/client/'))
    .pipe(mochaPhantomJS(mochaPhantomOpts))
    .on('finish', function() {
      gulp.src(coverageFile)
        .pipe(istanbulReport({
          reporterOpts: {
            dir: './coverage'
          },
          includeAllSources: true,
          includeUntested : true,
          reporters: [
            'text',
            'text-summary',
            {'name': 'text', file: 'frontend.txt'}, // -> ./coverage/report.txt
            {'name': 'lcovonly', file: 'frontend.lcov'},
            {'name': 'json', file: 'frontend.json'} // -> ./jsonCov/cov.json
          ]
        }));
    });
});
