var gulp = require('gulp');
var util = require('gulp-util');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var handlebars = require('gulp-handlebars');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var pump = require('pump');

var askomicsSourceFiles = [
        'askomics/static/src/js/help/AskomicsHelp.js',
        'askomics/static/src/js/services/AskomicsRestManagement.js',
        'askomics/static/src/js/core/AskomicsUserAbstraction.js',
        'askomics/static/src/js/services/AskomicsJobsManager.js',
        'askomics/static/src/js/services/AskomicsObjectBuilder.js',
        'askomics/static/src/js/view/AskomicsPanelViewBuilder.js',
        'askomics/static/src/js/view/integration.js',
        'askomics/static/src/js/view/AskomicsResultsView.js',
        'askomics/static/src/js/query-handler.js',
        'askomics/static/src/js/objects/GraphObject.js',
        'askomics/static/src/js/objects/node/GraphNode.js',
        'askomics/static/src/js/objects/node/AskomicsNode.js',
        'askomics/static/src/js/objects/node/AskomicsAliasNode.js',
        'askomics/static/src/js/objects/node/AskomicsPositionableNode.js',
        'askomics/static/src/js/objects/link/GraphLink.js',
        'askomics/static/src/js/objects/link/AskomicsLink.js',
        'askomics/static/src/js/objects/link/AskomicsIsALink.js',
        'askomics/static/src/js/objects/link/AskomicsPositionableLink.js',
        'askomics/static/src/js/view/parameters/InterfaceParametersView.js',
        'askomics/static/src/js/view/parameters/ShortcutsParametersView.js',
        'askomics/static/src/js/view/parameters/ModulesParametersView.js',
        'askomics/static/src/js/view/AskomicsObjectView.js',
        'askomics/static/src/js/view/AskomicsLinkView.js',
        'askomics/static/src/js/view/AskomicsNodeView.js',
        'askomics/static/src/js/view/AskomicsPositionableLinkView.js',
        'askomics/static/src/js/view/AskomicsPositionableNodeView.js',
        'askomics/static/src/js/core/AskomicsMenu.js',
        'askomics/static/src/js/core/AskomicsGraphBuilder.js',
        'askomics/static/src/js/core/AskomicsForceLayoutManager.js',
        'askomics/static/src/js/core/AskomicsUser.js',
        'askomics/static/src/js/core/IHMLocal.js'
    ];

var askomicsCssFiles = ['askomics/static/src/css/*.css'];

var askomicsTemplateFiles = ['askomics/static/src/templates/handlebars/*.hbs'];

var prod = !!util.env.prod;
var reload = !!util.env.reload;

prod ? console.log('---> Production') : console.log('---> Development');
reload ? console.log('---> Reload') : util.noop();

// Default task : run build task, if `gulp --reload`, watch AskOmics file and run build when a file is modified
gulp.task('default', ['javascript', 'css', 'templates'], function () {
  reload ?gulp.watch(askomicsSourceFiles, ['javascript']) : util.noop() ;
  reload ?gulp.watch(askomicsCssFiles, ['css']) : util.noop() ;
  reload ?gulp.watch(askomicsTemplateFiles, ['templates']) : util.noop() ;
});

// Concat all js files, uglyfy if --prod
gulp.task('javascript', function(cb) {
    pump([
        gulp.src(askomicsSourceFiles),
        jshint(),
        jshint.reporter('default'),
        babel({presets: ['es2015']}),
        concat('askomics.js'),
        prod ? uglify() : util.noop(),
        gulp.dest('askomics/static/dist/')
    ], cb);
});

// Concat all css files, uglyfy if --prod
gulp.task('css', function(cb) {
    pump([
        gulp.src(askomicsCssFiles),
        concat('askomics.css'),
        prod ? uglifycss() : util.noop(),
        gulp.dest('askomics/static/dist/')
    ], cb);
});

// Concat all handlebars files, uglyfy if --prod
gulp.task('templates', function(cb) {
    pump([
        gulp.src(askomicsTemplateFiles),
        handlebars({
            handlebars: require('handlebars')
        }),
        wrap('Handlebars.template(<%= contents %>)'),
        declare({
            namespace: 'AskOmics.templates',
            noRedeclare: true
        }),
        concat('templates.js'),
        prod ? uglify() : util.noop(),
        gulp.dest('askomics/static/dist/')
    ], cb)
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
  var istanbul = require('gulp-istanbul');
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
    var inject = require('gulp-inject');
    var mochaPhantomJS = require('gulp-mocha-phantomjs');
    var istanbulReport = require('gulp-istanbul-report');
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
