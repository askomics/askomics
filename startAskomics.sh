#! /bin/bash

dir_askomics=$(dirname "$0")
dir_config="$dir_askomics/configs"
dir_venv="$dir_askomics/venv"
dir_node_modules="$dir_askomics/node_modules"


python_ex="python3"
pyvenv="$python_ex -m venv"
pip="$python_ex -m pip"
gulp="$dir_node_modules/.bin/gulp"

python_flags="-s"

function usage() {
    echo "Usage: $0 (-d { dev | prod })"
    echo "    -d     deployment mode (default: production)"
    echo "    -r     run only (without build javascript and python)"
    echo "    -b     build only (python and js)"
}

# Default options
run=false
build=false

# Parse options -------------------------------------------
while getopts "ht:d:rb" option; do
    case $option in
        h)
            usage
            exit 0
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
# Check if venv is build. If not, build and activate it
# If yes, just activate it
activate="$dir_venv/bin/activate"

if [[ ! -f $activate ]]; then
    echo "building python virtual environment ..."
    $pyvenv $dir_venv
    source $activate
    $pip install --upgrade pip
    $pip install -e .
    if [ $? -ne 0 ]; then { echo "Failed, aborting." ; rm -rf $dir_venv ; exit 1; } fi
else
    source $activate
fi

# Install JS dependancies if not installed ----------------
if [[ ! -d $dir_node_modules ]]; then
    echo "javascript dependancies : npm install"
    # check binary dependancies
    npm -v >/dev/null 2>&1 || { echo "npm is required but is not installed.  Aborting." >&2; exit 1; }
    npm install
    if [ $? -ne 0 ]; then { echo "Failed, aborting." ; rm -$dir_node_modules ; exit 1; } fi
fi

# Build config file ---------------------------------------
config_template_path="$dir_config/askomics.ini.template"
config_path="$dir_config/askomics.ini"
if [[ ! -f $config_path ]]; then
    cp $config_template_path $config_path
fi

# Get environment variables -------------------------------
echo "Convert environment variables to ini file ..."
# This take ASKO_ env to update config in app:main section, only askomics. key
printenv | egrep "^ASKO_" | while read setting
do
    key="askomics."$(echo $setting | egrep -o "^ASKO_[^=]+" | sed 's/^.\{5\}//g' | tr '[:upper:]' '[:lower:]')
    value=$(echo $setting | egrep -o "=.*$" | sed 's/^=//g')
    $python_ex config_updater.py -p $config_path -s "app:main" -k $key -v $value
done

# This take ASKOCONFIG_ env to update config in any sections
printenv | egrep "^ASKOCONFIG_" | while read setting
do
    sed_setting=$(echo $setting | sed 's/\_colon\_/\:/g' | sed 's/\_hyphen\_/\-/g' | sed 's/\_dot\_/\./g')
    section=$(echo $sed_setting | egrep -o "^ASKOCONFIG_[^=]+" | sed 's/^.\{11\}//g' | cut -d "_" -f 1)
    key=$(echo $sed_setting | egrep -o "^ASKOCONFIG_[^=]+" | sed 's/^.\{11\}//g' | sed "s/$section\_//g")
    value=$(echo $sed_setting | egrep -o "=.*$" | sed 's/^=//g')
    $python_ex config_updater.py -p $config_path -s $section -k $key -v $value
done

# Build Javascript ----------------------------------------
askojs="$dir_askomics/askomics/static/dist/askomics.js"

# deploy JS if not run only option or if there is no js
if [[ $run == false ]]; then
    echo "deploying javascript ..."
    if [[ $depmode == "development" ]]; then
        $gulp $gulpmode &
    else
        $gulp $gulpmode
    fi
fi

# Run Askomics --------------------------------------------
pserve="$dir_venv/bin/pserve"
askomics="$python_ex $python_flags $pserve $config_path $pserve_flags"

if [[ $build == false ]]; then
    echo "starting askomics ..."
    echo "$askomics"
    $askomics
fi
