import os
import unittest
# import json
import tempfile
# import shutil
import types
import shutil

from shutil import copyfile,rmtree

from pyramid import testing
from pyramid.paster import get_appsettings

from askomics.libaskomics.source_file.SourceFile import SourceFile
from askomics.libaskomics.source_file.SourceFileGff import SourceFileGff

class SourceFileBedTests(unittest.TestCase):


    def setUp(self):
        """Set up the settings and the session"""

        self.settings = get_appsettings('configs/tests.ini', name='main')
        self.settings['askomics.upload_user_data_method'] = 'insert'
        self.request = testing.DummyRequest()
        self.request.session['username'] = 'jdoe'
        self.request.session['group'] = 'base'
        self.request.session['admin'] = False
        self.request.session['blocked'] = True

        # Files
        # Create the user dir if not exist
        self.temp_directory = self.settings['askomics.files_dir'] + '/upload/' + self.request.session['username']
        if not os.path.isdir(self.temp_directory):
            os.makedirs(self.temp_directory)
        # Set the upload dir
        self.request.session['upload_directory'] = self.temp_directory
        # Copy files if directory is empty
        
        files = ['small_data.gff3', 'test_TAIR_100.gff']
        for file in files:
            src = os.path.join(os.path.dirname(__file__), "..", "test-data") + '/' + file
            dst = self.request.session['upload_directory'] + '/' + file
            copyfile(src, dst)

    def test_set_taxon(self):
        """Test the set_taxon method"""

        source_file = SourceFileGff(self.settings, self.request.session, self.request.session['upload_directory'] + '/small_data.gff3')
        source_file.set_taxon('taxon_test')

        assert source_file.taxon == 'taxon_test'

    def test_set_entities(self):
        """Test the set_entity_name method"""

        source_file = SourceFileGff(self.settings, self.request.session, self.request.session['upload_directory'] + '/small_data.gff3')
        source_file.set_entities(['gene','transcript','exon'])

        assert source_file.entities == ['gene', 'transcript', 'exon']

    def test_get_entities(self):
        source_file = SourceFileGff(self.settings, self.request.session, self.request.session['upload_directory'] + '/small_data.gff3')
        l = source_file.get_entities()

        assert sorted(l) == sorted(['three_prime_UTR', 'gene', 'exon', 'five_prime_UTR', 'transcript', 'CDS'])

    def test_get_turtle(self):
        """Test get_turtle method"""

        source_file = SourceFileGff(self.settings, self.request.session, self.request.session['upload_directory'] + '/test_TAIR_100.gff')
        source_file.set_entities(['three_prime_UTR', 'gene', 'exon', 'five_prime_UTR', 'transcript', 'CDS'])
        # source_file_bed.taxon = 'test_taxon'
        turtle = source_file.get_turtle()

        self.assertIsInstance(turtle, types.GeneratorType)
        for triple in turtle:
            pass
        #assert False
        source_file = SourceFileGff(self.settings, self.request.session, self.request.session['upload_directory'] + '/bidon.gff3')
        try:
            turtle = source_file.get_turtle()
            for triple in turtle:
                pass
            assert False
        except Exception as e:
            assert True

        source_file = SourceFileGff(self.settings, self.request.session, self.request.session['upload_directory'] + '/small_data.gff3')
        source_file.set_taxon('taxon_test')
        turtle = source_file.get_turtle()
        for triple in turtle:
                pass

    def test_get_abstraction(self):
        """Test get_turtle method"""

        source_file = SourceFileGff(self.settings, self.request.session, self.request.session['upload_directory'] + '/small_data.gff3')
        source_file.set_entities(['three_prime_UTR', 'gene', 'exon', 'five_prime_UTR', 'transcript', 'CDS'])
        # source_file_bed.taxon = 'test_taxon'
        turtle = source_file.get_turtle()

        for triple in turtle:
            pass
        abst = source_file.get_abstraction()

    def test_get_domain_knowledge(self):
        """Test get_turtle method"""

        source_file = SourceFileGff(self.settings, self.request.session, self.request.session['upload_directory'] + '/small_data.gff3')
        source_file.set_entities(['three_prime_UTR', 'gene', 'exon', 'five_prime_UTR', 'transcript', 'CDS'])
        # source_file_bed.taxon = 'test_taxon'
        turtle = source_file.get_turtle()

        for triple in turtle:
            pass
        abst = source_file.get_domain_knowledge()
