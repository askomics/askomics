#! /bin/bash

DIR_ASKOMICS=$(dirname "$0")
DIR_VENV=${DIR_VENV:-"${DIR_ASKOMICS}/venv"}

$DIR_VENV/bin/nosetests askomics/test  

