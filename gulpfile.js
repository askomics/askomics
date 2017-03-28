var gulp = require('gulp');
var util = require('gulp-util');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
//version 1.7.1 with bug
//var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var mocha = require('gulp-mocha');
var inject = require('gulp-inject');
//var rename = require('gulp-rename');
var istanbul = require('gulp-istanbul');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var istanbulReport = require('gulp-istanbul-report');
var uglify = require('gulp-uglify');
//var remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul');

//console.log(require('istanbul').Report.getReportList());

//var askomicsSourceFiles = ['askomics/static/js/app/**/*.js','!askomics/static/js/app/third-party/**/*.js'];
var askomicsSourceFiles = [
        'askomics/static/js/app/help/AskomicsHelp.js',
        'askomics/static/js/app/services/AskomicsRestManagement.js',
        'askomics/static/js/app/core/AskomicsUserAbstraction.js',
        'askomics/static/js/app/services/AskomicsJobsManager.js',
        'askomics/static/js/app/services/AskomicsObjectBuilder.js',
        'askomics/static/js/app/view/AskomicsPanelViewBuilder.js',
        'askomics/static/js/app/view/integration.js',
        'askomics/static/js/app/view/AskomicsResultsView.js',
        'askomics/static/js/app/query-handler.js',
        'askomics/static/js/app/objects/GraphObject.js',
        'askomics/static/js/app/objects/node/GraphNode.js',
        'askomics/static/js/app/objects/node/AskomicsNode.js',
        'askomics/static/js/app/objects/node/AskomicsAliasNode.js',
        'askomics/static/js/app/objects/node/AskomicsPositionableNode.js',
        'askomics/static/js/app/objects/link/GraphLink.js',
        'askomics/static/js/app/objects/link/AskomicsLink.js',
        'askomics/static/js/app/objects/link/AskomicsIsALink.js',
        'askomics/static/js/app/objects/link/AskomicsPositionableLink.js',
        'askomics/static/js/app/view/parameters/InterfaceParametersView.js',
        'askomics/static/js/app/view/parameters/ShortcutsParametersView.js',
        'askomics/static/js/app/view/parameters/ModulesParametersView.js',
        'askomics/static/js/app/view/AskomicsObjectView.js',
        'askomics/static/js/app/view/AskomicsLinkView.js',
        'askomics/static/js/app/view/AskomicsNodeView.js',
        'askomics/static/js/app/view/AskomicsPositionableLinkView.js',
        'askomics/static/js/app/view/AskomicsPositionableNodeView.js',
        'askomics/static/js/app/core/AskomicsMenu.js',
        'askomics/static/js/app/core/AskomicsGraphBuilder.js',
        'askomics/static/js/app/core/AskomicsForceLayoutManager.js',
        'askomics/static/js/app/core/AskomicsUser.js',
        'askomics/static/js/app/core/IHMLocal.js'
    ];

var askomicsCssFiles = [
  'askomics'
];

var prod = !!util.env.prod;
var reload = !!util.env.reload;

prod ? console.log('---> Production') : console.log('---> Development');
reload ? console.log('---> Reload') : util.noop();

/*
Default task : run 'build'
               if `gulp --reload`, watch AskOmics file and run 'build' when a file is modified
*/
gulp.task('default', ['build'], function () {
  reload ? gulp.watch(askomicsSourceFiles, ['build']) : util.noop();
});


/*
build task : jshint files
             babel
             concat all files in askomics.js
             if `gulp --prod` uglify askomics.js
*/
gulp.task('build', function() {
    return gulp.src(askomicsSourceFiles)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
    //    .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('askomics.js'))
        .pipe(prod ? uglify() : util.noop() )
     //   .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('askomics/static/dist'));
});

var coverageFile = './.coverage-js/coverage.json';
var mochaPhantomOpts = {
  reporter: 'spec',
  dump:'output_test.log',
  //https://github.com/ariya/phantomjs/wiki/API-Reference-WebPage#webpage-settings
  phantomjs: {
    useColors: true,
    hooks: 'mocha-phantomjs-istanbul',
    coverageFile: coverageFile,
    settings: {
      //userName,password
      webSecurityEnabled : false
    },
    browserConsoleLogOptions: true
  },
  suppressStdout: false,
  suppressStderr: false,
  globals: ['script*', 'jQuery*']
};

//https://github.com/willembult/gulp-istanbul-report
gulp.task('pre-test', function () {
  return gulp.src(askomicsSourceFiles, {base: "askomics/static/js"})
  //  .pipe(sourcemaps.init())
    .pipe(babel({presets: ['es2015']}))
    // Covering files
    .pipe(istanbul({coverageVariable: '__coverage__'}))
  //  .pipe(sourcemaps.write('.'))
    // Write the covered files to a temporary directory
    .pipe(gulp.dest('askomics/test/client/js/istanbul/'));
});

// Askomics test files
var askomicsTestSourceFiles = ['askomics/test/client/js/*.js'];
gulp.task('pre-test-srctest', function () {
  return gulp.src(askomicsTestSourceFiles)
    .pipe(babel({presets: ['es2015']}))
    // Write the covered files to a temporary directory
    .pipe(gulp.dest('askomics/test/client/js/istanbul/test'));
});

// writing dependancies about node_modules test framework
var testFrameworkFiles=[
  'node_modules/mocha/mocha.js',
  'node_modules/mocha/mocha.css',
  'node_modules/should/should.js',
  'node_modules/chai/chai.js',
  'node_modules/jquery/dist/jquery.js',
  'node_modules/intro.js/intro.js',
  'askomics/static/js/third-party/jquery.dataTables.min.js',
  'askomics/static/js/third-party/jQuery-contextMenu-2.30/jquery.contextMenu.min.js',
  'askomics/static/js/third-party/jQuery-contextMenu-2.30/jquery.ui.position.min.js',
];
// New Askomics files instrumented for coverage
var askomicsInstrumentedSourceFiles = askomicsSourceFiles.slice();
askomicsInstrumentedSourceFiles.forEach(function(element, index) {
  askomicsInstrumentedSourceFiles[index] = askomicsInstrumentedSourceFiles[index].replace('askomics/static/js','askomics/test/client/js/istanbul');
});



gulp.task('test', ['default','pre-test','pre-test-srctest'],function () {
    return gulp
    .src('askomics/test/client/index_tpl.html')
    .pipe(inject(gulp.src(testFrameworkFiles, {read: false}) , {relative: true, name: 'testFramework'}))
    .pipe(inject(gulp.src(askomicsInstrumentedSourceFiles, {read: false}), {relative: true, name: 'askomics'}))
    .pipe(inject(gulp.src(['askomics/test/client/js/istanbul/test/*.js'], {read: false}) , {relative: true, name: 'askomicsTestFiles'}))
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
            {'name': 'lcovonly', file: 'frontend.lcov'},
            {'name': 'lcovonly', file: 'lcov.info'}, // atom plugin lcov-info
            {'name': 'json', file: 'frontend.json'} // -> ./jsonCov/cov.json
          ]
        }));
    });
});
/*
gulp.task('remap-istanbul', function () {
    return gulp.src('coverage/frontend.json')
        .pipe(remapIstanbul({
            fail: true,
            reports: {
                'json': 'coverage.json',
                'html': 'html-report'
            }
        }));
});
*/
