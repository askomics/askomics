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

#set property on custom.ini file
function set_property() {
    local newline="$1 = $2"
    # replace the line
    sed -i "/^$1/d" "$dir_config/custom.ini"
    sed -i "/app:main/a $newline" "$dir_config/custom.ini"
}
# Get config file -----------------------------------------
echo " === use config base : $dir_config/custom.ini "
cp "$dir_config/$depmode.$triplestore.ini" "$dir_config/custom.ini"

if [[ ! -z $TRIPLESTORE_ENDPOINT ]]; then
    echo "Custom triplestore endpoint: $TRIPLESTORE_ENDPOINT"
    set_property "askomics.endpoint" $TRIPLESTORE_ENDPOINT
fi

if [[ ! -z $TRIPLESTORE_UPDATEPOINT ]]; then
    echo "Custom triplestore updatepoint: $TRIPLESTORE_UPDATEPOINT"
    set_property "askomics.updatepoint" $TRIPLESTORE_UPDATEPOINT
fi

if [[ ! -z $TRIPLESTORE_ENDPOINT_USERNAME || ! -z $TRIPLESTORE_ENDPOINT_PASSWD  ]]; then
    if [[ -z $TRIPLESTORE_ENDPOINT_USERNAME || -z $TRIPLESTORE_ENDPOINT_PASSWD ]]; then
        >&2 echo "Bad definition of triplestore administration auth. You must defined TRIPLESTORE_ENDPOINT_USERNAME, TRIPLESTORE_ENDPOINT_PASSWD."
        exit 1
    fi

    echo "Defined triplestore auth with username $TRIPLESTORE_ENDPOINT_USERNAME"
    set_property "askomics.endpoint.username" $TRIPLESTORE_ENDPOINT_USERNAME
    set_property "askomics.endpoint.passwd" $TRIPLESTORE_ENDPOINT_PASSWD
fi

if [[ ! -z $ASKOMICS_LOAD_URL ]]; then
    echo "Custom load url: $ASKOMICS_LOAD_URL"
    set_property "askomics.load_url" $ASKOMICS_LOAD_URL
fi

if [[ ! -z $ASKOMICS_SMTP_HOST ]]; then
    if [[ -z $ASKOMICS_SMTP_PORT || -z $ASKOMICS_SMTP_LOGIN || -z $ASKOMICS_SMTP_PASSWORD ]]; then
        >&2 echo "Bad definition of smpt configuration. You must defined ASKOMICS_SMTP_HOST, ASKOMICS_SMTP_PORT, ASKOMICS_SMTP_LOGIN, ASKOMICS_SMTP_PASSWORD."
        exit 1
    fi
    echo "-- SMTP definition --"
    set_property "smtp.host" $ASKOMICS_SMTP_HOST
    set_property "smtp.port" $ASKOMICS_SMTP_PORT
    set_property "smtp.login" $ASKOMICS_SMTP_LOGIN
    set_property "smtp.password" $ASKOMICS_SMTP_PASSWORD
    if [[ ! -z $ASKOMICS_SMTP_STARTTLS ]]; then
        set_property "smtp.starttls" $ASKOMICS_SMTP_STARTTLS
    fi

fi

config_name="custom.ini"
config_path="$dir_config/$config_name"

if [[ ! -f $config_path ]]; then
    echo "Config file $config_name not found in $dir_config"
    usage
    exit 1
fi

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
