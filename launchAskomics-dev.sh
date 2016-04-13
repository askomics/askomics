export VENV=~/env
virtualenv -p python3 $VENV
$VENV/bin/easy_install "pyramid==1.5.7"
$VENV/bin/easy_install "SPARQLWrapper"
$VENV/bin/python setup.py develop
$VENV/bin/pserve development.ini

