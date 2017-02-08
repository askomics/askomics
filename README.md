# AskOmics

[![Build Status](https://travis-ci.org/askomics/askomics.svg?branch=master)](https://travis-ci.org/askomics/askomics)
[![Coverage Status](https://coveralls.io/repos/github/askomics/askomics/badge.svg?branch=master)](https://coveralls.io/github/askomics/askomics?branch=master)


 AskOmics is a visual SPARQL query interface supporting both intuitive data integration and querying while shielding the user from most of the technical difficulties underlying RDF and SPARQL

![Askomics Homepage](static/askomics_home.png)

## Run AskOmics

AskOmics is available under two supports : Docker and VM Virtualbox.

### AskOmics on Linux using Docker

Run Virtuoso using the tenforce/virtuoso docker image.

```
docker run docker run -d --name virtuoso -p 8890:8890 -p 1111:1111  -e VIRT_Parameters_DirsAllowed="/data,/data/dumps,., /usr/local/virtuoso-opensource/share/virtuoso/vad" -e VIRT_Parameters_TN_MAX_memory=4000000000 -e VIRT_SPARQL_ResultSetMaxRows=100000 -e VIRT_SPARQL_MaxQueryCostEstimationTime=300 -e VIRT_SPARQL_MaxQueryExecutionTime=300 -e VIRT_SPARQL_MaxDataSourceSize=1000000000 -e VIRT_Flags_TN_MAX_memory=4000000000 -e DBA_PASSWORD=dba -e SPARQL_UPDATE=true -e DEFAULT_GRAPH=http://localhost:8890/DAV --net="host" -t tenforce/virtuoso
```

Run AskOmics using the askomics/askomics docker image

```
docker run -d --net="host" -p 6543:6543 -t askomics/askomics virtuoso prod
```

### AskOmics on Windows using Virtualbox

download the last image of AskOmics (http://)

 * Import the image on Virtualbox
 * Run the virtual machine

Askomics is now available on your local machine !
If needed (but normaly you need'nt) to log inside the machine use the account login `askomics` and password `askomics`.
The VM is reachable with a SSH connexion :
ssh -p 3022 askomics:askomics@localhost

### Using askomics

Go to http://localhost:6543/

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
|---|---|---|---|---|---|
| 38+  | 13+  | Not supported  | 25+  |  7.1+ |

### Install Askomics

#### Requirements

+ python3.3
+ pip
+ venv
+ npm
+ gulp

Check the Dockerfile to see dependancies


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
