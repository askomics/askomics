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

### Install Pyramid

#### Create your Virtual Python Environment and activate it

```
$ virtualenv -p python3 ~/askomics-env
$ . ~/askomics-env/bin/activate
```

#### Install Pyramid Into the Virtual Python Environment

```
$ pip install "pyramid==1.5.7"
```

### Install SPARQLWrapper

```
$ pip install "SPARQLWrapper==1.6.4"
```

### Install AskOmics in your Virtual Python Environment

To be able to launch AskOmics, you will need to install it in your virtual environment.

If you want to develop AskOmics:
```
$ cd rdf-visual-query-builder/
$ python3 setup.py develop
```

If you don't want to develop AskOmics:
```
$ cd rdf-visual-query-builder/
$ python3 setup.py install
```

### Launch AskOmics server

Once installed, you will be able to launch AskOmics in 2 ways depending of your needs (development or production).

```
$ pserve development.ini 		# Add --reload if you don't want to relaunch your server everytime you make a change.
```
or

```
$ pserve production.ini
```

### Using AskOmics

Once launched, AskOmics will be available at http://localhost:6543/

### Running tests

AskOmics comes with some unit and functional tests.
To run them, you will first need to install some python packages:

```
$ pip install nose webtest
```

Then, to run the tests do the following:

```
$ nosetests askomics/test
$ gulp test
```
