export VENV=~/env
virtualenv -p python3 $VENV
$VENV/bin/easy_install "pyramid==1.5.7"
$VENV/bin/easy_install "SPARQLWrapper"
$VENV/bin/easy_install "Pygments==2.1.3"

$VENV/bin/python setup.py develop
$VENV/bin/pserve configs/development.ini

