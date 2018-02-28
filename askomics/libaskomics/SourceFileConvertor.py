from glob import glob
import logging
import os.path

from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.source_file.SourceFileGff import SourceFileGff
from askomics.libaskomics.source_file.SourceFileTsv import SourceFileTsv
from askomics.libaskomics.source_file.SourceFileTtl import SourceFileTtl
from askomics.libaskomics.source_file.SourceFileBed import SourceFileBed

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

    def get_source_files(self, selectedFiles, forced_type=None, uri_set=None):
        """Get all source files


        :returns: a list of source file
        :rtype: list
        """

        src_dir = self.get_upload_directory()
        paths = glob(src_dir + '/*')

        files = []

        for path in paths:
            (filepath, filename) = os.path.split(path)

            if filename not in selectedFiles:
                continue
            try:
                file_type = self.guess_file_type(path)
                if file_type == 'gff' or forced_type == 'gff':
                    files.append(SourceFileGff(self.settings, self.session, path, uri_set=uri_set))
                elif file_type == 'ttl' or forced_type == 'ttl':
                    files.append(SourceFileTtl(self.settings, self.session, path))
                elif file_type == 'bed' or forced_type == 'bed':
                    files.append(SourceFileBed(self.settings, self.session, path, uri_set=uri_set))
                elif file_type == 'csv' or forced_type == 'csv':
                    files.append(SourceFileTsv(self.settings, self.session, path, int(self.settings["askomics.overview_lines_limit"]), uri_set=uri_set))
            except Exception as inst:
                raise Exception(str(inst)+" file:"+filename)

        return files

    @staticmethod
    def guess_file_type(filepath):
        """Guess the file type in function of their extention

        :param filepath: path of file
        :type filepath: string
        :returns: file type
        :rtype: string
        """
        extension = os.path.splitext(filepath)[1]
        if extension.lower() in ('.gff', '.gff2', '.gff3'):
            return 'gff'
        if extension.lower() in ('.ttl', '.rdf'):
            return 'ttl'
        if extension.lower() in ('.bed', ):
            return 'bed'

        return 'csv'
