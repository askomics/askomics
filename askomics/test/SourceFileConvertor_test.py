import unittest
import os
import re
import tempfile, shutil

from pyramid import testing
from pyramid.paster import get_appsettings
from askomics.libaskomics.SourceFileConvertor import SourceFileConvertor

class tripleStoreExplorerTests(unittest.TestCase):
    def setUp( self ):
        self.settings = get_appsettings('configs/development.virtuoso.ini', name='main')
        self.request = testing.DummyRequest()

        self.request.session['upload_directory'] = os.path.join( os.path.dirname( __file__ ), "..", "test-data")
        self.temp_directory = tempfile.mkdtemp()

    def tearDown( self ):
        shutil.rmtree( self.temp_directory )

    def test_load_data(self):
        col_types = ['entity-start','text','category','numeric','text']
        disabled_columns = []

        sfc = SourceFileConvertor(self.settings, self.request.session)

        src_file = sfc.get_source_file("personne.tsv")
        src_file.set_forced_column_types(col_types)
        src_file.set_disabled_columns(disabled_columns)
        data = src_file.persist('','noload')
