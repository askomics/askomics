#!/bin/bash
set -e

# script with sudo

GODIR=/var/local/go
#GOFILEURL=http://purl.obolibrary.org/obo/go/extensions/go-plus.owl
GOFILEURL=http://purl.obolibrary.org/obo/go.owl
#GOFILEURL=http://archive.geneontology.org/latest-termdb/go_daily-termdb.rdf-xml

if [ ! -d "$GODIR" ]; then
	mkdir $GODIR
fi

cp $(dirname $0)/virtuoso.ini $GODIR/

docker run --name go-virtuoso \
        -p 8891:8890 -p 1112:1111 \
        -e SPARQL_UPDATE=true \
        -v $GODIR:/data \
        -d tenforce/virtuoso 

sleep 10
# load data
curl -i --data-urlencode query="LOAD <$GOFILEURL> INTO GRAPH <$GOFILEURL>" -H "Content-Type: application/sparql-query" -G http://localhost:8891/sparql
# querying database
curl -i --data-urlencode query="select (count(?s) as ?count) where { ?s ?p ?o . }" -H "Content-Type: application/sparql-query" -G http://localhost:8891/sparql


