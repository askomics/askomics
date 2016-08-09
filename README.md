# AskOmics

[![Build Status](https://travis-ci.org/askomics/askomics.svg?branch=master)](https://travis-ci.org/askomics/askomics)
[![Coverage Status](https://coveralls.io/repos/github/askomics/askomics/badge.svg?branch=master)](https://coveralls.io/github/askomics/askomics?branch=master)


AskOmics is a visual SPARQL query builder for RDF database. One of its advantages
is that you don't need to know how to use SPARQL or the structure of your database.

------------------
## Getting started

### Requirements

If you want to use AskOmics, you will need :

* [Python 3.3](https://www.python.org/downloads/) (or greater)
* [Pyramid 1.5](http://www.pylonsproject.org) (or greater)
* [SPARQLWrapper](https://rdflib.github.io/sparqlwrapper/) 1.6.4 (or greater)

AskOmics also uses the following bundled libraries:

* [Bootstrap](http://getbootstrap.com)
* [D3.js](http://d3js.org)
* [jQuery](http://jquery.com)
* [jQuery-File-Upload](https://github.com/blueimp/jQuery-File-Upload)
* [Handlebars.js](http://handlebarsjs.com/)
* [Google Material icons](https://design.google.com/icons/)

#### Browser compatibility

| Chrome | Firefox | Internet Explorer | Opera | Safari |
|---|---|---|---|---|---|
| 38+  | 13+  | Not supported  | 25+  |  7.1+ |

### Install Askomics

#### Requirements

+ python3.3
+ pip
+ venv

You will need to install some [npm](https://www.npmjs.com/package/npm) packages:

```
npm install --save-dev gulp
npm install --save-dev gulp-util
npm install --save-dev gulp-concat
npm install --save-dev gulp-sourcemaps
npm install --save-dev gulp-babel babel-preset-es2015
npm install --save-dev gulp-mocha
npm install gulp-mocha-phantomjs --save-dev
npm install should --save-dev
npm install --save-dev mocha
npm install --save-dev chai
npm install jshint gulp-jshint --save-dev
npm install mocha-phantomjs-istanbul --save-dev
npm install gulp-istanbul --save-dev
npm install gulp-istanbul-report --save-dev
npm install gulp-inject --save-dev
npm install gulp-uglify --save-dev
npm install gulp-util --save-dev
gem install coveralls-lcov


```

#### Installation with Docker


```
$ ./startService.sh <triplestore> <mode>
```
with:

+ triplestore: fuseki or virtuoso
+ mode: production or development

#### Manual installation

+ Install  Virtuoso or Fuseki
+ Run `startAskomics.sh`

```
$ ./startAskomics <triplestore> <mode>
```
with:

+ triplestore: fuseki or virtuoso
+ mode: production or development

#### Developpment

If you want to develop AskOmics, run:

```
$ gulp --dev --reload
```
It will reload javascript files when a file is modified.

### Using AskOmics

Once launched, AskOmics will be available at http://localhost:6543/

### Running tests

AskOmics comes with some unit and functional tests.

#### Python tests

```
$ ./testAskomics.sh
```
Python test work only with Virtuoso

#### Javascript tests

```
$ gulp test
```

