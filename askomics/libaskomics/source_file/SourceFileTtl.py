#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""
Classes to import data from a RDF source files
"""

import os
import shutil
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

    def __init__(self, settings, session, path, file_type='ttl'):

        newfile = path
        
        if not file_type == 'ttl':
            newfile = self.convert_to_ttl(path,file_type)

        SourceFile.__init__(self, settings, session, newfile)

        self.type = 'ttl'
        self.origine_type = file_type
        #overload name
        self.name =  os.path.basename(path)

    def get_preview_ttl(self):
        """
        Return the first 100 lines of a ttl file,
        text is formated with syntax color
        """

        head = ''

        with open(self.path, 'r', encoding="utf-8", errors="ignore") as fp:
            for x in range(1,100):
                head += fp.readline()

        ttl = textwrap.dedent("""
        {content}
        """).format(content=head)

        formatter = HtmlFormatter(cssclass='preview_field', nowrap=True, nobackground=True)
        return highlight(ttl, TurtleLexer(), formatter) # Formated html

    def persist(self, urlbase, public):
        """
        insert the ttl sourcefile in the TS

        """
        pathttl = self.get_rdf_user_directory()
        shutil.copy(self.path, pathttl)
        data = None

        method = 'load'
        if self.get_param("askomics.upload_user_data_method"):
            method = self.get_param("askomics.upload_user_data_method")

        if method == 'load':
            fil_open = open(pathttl + '/' + os.path.basename(self.path))
            data = self.load_data_from_file(fil_open, urlbase)

        else:
            chunk = self.file_get_contents(pathttl + '/' + os.path.basename(self.path))
            query_lauch = QueryLauncher(self.settings, self.session)
            data = query_lauch.insert_data(chunk, self.graph, '')

        self.insert_metadatas(public)
        return data

    @staticmethod
    def load_data_from_url(self, url,public):
        """
        insert the ttl sourcefile in the TS

        """

        data = {}

        ql = QueryLauncher(self.settings, self.session)
        try:
            queryResults = ql.load_data(url, self.graph)
        except Exception as e:
            self.log.error(self._format_exception(e))
            raise e
        finally:
            if self.settings["askomics.debug"]:
                data['url'] = url

        data["status"] = "ok"

        self.insert_metadatas(public)

        return data

    def file_get_contents(self, filename):
        """
        get the content of a file
        """
        with open(filename) as f:
            return f.read()#.splitlines()

    def convert_to_ttl(self,filepath,file_type):
        from rdflib import Graph
        newfilepath = filepath

        newfilepath = os.path.splitext(filepath)[0]+".ttl"
        g = Graph()
        if file_type == 'owl':
            g.parse(filepath)
        else:
            g.parse(filepath, format=file_type)
        #print(g.serialize(format='turtle'))
        g.serialize(destination=newfilepath, format='turtle')
        return newfilepath
