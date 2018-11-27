const { task, watch, series, parallel, src, dest } = require('gulp');
const pump = require('pump');
const jshint = require('gulp-jshint');
const args = require('minimist')(process.argv.slice(2));
const concat = require('gulp-concat');
const noop = require("gulp-noop");
const terser = require('gulp-terser');
const handlebars = require('gulp-handlebars');
const wrap = require('gulp-wrap');
const declare = require('gulp-declare');
const uglifycss = require('gulp-uglifycss');
const del = require('del');
const babel = require('gulp-babel');

let javascripts_files = [
        'askomics/static/src/js/help/AskomicsHelp.js',
        'askomics/static/src/js/services/AskomicsRestManagement.js',
        'askomics/static/src/js/core/AskomicsUserAbstraction.js',
        'askomics/static/src/js/services/AskomicsJobsManager.js',
        'askomics/static/src/js/services/AskomicsObjectBuilder.js',
        'askomics/static/src/js/services/AskomicsGalaxyService.js',
        'askomics/static/src/js/view/AskomicsPanelViewBuilder.js',
        'askomics/static/src/js/view/integration.js',
        'askomics/static/src/js/view/AskomicsResultsView.js',
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
        'askomics/static/src/js/view/parameters/ServerInformationsView.js',
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

let css_files = ['askomics/static/src/css/*.css'];
let templates_files = ['askomics/static/src/templates/handlebars/*.hbs'];
let build_dir = 'askomics/static/dist/'

function clean(cb) {
  del(build_dir + '*');
  cb();
}

function css(cb) {
    pump([
        src(css_files),
        concat('askomics.css'),
        args['prod'] ? uglifycss() : noop(),
        dest(build_dir)
    ], cb)
}

function javascript(cb) {
    pump([
        src(javascripts_files),
        jshint(),
        jshint.reporter('default'),
        babel({presets: ['@babel/env']}),
        concat('askomics.js'),
        args['prod'] ? terser() : noop(),
        dest(build_dir)
    ], cb);
}

function template(cb){
    pump([
        src(templates_files),
        handlebars({handlebars: require('handlebars')}),
        wrap('Handlebars.template(<%= contents %>)'),
        declare({
            namespace: 'AskOmics.templates',
            noRedeclare: true
        }),
        concat('templates.js'),
        args['prod'] ? terser() : noop(),
        dest(build_dir)
    ], cb);
}

if (args['reload']) {
    watch(javascripts_files, javascript);
    watch(css_files, css);
    watch(templates_files, template);
}

exports.default = series(clean, parallel(css, javascript, template));
