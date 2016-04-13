#!/bin/bash

AGRAPHUSER=test
AGRAPHPASS=xyzzy
AGRAPHREPOSITORY=database
AGRAPHMAXSIZETRIPLET=10000

FUSEKIMAXSIZETRIPLET=10000

function usage {
    echo $"Usage: $0 { fuseki | agraph | virtuoso } ({ dev | prod })"
    echo " - args1: RDF Triple Store"
    echo " - args2: deployment mode, production or development (default=prod)"
    exit 1
}

DIRROOT=`dirname $0`

if [[ $# -eq 0 ]] ; then
    usage ;
fi

RDFTYPE=$1
DEPMODE=$2

case "$DEPMODE" in
    prod|production|"")
        DEPMODE="production"
        ;;
    dev|development)
        DEPMODE="development"
        ;;
    *)
        usage
esac

echo "Will launch AskOmics in $DEPMODE mode"

if [ -z `which docker` ];then
    echo >&2 " == docker is not installed !! == "
    exit 1
fi

# Build and run TripleStore RDF data
case "$RDFTYPE" in
    fuseki)
        echo " ================ FUSEKI =============="
        if [ -z `sudo docker images | grep "askomics/fuseki$" | awk '{print $1}'` ];then
            pushd $DIRROOT/docker/fuseki/
            sudo docker build -t askomics/fuseki .
            popd
        fi

        sudo docker run -d --name fuseki -p 3030:3030 --net="host" -t askomics/fuseki:latest
        ;;

    agraph)
        echo "================= ALLEGROGRAPH (franzinf/agraph ) ================"
        if [ -z `sudo docker images | grep "franzinc/agraph$" | awk '{print $1}'` ];then
            sudo docker pull franzinc/agraph
        fi

        sudo docker run -d -p 10000-10035:10000-10035 --net="host" --name agraph franzinc/agraph
        ;;

      virtuoso)
        echo "================= VIRTUOSO (docker tenforce/virtuoso) ================"
        if [ -z `sudo docker images | grep "tenforce/virtuoso$" | awk '{print $1}'` ];then
            sudo docker pull tenforce/virtuoso
        fi
        sudo docker run -d --name virtuoso -p 8890:8890 -p 1111:1111  -e DBA_PASSWORD=dba -e SPARQL_UPDATE=true -e DEFAULT_GRAPH=http://localhost:8890/DAV --net="host" -t tenforce/virtuoso
        ;;
    *)
        usage
esac

# Build Askomics/Web every exec because triplestore could be changed...=> reload production.ini
if [ -z `sudo docker images | grep "askomics/web$" | awk '{print $1}'` ];then
    pushd $DIRROOT
    sudo docker build -t askomics/web .
    popd
fi

case "$RDFTYPE" in
    agraph)
        echo " ********************************************************************** "
        echo " * !!!! WARNING create new repository called '$AGRAPHREPOSITORY' at http://localhost:10035"
        echo " * login  : $AGRAPHUSER"
        echo " * paswwd : $AGRAPHPASS"
        echo " ********************************************************************** "

        sudo docker run -d --net="host" -p 6543:6543 -t askomics/web pserve $DEPMODE.agraph.ini
        ;;
    fuseki)
        sudo docker run -d --net="host" -p 6543:6543 -t askomics/web pserve $DEPMODE.fuseki.ini
        ;;
    virtuoso)
        sudo docker run -d --net="host" -p 6543:6543 -t askomics/web pserve $DEPMODE.virtuoso.ini
        ;;
esac


echo "------------------------------------------------"
echo "-- ASKOMICS WEB : ** http://localhost:6543 ** --"
echo "------------------------------------------------"
