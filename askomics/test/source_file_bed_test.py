import os
import unittest
# import json
import tempfile
# import shutil
import types

from shutil import copyfile
from pyramid import testing
from pyramid.paster import get_appsettings

from askomics.libaskomics.source_file.SourceFile import SourceFile
from askomics.libaskomics.source_file.SourceFileBed import SourceFileBed

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
        if not os.listdir(self.temp_directory):
            files = ['people.tsv', 'instruments.tsv', 'play_instrument.tsv', 'transcript.tsv', 'qtl.tsv', 'small_data.gff3', 'turtle_data.ttl', 'bed_example.bed']
            for file in files:
                src = os.path.join(os.path.dirname(__file__), "..", "test-data") + '/' + file
                dst = self.request.session['upload_directory'] + '/' + file
                copyfile(src, dst)

    def test_set_taxon(self):
        """Test the set_taxon method"""

        source_file_bed = SourceFileBed(self.settings, self.request.session, self.request.session['upload_directory'] + '/bed_example.bed', uri_set={0: None})
        source_file_bed.set_taxon('taxon_test')

        assert source_file_bed.taxon == 'taxon_test'

    def test_set_entity_name(self):
        """Test the set_entity_name method"""

        source_file_bed = SourceFileBed(self.settings, self.request.session, self.request.session['upload_directory'] + '/bed_example.bed', uri_set={0: None})
        source_file_bed.set_entity_name('entity_name_test')

        assert source_file_bed.entity == 'entity_name_test'

    def test_open_bed(self):
        """Test open_bed method"""

        source_file_bed = SourceFileBed(self.settings, self.request.session, self.request.session['upload_directory'] + '/bed_example.bed', uri_set={0: None})
        source_file_bed.open_bed()
        source_file_bed = SourceFileBed(self.settings, self.request.session, self.request.session['upload_directory'] + '/bad.bed', uri_set={0: None})
        try:
            source_file_bed.open_bed()
            assert False
        except Exception as e:
            assert True

    def test_get_turtle(self):
        """Test get_turtle method"""

        source_file_bed = SourceFileBed(self.settings, self.request.session, self.request.session['upload_directory'] + '/bed_example.bed', uri_set={0: None})
        # source_file_bed.taxon = 'test_taxon'
        turtle = source_file_bed.get_turtle()

        self.assertIsInstance(turtle, types.GeneratorType)
        for triple in turtle:
                pass

        source_file_bed = SourceFileBed(self.settings, self.request.session, self.request.session['upload_directory'] + '/bidon.bed', uri_set={0: None})
        try:
            turtle = source_file_bed.get_turtle()
            for triple in turtle:
                pass
            assert False
        except Exception as e:
            assert True

        source_file_bed = SourceFileBed(self.settings, self.request.session, self.request.session['upload_directory'] + '/bed_example.bed', uri_set={0: None})
        source_file_bed.set_taxon('taxon_test')
        turtle = source_file_bed.get_turtle()
        for triple in turtle:
                pass
        source_file_bed.set_entity_name('name')
        turtle = source_file_bed.get_turtle()
        for triple in turtle:
                pass


    def test_get_abstraction(self):
        """Test get_abstraction method"""

        source_file_bed = SourceFileBed(self.settings, self.request.session, self.request.session['upload_directory'] + '/bed_example.bed', uri_set={0: None})
        turtle1 = source_file_bed.get_turtle()
        for triple in turtle1:
                pass
        turtle2 = source_file_bed.get_abstraction()
        #header_ttl = self.get_turtle_template(abstraction_ttl+"\n"+domain_knowledge_ttl)

    def test_get_domain_knowledge(self):
        """Test get_domain_knowledge method"""

        source_file_bed = SourceFileBed(self.settings, self.request.session, self.request.session['upload_directory'] + '/bed_example.bed', uri_set={0: None})
        turtle1 = source_file_bed.get_turtle()
        for triple in turtle1:
                pass
        turtle = source_file_bed.get_domain_knowledge()
