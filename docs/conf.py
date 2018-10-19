import os
import sys


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
