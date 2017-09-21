# AskOmics

[![Build Status](https://travis-ci.org/askomics/askomics.svg?branch=master)](https://travis-ci.org/askomics/askomics)
[![Coverage Status](https://coveralls.io/repos/github/askomics/askomics/badge.svg?branch=master)](https://coveralls.io/github/askomics/askomics?branch=master)
![Docker Build](https://img.shields.io/docker/pulls/askomics/docker-askomics.svg)

![Askomics logo](static/askomics.png)

AskOmics is a visual SPARQL query interface supporting both intuitive data integration and querying while shielding the user from most of the technical difficulties underlying RDF and SPARQL

![Askomics Homepage](static/askomics_home.png)

## Run AskOmics

AskOmics is available under two supports : Docker and VM Virtualbox.

https://github.com/askomics/askomics/wiki

------------------

## Development information

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
* [Font Awesome icons](http://fontawesome.io/icons/)
* [DataTables](https://datatables.net/)
* [jQuery contextMenu](http://swisnl.github.io/jQuery-contextMenu/index.html)

#### Browser compatibility

| Chrome | Firefox | Internet Explorer | Opera | Safari |
|---|---|---|---|---|
| 38+  | 13+  | Not supported  | 25+  |  7.1+ |

### Install Askomics

#### Requirements

+ python3.3
+ pip
+ venv
+ npm
+ gulp
+ docker

#### Manual installation

+ Install  Virtuoso

```
docker run -d --name virtuoso \
        -e VIRT_Parameters_TN_MAX_memory=4000000000 \
        -e VIRT_SPARQL_ResultSetMaxRows=100000 \
        -e VIRT_SPARQL_MaxQueryCostEstimationTime=300 \
        -e VIRT_SPARQL_MaxQueryExecutionTime=300 \
        -e VIRT_SPARQL_MaxDataSourceSize=1000000000 \
        -e VIRT_Flags_TN_MAX_memory=4000000000 \
        -e DBA_PASSWORD=dba \
        -e SPARQL_UPDATE=true \
        -e DEFAULT_GRAPH=http://localhost:8890/DAV \
        --net="host" -t xgaia/virtuoso
```

+ Run `startAskomics.sh`

```
./startAskomics -t <triplestore> -d <mode>
```

with:

+ triplestore: fuseki or virtuoso
+ mode: prod (production) or dev (development)


### Running tests

AskOmics comes with some unit and functional tests.

#### Python tests

To run tests, AskOmics need a triplestore and a Galaxy instance.

The testing configuration is set in the `test.virtuoso.ini` file.

To get a Galaxy instance, you can run a docker galaxy with the following lines

    docker pull bgruening/galaxy-stable
    docker run -d -p 8080:80 -p 8021:21 -p 8022:22 bgruening/galaxy-stable

Then, test can be run with

```
./venv/bin/python setup.py nosetests
```
#### Javascript tests

```
gulp test
```
