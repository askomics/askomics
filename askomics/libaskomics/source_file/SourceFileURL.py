#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""
Classes to import data from an URL
"""

import os
import shutil
import textwrap
from pygments import highlight
from pygments.lexers import TurtleLexer
from pygments.formatters import HtmlFormatter

from askomics.libaskomics.source_file.SourceFile import SourceFile
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher

class SourceFileURL(SourceFile):
    """
    Class representing a ttl Source file
    """

    def __init__(self, settings, session, url):

        SourceFile.__init__(self, settings, session, url)

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
