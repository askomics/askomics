import unittest
import os
import tempfile, shutil

from pyramid import testing
from pyramid.paster import get_appsettings
from askomics.libaskomics.TripleStoreExplorer import TripleStoreExplorer
from askomics.ask_view import AskView

import json
from interface_tps import InterfaceTPS

class AskViewTests(unittest.TestCase):
    def setUp( self ):
        self.settings = get_appsettings('configs/development.virtuoso.ini', name='main')
        self.request = testing.DummyRequest()
        self.request.session['upload_directory'] = os.path.join( os.path.dirname( __file__ ), "..", "test-data")
        self.temp_directory = tempfile.mkdtemp()

        self.it = InterfaceTPS(self.settings,self.request)

        self.askview = AskView(self.request)
        self.askview.settings = self.settings


    def tearDown( self ):
        shutil.rmtree( self.temp_directory )

    def test_start_points(self):

        #load files
        self.it.empty()
        self.it.load_test2()

        data = self.askview.start_points()

        resAttendu = {
            'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Personne': {'label': 'Personne', 'uri': 'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Personne'},
            'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Instrument': {'label': 'Instrument', 'uri': 'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Instrument'}
        }

        for elt in data["nodes"]:
            assert data["nodes"][elt] == resAttendu[elt]

        assert len(data["nodes"]) == 2

    def test_statistics(self):

        #load files
        self.it.empty()
        self.it.load_test2()

        data = self.askview.statistics()
        resAttendu = {
            'nclasses': '6',
            'class': {
                'owl:ObjectProperty': {'count': '4'},
                'owl:DatatypeProperty': {'count': '3'},
                'Personne': {'count': '7'},
                'owl:Class': {'count': '2'},
                'Instrument': {'count': '2'},
                'Sexe': {'count': '2'}
             },
             'ntriples': '119',
             'nentities': '19'
        }
        assert data == resAttendu

    def test_empty_database(self):
        self.askview.empty_database()

    def test_source_files_overview(self):
        data = self.askview.source_files_overview()

    def test_preview_ttl(self):

        self.request.json_body = {
            'file_name':'personne.tsv',
            'col_types': ['entity_start', 'text','category','numeric','text'],
            'disabled_columns':[]
        }

        data = self.askview.preview_ttl()

    def test_check_existing_data(self):

        self.request.json_body = {
            'file_name':'personne.tsv',
            'col_types': ['entity_start', 'text','category','numeric','text'],
            'disabled_columns':[]
        }

        data = self.askview.check_existing_data();

    def test_getUserAbstraction(self):
        #load files
        self.it.empty()
        self.it.load_test1()

        data = self.askview.getUserAbstraction();

    def test_get_value(self):
        #load files
        self.it.empty()
        self.it.load_test1()

        self.request.json_body = {
            'variates':['?Personne1'],
            'constraintesRelations': [['?URIPersonne1', 'rdf:type', '<http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Personne>'], ['?URIPersonne1', 'rdfs:label', '?Personne1']],
            'constraintesFilters': [],
            'limit': 30,
            'export': False,
        }


        data = self.askview.get_value()

        self.request.json_body['export'] = True
        data = self.askview.get_value()
