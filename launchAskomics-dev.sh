export VENV=~/env
virtualenv -p python3 $VENV
$VENV/bin/easy_install "pyramid==1.7"
$VENV/bin/easy_install "SPARQLWrapper"
$VENV/bin/easy_install "Pygments==2.1.3"
$VENV/bin/easy_install "requests==2.10.0"

#$VENV/bin/python setup.py develop
$VENV/bin/pserve configs/development.virtuoso.ini
#$VENV/bin/pserve configs/development.fuseki.ini
#$VENV/bin/pserve configs/development.corese.ini

#Executing tests
#$VENV/bin/python setup.py nosetests #--verbosity=2 --nocapture

#enerate script travis

