import unittest
import os
import tempfile, shutil
import re
import time
import getpass

from pyramid import testing
from pyramid.paster import get_appsettings
from askomics.libaskomics.TripleStoreExplorer import TripleStoreExplorer
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.ask_view import AskView

import json
from interface_tps import InterfaceTPS

class AskViewTests(unittest.TestCase):

    def setUp( self ):
        self.settings = get_appsettings('configs/development.virtuoso.ini', name='main')
        self.request = testing.DummyRequest()

        self.config = testing.setUp(request=self.request)
        self.config.add_route('load_data_into_graph', '/load_data_into_graph')
        self.config.scan()

        self.request.session['upload_directory'] = os.path.join( os.path.dirname( __file__ ), "..", "test-data")
        self.temp_directory = tempfile.mkdtemp()

        self.it = InterfaceTPS(self.settings,self.request)

        self.askview = AskView(self.request)
        self.askview.settings = self.settings

        self.timestamp = str(time.time())


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

        ql = QueryLauncher(self.settings, self.request.session)

        queryResults = ql.insert_data(':sujet :predicat :objet .', 'test', 'prefix :<test>')
        server = queryResults.info()['server']
        self.request.json_body = {'namedGraphs': ['test']}

        self.askview.delete_graph()

        data = self.askview.statistics()

        assert data['ntriples'] == 267
        assert data['nclasses'] == '6'
        assert data['nentities'] == '19'
        assert data['ngraphs'] == '5'
        assert data['class'] == {
            'Personne': {'count': '7'},
            'Sexe': {'count': '2'},
            'Instrument': {'count': '2'}
        }

        for key in data['metadata'].keys():
            self.assertRegexpMatches(key, r'^urn:sparql:(instrument|enseigne|connait|joue|personne)\.tsv_[0-9]+\.[0-9]+$')
            for key2 in data['metadata'][key]:
                self.assertRegexpMatches(key2, r'^(version|username|filename|loadDate|server)$')
                if key2 == 'version':
                    assert data['metadata'][key][key2] == '1.3'
                elif key2 == 'username':
                    assert data['metadata'][key][key2] == getpass.getuser() 
                elif key2 == 'filename':
                    self.assertRegexpMatches(data['metadata'][key][key2], r'^(instrument|enseigne|connait|joue|personne)\.tsv$')
                elif key2 == 'loadDate':
                    self.assertRegexpMatches(data['metadata'][key][key2], r'^[0-9]+\.[0-9]+$')
                elif key2 == 'server':
                    assert data['metadata'][key][key2] == server

    def test_empty_database(self):
        self.it.empty()
        self.it.load_test2()
        self.askview.empty_database()

    def test_delete_graph(self):
        self.it.empty()
        self.it.load_test2()
        date = self.timestamp

        self.request.json_body = {
            'namedGraphs':
            [
                'urn:sparql:personne.tsv_'+ date,
                'urn:sparql:enseigne.tsv_'+ date,
                'urn:sparql:connait.tsv_'+ date,
                'urn:sparql:instrument.tsv_'+ date,
                'urn:sparql:joue.tsv_'+ date
            ]
        }
        self.askview.delete_graph()

    def test_get_list_named_graphs(self):
        self.it.empty()
        self.it.load_test2()
        namedGraphs = self.askview.get_list_named_graphs()
        date = self.timestamp
        resAttendu = [
            'urn:sparql:personne.tsv_'+ date,
            'urn:sparql:enseigne.tsv_'+ date,
            'urn:sparql:connait.tsv_'+ date,
            'urn:sparql:instrument.tsv_'+ date,
            'urn:sparql:joue.tsv_'+ date
        ]

        assert namedGraphs.sort() == resAttendu.sort()

    def test_source_files_overview(self):
        data = self.askview.source_files_overview()

    def test_preview_ttl(self):

        self.request.json_body = {
            'file_name':'personne.tsv',
            'col_types': ['entity_start', 'text', 'category', 'numeric', 'text'],
            'disabled_columns':[]
        }

        data = self.askview.preview_ttl()

    def test_check_existing_data(self):

        self.request.json_body = {
            'file_name':'personne.tsv',
            'col_types': ['entity_start', 'text', 'category', 'numeric', 'text'],
            'disabled_columns':[]
        }

        data = self.askview.check_existing_data();

        # catch error
        self.request.json_body = {
            'file_name':'personneeee.tsv',
            'col_types': {},
            'disabled_columns':1
        }

        data = self.askview.check_existing_data();

    def test_load_data_into_graph(self):

        self.request.json_body = {
            'file_name':'personne.tsv',
            'col_types': ['entity_start', 'text', 'category', 'numeric', 'text'],
            'disabled_columns':[]
        }

        data = self.askview.load_data_into_graph();

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

        # manage an error
        self.request.json_body = {
        }
        data = self.askview.get_value()

    def test_get_valuetxtquery(self):
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


        data = self.askview.getSparqlQueryInTextFormat()

        # manage an error
        self.request.json_body = {
        }
        data = self.askview.getSparqlQueryInTextFormat()
