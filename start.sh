#! /bin/bash
set -e

############################################
#                                          #
#             AskOmics laucher             #
#                                          #
############################################


function usage {
    echo "Options:"
    echo "    -t <triplestore>: the triplestore, default is virtuoso"
    echo "    -m <mode>: dev or prod, default is dev"
    echo ""
    echo "    -d <askomics directory>, default is script directory"
    echo "    -r : reload askomics when a file is modified"
    echo "    -h : print this help"
    exit 0
}


#Default option:
triplestore='virtuoso'
depmode='development'
gulpmode=''
# path=$(pwd)
path=$(dirname "$0")
arg='--reload'


# options
while getopts "t:m:d:rh" opt ; do
    case $opt in
        t)
            triplestore=$OPTARG
        ;;
        m)
            case $OPTARG in
                prod|production)
                    depmode="production"
                    gulpmode="--prod"
                ;;
                dev|development)
                    depmode="development"
                    gulpmode=""
                ;;
                *)
                    usage
                ;;
            esac
        ;;
        d)
            path=$OPTARG
        ;;
        r)
            arg='--reload'
        ;;
        h)

            usage
        ;;
    esac
done

config_file="$depmode.$triplestore.ini"
config_path="$path/configs/$config_file"

if [[ ! -f $config_path ]]; then
    echo "config file $config_path not found"
    exit 1
fi

# lauch gulp
echo "build javascript"
pushd $path > /dev/null
#gulp $gulpmode
popd > /dev/null

# build the venv
activate_path="$path/venv/bin/activate"

if [[ ! -f $activate_path ]]; then
    echo "building python virtual environement in $activate_path"
    pushd $path > /dev/null
    virtualenv -p python3 $path/venv || (>&2 echo -e "\nproblem with virtualenv/python-dev installation !\n\n";exit 1)
    source $activate_path
    $path/venv/bin/python3 -m pip install -e .
    popd > /dev/null
else
    echo "activate the virtual environment ..."
    source $activate_path
    
fi

source $activate_path

echo "launch AskOmics:python3 $path/venv/bin/pserve $config_path $arg"
python3 $path/venv/bin/pserve $config_path $arg
