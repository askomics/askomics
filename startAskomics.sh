#! /bin/bash

dir_askomics=$(dirname "$0")
dir_config="$dir_askomics/configs"
dir_venv="$dir_askomics/venv"

python_ex="python3"
pyvenv="$python_ex -m venv"
pip="$python_ex -m pip"

python_flags="-s"

function usage() {
    echo "Usage: $0 (-t { fuseki | agraph | virtuoso }) (-d { dev | prod })"
    echo "    -t     triplestore (default: virtuoso)"
    echo "    -d     deployment mode (default: production)"
    echo "    -r     run only (without build javascript and python)"
    echo "    -b     build only (python and js)"
}

# Default options
triplestore="virtuoso"
run=false
build=false

while getopts "ht:d:rb" option; do
    case $option in
        h)
            usage
            exit 0
        ;;

        t)
            triplestore=$OPTARG
        ;;

        d)
            depmode=$OPTARG
        ;;

        r)
            run=true
        ;;

        b)
            build=true
        ;;
    esac
done

case $depmode in
    prod|production|"")
        depmode="production"
        gulpmode="--prod"
        pserve_flags="-b -q"
        python_flags="$python_flags -OO"
    ;;
    dev|development)
        depmode="development"
        gulpmode="--reload"
        pserve_flags="--reload"
        python_flags="$python_flags -bb -Wall"
    ;;
    *)
        echo "-d $depmode: wrong deployment mode"
        usage
        exit 1
esac

config_name="$depmode.$triplestore.ini"
config_path="$dir_config/$config_name"

if [[ ! -f $config_path ]]; then
    echo "Config file $config_name not found in $dir_config"
    usage
    exit 1
fi

activate="$dir_venv/bin/activate"

if [[ ! -f $activate ]]; then
    echo "building python virtual environment ..."
    $pyvenv $dir_venv
    source $activate
    $pip install -e
else
    source $activate
fi

if [[ $run == false ]]; then
    echo "deploying javascript ..."
    gulp $gulpmode
fi

pserve="$dir_venv/bin/pserve"
askomics="$python_ex $python_flags $pserve $config_path $pserve_flags"

if [[ $build == false ]]; then
    echo "starting askomics ..."
    $askomics
fi
