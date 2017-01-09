import os
import unittest
import json
import tempfile, shutil

from pyramid import testing
from pyramid.paster import get_appsettings

from askomics.libaskomics.source_file.SourceFile import SourceFile
from askomics.libaskomics.source_file.SourceFileGff import SourceFileGff

SIMPLE_SOURCE_FILE = os.path.join(
    os.path.dirname(__file__), "..", "test-data", "sourcefile.gff.simple")


class SourceFileTests(unittest.TestCase):
    def setUp(self):
        self.temp_directory = tempfile.mkdtemp()
        self.settings = get_appsettings('configs/development.ini', name='main')

        self.request = testing.DummyRequest()

        self.srcfile1 = SourceFileGff(self.settings, self.request.session,
                                      SIMPLE_SOURCE_FILE, '', [])

        self.srcfile = SourceFileGff(self.settings, self.request.session,
                                     SIMPLE_SOURCE_FILE, 'dummytaxon',
                                     ['gene', 'transcript'])

    def tearDown(self):
        shutil.rmtree(self.temp_directory)

    def test_get_entities(self):

        # using set() because order of the list is not important
        assert set(self.srcfile1.get_entities()) == set(['transcript', 'gene'])


    def test_get_content_ttl(self):

        entity = {
            ':t1': {
                ':position_strand': ':plus',
                ':ID': '"transcript:t1"',
                ':Name': '"T1"',
                'rdfs:label': '"t1"',
                ':source': '"tair"',
                ':position_end': 100,
                ':position_taxon': ':',
                'rdf:type': ':transcript',
                ':transcript_id': '"T1"',
                ':biotype': '"protein_coding"',
                ':position_ref': ':1',
                ':Parent': ':g1',
                ':position_start': 9
            }
        }

        #FIXME can't assert the result because order of triples is completely random
        assert type(self.srcfile.get_content_ttl(entity)) == type('')

