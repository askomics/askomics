# Contribute to AskOmics

## Issues

If you have an idea for a feature to add or an approach for a bugfix, it is best to communicate with developers early. The most common venues for this are [GitHub issues](https://github.com/askomics/askomics/issues/).

## Pull requests

All changes to AskOmics should be made through pull requests to this repository.

For the [askomics repository](https://github.com/askomics/askomics) to your account. To keep your copy up to date, you need to frequently [sync your fork](https://help.github.com/articles/syncing-a-fork/):

```bash
git remote add upstream https://github.com/askomics/askomics
git fetch upstream
git checkout master
git merge upstream/master
```

Then, create a new branch for your new feature

```bash
git checkout -b my_new_feature
```

Commit and push your modification to your [fork](https://help.github.com/articles/pushing-to-a-remote/). If your changes modify code, please ensure that is conform to [AskOmics style](#coding-style-guidlines)

Write tests for your changes, and make sure that they [passes](#tests).

Open a pull request against the master branch of askomics. The message of your pull request should describe your modifications (why and how).

The pull request should pass all the continuous integration tests which are automatically run by Github using Travis CI. The coverage must be at least remain the same (but it's better if it increases)

## Tests

AskOmics use `nosetests` for Python tests.

### Dependencies

Tests needs some services to work.

- A virtuoso instance
- A galaxy instance
- A Ldap server with some entry

You can use some docker images

```bash
# Virtuoso
sudo docker run -d --name test_virtuoso -p 127.0.0.1:8890:8890 -p 127.0.0.1:1111:1111  -e DBA_PASSWORD=dba -e SPARQL_UPDATE=true -e DEFAULT_GRAPH=http://localhost:8890/DAV --net="host" -t tenforce/virtuoso
# Galaxy
sudo docker run -d --name galaxy -p 8080:80 -p 8021:21 -p 8022:22 bgruening/galaxy-stable
#ldap
sudo docker run -d --name simple-ldap -p 9189:389 -e ORGANISATION_NAME="AskoTests" -e SUFFIX="dc=askotest,dc=org" -e ROOT_USER="admin" -e ROOT_PW_CLEAR="askotest" -e FIRST_USER="true" -e USER_UID="jwick" -e USER_GIVEN_NAME="John" -e USER_SURNAME="Wick" -e USER_EMAIL="jwick@askotest.org" -e USER_PW_CLEAR="iamjohnwick" xgaia/simple-ldap
```

### Run tests

Activate the Python virtual environment and run nosetests.

```bash
source venv/bin/activate
nosetests
```

To skip the Galaxy tests, run

```bash
nosetests -a '!galaxy'
```

To target a single file test

```bash
nosetests --tests askomics/test/askView_test.py
```


The testing configuration is set in the `askomics/config/test.virtuoso.ini` INI file. You can see that the Galaxy account API key is `admin`. The docker image `bgruening/galaxy-stable` have a default admin account with this API key. If you use another galaxy instance, change the url and API key.

## Coding style guidelines

### General

Ensure all user-enterable strings are unicode capable. Use only English language for everything (code, documentation, logs, comments, ...)

### Python

We follow [PEP-8](https://www.python.org/dev/peps/pep-0008/), with particular emphasis on the parts about knowing when to be inconsistent, and readability being the ultimate goal.

- Whitespace around operators and inside parentheses
- 4 spaces per indent, spaces, not tabs
- Include docstrings on your modules, class and methods
- Avoid from module import \*. It can cause name collisions that are tedious to track down.
- Class should be in `CamelCase`, methods and variables in `lowercase_with_underscore`

### Javascript

We follow [W3 JavaScript Style Guide and Coding Conventions](https://www.w3schools.com/js/js_conventions.asp)

## Contribute to docs

all the documentation (including what you are reading) can be found [here](https://askomics.readthedocs.io). Files are on the [AskOmics repository](https://github.com/askomics/askomics/tree/master/docs).

To preview the docs, run

```bash
cd askomics
# source the askomics virtual env
source venv/bin/activate
cd docs
make html
```

html files are in `build` directory.

