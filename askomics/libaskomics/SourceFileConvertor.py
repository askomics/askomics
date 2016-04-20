from glob import glob
import logging
import os.path
import re

from askomics.libaskomics.integration.SourceFile import SourceFile
from askomics.libaskomics.integration.AbstractedEntity import AbstractedEntity
from askomics.libaskomics.integration.AbstractedRelation import AbstractedRelation
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.source_file.SourceFile import SourceFile

class SourceFileConvertor(ParamManager):
    """
    A SourceFileConvertor instance provides methods to:
        - display an overview of the tabulated files the user want to convert in AskOmics.
        - convert the tabulated files in turtle files, taking care of:
            * the format of the data already in the database
              (detection of new and missing headers in the user files).
            * the abstraction generation corresponding to the header of the user files.
            * the generation of the part of the domain code that wan be automatically generated.
    """

    def __init__(self, settings, session):

        ParamManager.__init__(self, settings, session)
        self.log = logging.getLogger(__name__)

    def get_source_files(self, limit):
        """
        :return: List of the file to convert paths
        :rtype: List
        """
        src_dir = self.get_source_file_directory()
        paths = glob(src_dir + '/*')

        files = []
        for p in paths:
            files.append(SourceFile(p, limit))

        return files

    def get_source_file(self, name):
        """
        Return an object representing a source file

        :param name: The name of the source file to return
        :return: List of the file to convert paths
        :rtype: SourceFile
        """
        # As the name can be different than the on-disk filename (extension are removed), we loop on all SourceFile objects
        files = self.get_source_files()

        for f in files:
            if f.name == name:
                return f

        return None
