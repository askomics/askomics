#!/bin/bash
set -e
set -x

DIR_ASKOMICS=$(dirname "$0")

DIR_CONFIG="${DIR_ASKOMICS}/configs"
DIR_VENV=${DIR_VENV:-"${DIR_ASKOMICS}/venv"}

PYTHON=${PYTHON:-"python3"}
PYVENV=${PYVENV:-"$PYTHON -m venv"}
PIP=${PIP:-"$PYTHON -m pip"}

PYTHON_FLAGS+=( -s )

function usage {
    echo $"Usage: $0 { fuseki | agraph | virtuoso } ({ dev | prod })"
    echo " - args1: RDF Triple Store"
    echo " - args2: deployment mode, production or development (default=prod)"
    exit 1
}

if [[ $# -eq 0 ]] ; then
    usage ;
fi

RDFTYPE=$1
DEPMODE=$2
case "$DEPMODE" in
    prod|production|"")
        DEPMODE="production"
        GULPMODE="--prod"
        PSERVE_FLAGS+=( -b -q )
        PYTHON_FLAGS+=( -OO )
        ;;
    dev|development)
        DEPMODE="development"
        PSERVE_FLAGS+=( --reload )
        PYTHON_FLAGS+=( -bb -Wall )
        ;;
    *)
        usage
esac
echo "-----------------------------------------------------------------------------"

CONFIG_NAME="${DEPMODE}.${RDFTYPE}.ini"
CONFIG_PATH="${DIR_CONFIG}/${CONFIG_NAME}"
if [[ ! -f $CONFIG_PATH ]]; then
    echo "Configuration file ${CONFIG_NAME} not found in ${DIR_CONFIG}."
    usage
fi
echo "${DIR_VENV}-----------------------------------------------------------------------------"
ACTIVATE="${DIR_VENV}/bin/activate"
if [[ ! -f $ACTIVATE ]] ; then
    echo "Building python virtual environment at ${DIR_VENV}..."
    #$PYTHON -m ensurepip
    $PYVENV "$DIR_VENV"
    source "$ACTIVATE"
    $PIP install -e .
else
    source "$ACTIVATE"
fi
echo "-----------------------------------------------------------------------------"

ASKOMICS="$PYTHON ${PYTHON_FLAGS[@]} "${DIR_VENV}/bin/pserve" $CONFIG_PATH ${PSERVE_FLAGS[@]}"

echo "deploy .js"
gulp $GULPMODE

echo "Starting askomics with:"
echo "$ . '${ACTIVATE}'"
echo "$ ${ASKOMICS}"

$ASKOMICS
