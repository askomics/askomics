#! /bin/bash

dir_askomics=$(dirname "$0")
dir_config="$dir_askomics/configs"
dir_venv="$dir_askomics/venv"
dir_node_modules="$dir_askomics/node_modules"


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

# Parse options -------------------------------------------
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

# Get flags and deployment mode ---------------------------
case $depmode in
    prod|production|"")
        depmode="production"
        gulpmode="--prod"
        pserve_flags="-q"
        python_flags="$python_flags"
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

# Build python virtual environment ------------------------
activate="$dir_venv/bin/activate"

if [[ ! -f $activate ]]; then
    echo "building python virtual environment ..."
    $pyvenv $dir_venv
    source $activate
    $pip install --upgrade pip
    $pip install -e .
else
    source $activate
fi

if [[ ! -d $dir_node_modules ]]; then
    echo "javascript dependancies : npm install"
    # check binaries dependancies
    npm -v >/dev/null 2>&1 || { echo "npm is required but it's not installed.  Aborting." >&2; exit 1; }
    npm install
fi

# Build config file ---------------------------------------
config_name="custom.ini"
config_path="$dir_config/$config_name"

echo "Convert environment variables to ini file ..."
cp "$dir_config/$depmode.$triplestore.ini" "$config_path"
printenv | egrep "^ASKO_" | while read setting
do
    key="askomics."$(echo $setting | egrep -o "^ASKO_[^=]+" | sed 's/^.\{5\}//g' | tr '[:upper:]' '[:lower:]')
    value=$(echo $setting | egrep -o "=.*$" | sed 's/^=//g')
    $python_ex -c "import configparser; config = configparser.ConfigParser(); config.read('"$config_path"'); config['app:main']['"$key"'] = '"$value"'; config.write(open('"$config_path"', 'w'))"
done

# Build Javascript ----------------------------------------
askojs="$dir_askomics/askomics/static/dist/askomics.js"

# deploy JS if not run only option or if there is no js
if [[ $run == false || ! -f $askojs ]]; then
    echo "deploying javascript ..."
    gulp $gulpmode &
fi

# Run Askomics --------------------------------------------
pserve="$dir_venv/bin/pserve"
askomics="$python_ex $python_flags $pserve $config_path $pserve_flags"

if [[ $build == false ]]; then
    echo "starting askomics ..."
    echo "$askomics"
    $askomics
fi
