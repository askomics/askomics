# Contributing

This document briefly describes how to contribute to AskOmics.
It is inspired by the [Galaxy project](https://github.com/galaxyproject/galaxy/).

## Before you Begin

If you have an idea for a feature to add or an approach for a bugfix,
it is best to communicate with developers early. The most
common venues for this are [GitHub issues](https://github.com/askomics/askomics/issues/).

## Reporting a new issue

If no existing issue seems appropriate, a new issue can be
opened using [this form](https://github.com/askomics/askomics/issues/new).

## How to Contribute

* All changes to the [askomics project](https://github.com/askomics/askomics)
  should be made through pull requests to this repository (with just two
  exceptions outlined below).

* If you are new to Git, the [Try Git](http://try.github.com/) tutorial is a good places to start.
  More learning resources are listed at https://help.github.com/articles/good-resources-for-learning-git-and-github/ .

* Make sure you have a free [GitHub](https://github.com/) account.

* Fork the [askomics repository](https://github.com/askomics/askomics) on
  GitHub to make your changes.
  To keep your copy up to date with respect to the main repository, you need to
  frequently [sync your fork](https://help.github.com/articles/syncing-a-fork/):
  ```
    $ git remote add upstream https://github.com/askomics/askomics
    $ git fetch upstream
    $ git checkout dev
    $ git merge upstream/dev
  ```

* Choose the correct branch to develop your changes against.

  * Additions of new features to the code base should be pushed to the `master` branch (`git
    checkout master`).

* If your changes modify code - please ensure the resulting files
  conform to AskOmics style
  guidelines (see below).

* Galaxy contains hundreds of tests of different types and complexity
  and running each is difficult and probably not reasonable at this
  time (someday we will provide a holistic test procedure to make this
  possible). For now, please just review the [running tests
  documentation](https://wiki.galaxyproject.org/Admin/RunningTests)
  and run any that seem relevant. Developers reviewing your pull
  request will be happy to help guide you to running the most relevant
  tests as part of the pull request review process and may request the
  output of these tests. You can run the continuous integration tests locally
  using `tox`, example: `tox -e py27-lint,py27-unit`.

* Commit and push your changes to your
  [fork](https://help.github.com/articles/pushing-to-a-remote/).

* Open a [pull
  request](https://help.github.com/articles/creating-a-pull-request/)
  with these changes. You pull request message ideally should include:

   * A description of why the changes should be made.

   * A description of the implementation of the changes.

   * A description of how to test the changes.

* The pull request should pass all the continuous integration tests which are
  automatically run by GitHub using e.g. Travis CI.

* Your pull request will be handled according to
  some rules, not yet frozen, but will be inspired by
  [Galaxy rules](https://github.com/galaxyproject/galaxy/blob/dev/doc/source/project/organization.rst#handling-pull-requests).

## Coding style guidelines

General

    Ensure all user-enterable strings are unicode capable
    Use only English language for everything (code, documentation, logs, comments, ...)

Python Standards

    We follow PEP-8, with particular emphasis on the parts about knowing when to be inconsistent, and readability being the ultimate goal.
    One exception to PEP-8 in Askomics Python code is whitespace usage. Whitespace around operators and inside parentheses is generally included, particularly if it helps readability. If the thing inside the parentheses is short (a single word) often spaces are extraneous; if it is a complex expression, spacing helps to delineate different parts.
    4 spaces per indent
    Use spaces, not tabs for indenting.
    Comments and documentation comments should follow the 79 character rule
    One other common divergence from PEP-8 is line length. Logical (non-comment) lines should be formatted for readability, recognizing the existence of wide screens and scrollbars (sometimes a 200 character line is more readable, though rarely).

    Python docstrings need to be reStructured Text (RST) and Sphinx markup compatible. See Develop/SourceDoc for more.

    Avoid from module import *. It can cause name collisions that are tedious to track down.

JavaScript Standards

    Follow JSHint whenever possible, deviating for readability.
    Use semicolons to terminate statements.
    Put delimiters that open blocks on the current line; put delimiters that close blocks on their own line. E.g.

            if (condition) {
                do_action();
            }

    camelCasePlease and capitalize ClassNames
    variables with jQuery objects should start with '$'

    JSDoc-style commenting http://en.wikipedia.org/wiki/JSDoc
