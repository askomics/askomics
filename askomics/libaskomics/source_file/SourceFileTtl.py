#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""
Classes to import data from a gff3 source files
"""

import os, shutil
import textwrap
from pygments import highlight
from pygments.lexers import TurtleLexer
from pygments.formatters import HtmlFormatter

from askomics.libaskomics.source_file.SourceFile import SourceFile
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher

class SourceFileTtl(SourceFile):
    """
    Class representing a ttl Source file
    """

    def __init__(self, settings, session, path):

        SourceFile.__init__(self, settings, session, path)

        self.type = 'ttl'

    def get_preview_ttl(self):
        """
        Return the first 100 lines of a ttl file,
        text is formated with syntax color
        """

        head = ''

        with open(self.path, 'r') as fp:
            for x in range(1,100):
                head += fp.readline()

        ttl = textwrap.dedent("""
        {content}
        """).format(content=head)

        formatter = HtmlFormatter(cssclass='preview_field', nowrap=True, nobackground=True)
        return highlight(ttl, TurtleLexer(), formatter) # Formated html

    def persist(self, urlbase, public, method):
        import glob
        """
        insert the ttl sourcefile in the TS

        """
        pathttl = self.getRdfDirectory()
        shutil.copy(self.path, pathttl)
        data = None;

        if method == 'load':
            fil_open = open(pathttl + '/' + os.path.basename(self.path))
            data = self.load_data_from_file(fil_open, urlbase)

        else:
            chunk = self.file_get_contents(pathttl + '/' + os.path.basename(self.path))
            query_lauch = QueryLauncher(self.settings, self.session)
            data = query_lauch.insert_data(chunk, self.graph, '')

        self.insert_metadatas(public)
        return data
        
    def file_get_contents(self, filename):
        """
        get the content of a file
        """
        with open(filename) as f:
            return f.read()#.splitlines()
