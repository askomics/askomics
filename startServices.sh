#!/bin/bash
set -e;

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

#trap to remove service docker launch by this script
function remove_services_docker {
  docker rm -f `docker ps -n=2 | grep askomics | awk '{print $1}'` 2>/dev/null
}
trap remove_services_docker ERR


DIRROOT=`dirname $0`

if [[ $# -eq 0 ]] ; then
    usage ;
fi

RDFTYPE=$1
DEPMODE=$2

PYTHON=${PYTHON:-$(which python3)}

case "$DEPMODE" in
    prod|production|"")
        DEPMODE="prod"
        ;;
    dev|development)
        DEPMODE="dev"
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
        echo " ================ FUSEKI (askomics/fuseki) =============="
        if [ -z `docker images | grep "askomics/fuseki$" | awk '{print $1}'` ];then
            pushd $DIRROOT/docker/fuseki/
            docker build -t askomics/fuseki .
            popd
        fi

         docker run -d --name fuseki -p 3030:3030 --net="host" -t askomics/fuseki:latest
        ;;

    agraph)
        echo "================= ALLEGROGRAPH (franzinf/agraph ) ================"
        if [ -z `docker images | grep "franzinc/agraph$" | awk '{print $1}'` ];then
            docker pull franzinc/agraph
        fi

        docker run -d -p 10000-10035:10000-10035 --net="host" --name agraph franzinc/agraph
        ;;

      virtuoso)
        echo "================= VIRTUOSO (tenforce/virtuoso) ================"
        docker run -d --name virtuoso -p 8890:8890 -p 1111:1111  \
        -e VIRT_Parameters_TN_MAX_memory=4000000000 \
        -e VIRT_SPARQL_ResultSetMaxRows=100000 \
        -e VIRT_SPARQL_MaxQueryCostEstimationTime=300 \
        -e VIRT_SPARQL_MaxQueryExecutionTime=300 \
        -e VIRT_SPARQL_MaxDataSourceSize=1000000000 \
        -e VIRT_Flags_TN_MAX_memory=4000000000 \
        -e DBA_PASSWORD=dba \
        -e SPARQL_UPDATE=true \
        -e DEFAULT_GRAPH=http://localhost:8890/DAV \
        --net="host" -t tenforce/virtuoso
	;;
    *)
        usage
esac

# Build Askomics/Web every exec because triplestore could be changed...=> reload production.ini
if [ -z `docker images | grep "askomics/web$" | awk '{print $1}'` ];then
    pushd $DIRROOT
    docker build -t askomics/web .
    popd
fi

case "$RDFTYPE" in
    agraph)
        echo " ********************************************************************** "
        echo " * !!!! WARNING create new repository called '$AGRAPHREPOSITORY' at http://localhost:10035"
        echo " * login  : $AGRAPHUSER"
        echo " * paswwd : $AGRAPHPASS"
        echo " ********************************************************************** "
        ;;
esac

docker run -d --net="host" -p 6543:6543 -t askomics/web $RDFTYPE $DEPMODE


echo "------------------------------------------------"
echo "-- ASKOMICS WEB : ** http://localhost:6543 ** --"
echo "------------------------------------------------"
