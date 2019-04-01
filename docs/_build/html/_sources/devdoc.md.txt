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

```bash
cd askomics
source venv/bin/activate
nosetests
```

Open a pull request against the master branch of askomics. The message of your pull request should describe your modifications (why and how).

The pull request should pass all the continuous integration tests which are automatically run by Github using Travis CI. The coverage must be at least remain the same (but it's better if it increases)

## Tests

AskOmics use nosetests for Python tests. To run the tests, activate the Python virtual environment and run nosetests.

```bash
source venv/bin/activate
nosetests
```

Tests needs a Virtuoso instance and a Galaxy instance. You can use docker images.

To skip the Galaxy tests, run

```bash
nosetests -a '!galaxy'
```

To target a single file test

```bash
nosetests --tests askomics/test/askView_test.py
```

```bash
# Virtuoso
docker pull askomics/virtuoso
docker run -d -p :8890:8890 -e DBA_PASSWORD=dba -e SPARQL_UPDATE=true -e DEFAULT_GRAPH=http://localhost:8890/DAV --net="host" -t tenforce/virtuoso
# Galaxy
docker pull bgruening/galaxy-stable
docker run -d -p 8080:80 bgruening/galaxy-stable
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
