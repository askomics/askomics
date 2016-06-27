import os
import unittest
import json
import tempfile, shutil

from pyramid import testing
from pyramid.paster import get_appsettings

from askomics.libaskomics.source_file.SourceFile import SourceFile

SIMPLE_SOURCE_FILE = os.path.join( os.path.dirname( __file__ ), "..", "test-data", "sourcefile.tsv.simple" )

class SourceFileTests(unittest.TestCase):

    def setUp( self ):
        self.temp_directory = tempfile.mkdtemp()
        self.settings = get_appsettings('configs/development.ini', name='main')

        request = testing.DummyRequest()

        self.srcfile = SourceFile(self.settings, request.session, SIMPLE_SOURCE_FILE, 10)

    def tearDown( self ):
        shutil.rmtree( self.temp_directory )

    def test_load_headers_from_file(self):

        assert self.srcfile.headers == ['head1', 'head2', 'head3','head4']

    def test_load_preview_from_file(self):

        c1 = ['val1.1', 'val1.2', 'val1.3', 'val1.4', 'val1.5', 'val1.6', 'val1.7', 'val1.8', 'val1.9', 'val1.10']
        c2 = ['val2.1', 'val2.2', 'val2.3', 'val2.4', 'val2.5', 'val2.6', 'val2.7', 'val2.8', 'val2.9', 'val2.10']
        c3 = ['val3.1', 'val3.2', 'val3.3', 'val3.4', 'val3.5', 'val3.6', 'val3.7', 'val3.8', 'val3.9', 'val3.10']
        c4 = ['val4.1', 'val4.2', 'val4.3', 'val4.4', 'val4.5', 'val4.6', 'val4.7', 'val4.8', 'val4.9', 'val4.10']
        assert self.srcfile.get_preview_data() == [c1,c2,c3,c4]

    def test_set_forced_column_types(self):
        self.srcfile.set_forced_column_types(['entity','numeric','text','category'])

    def test_set_disabled_columns(self):
        self.srcfile.set_disabled_columns([0,4])

    def test_is_decimal(self):

        assert not self.srcfile.is_decimal('test')
        assert not self.srcfile.is_decimal('33a4254')
        assert self.srcfile.is_decimal('23')
        assert self.srcfile.is_decimal('23.3095')
        assert not self.srcfile.is_decimal('23,3095')
        assert self.srcfile.is_decimal('.0495')
        assert not self.srcfile.is_decimal('')

    def test_guess_column_type(self):

        assert self.srcfile.guess_values_type(['453', '334254', '342', '335'],1) == 'numeric'
        assert self.srcfile.guess_values_type(['45.3', '334.254', '342', '335'],1) == 'numeric'
        assert self.srcfile.guess_values_type(['453', '33a4254', '342', '335'],1) == 'text'
        assert self.srcfile.guess_values_type(['453', '453', '453', '453'],1) == 'category'
        assert self.srcfile.guess_values_type(['453', 'ccc', 'bbb', 'aaa'],1) == 'text'

    def test_guess_column_types(self):

        assert self.srcfile.guess_column_types([['453', '334254', '342', '335'], ['453', '453', '453', '453'], ['453', 'ccc', 'bbb', 'aaa'], ['453', '334254', '342', '335']]) == ['numeric', 'category', 'text', 'numeric']

    def test_get_abstraction(self):
        assert self.srcfile.get_abstraction()
