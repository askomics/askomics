import os
import sys

from recommonmark.parser import CommonMarkParser

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'askomics'))

extensions = ['sphinx.ext.autodoc', 'sphinx.ext.napoleon']
master_doc = 'index'

# The suffix of source filenames.
source_suffix = ['.rst', '.md']

source_parsers = {
    '.md': CommonMarkParser,
}


def run_apidoc(_):
    from sphinx.apidoc import main
    parentFolder = os.path.join(os.path.dirname(__file__), '..')
    cur_dir = os.path.abspath(os.path.dirname(__file__))
    sys.path.append(parentFolder)

    module = os.path.join(parentFolder, 'askomics')
    output_path = os.path.join(cur_dir, 'api')
    main(['-e', '-f', '-o', output_path, module])


def setup(app):
    app.connect('builder-inited', run_apidoc)
