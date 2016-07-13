import unittest
import os
import tempfile, shutil
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

        date = time.strftime('%Y-%m-%d',time.localtime())
        loadDate = date + "T00:00:00"

        ql = QueryLauncher(self.settings, self.request.session)
        sqb = SparqlQueryBuilder(self.settings, self.request.session)

        queryResults = ql.insert_data(':sujet :predicat :objet .', 'test', 'prefix :<test>')
        server = queryResults.info()['server']
        self.request.json_body = {'namedGraphs': ['test'] }

        self.askview.delete_graph()

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
             'ntriples': 189,
             'nentities': '19',
             'ngraphs': '5',
             'metadata': {
                'urn:sparql:enseigne.tsv:'+ date: {'loadDate': loadDate, 'username': getpass.getuser(), 'version': '2.0', 'filename': 'enseigne.tsv', 'server': server},
                'urn:sparql:connait.tsv:'+ date: {'loadDate': loadDate, 'username': getpass.getuser(), 'version': '2.0', 'filename': 'connait.tsv', 'server': server},
                'urn:sparql:joue.tsv:'+ date: {'loadDate': loadDate, 'username': getpass.getuser(), 'version': '2.0', 'filename': 'joue.tsv', 'server': server},
                'urn:sparql:instrument.tsv:'+ date: {'loadDate': loadDate, 'username': getpass.getuser(), 'version': '2.0', 'filename': 'instrument.tsv', 'server': server},
                'urn:sparql:personne.tsv:'+ date: {'loadDate': loadDate, 'username': getpass.getuser(), 'version': '2.0', 'filename': 'personne.tsv', 'server': server}
                },
            }
        # there is an error during string comparison, but there is no error during int comparison
        for key, value in data.items():
            if type(value) == dict and resAttendu[key] == dict:
                for key1, value1 in data[key].items():
                    if type(value1) == dict and resAttendu[key] == dict:
                        for key2, value2 in resAttendu[key][key1].items():
                            assert data[key][key1][key2] == resAttendu[key][key1][key2]
                    else:
                        assert data[key][key1] == resAttendu[key][key1]
            elif type(value) == int:
                assert data[key] == resAttendu[key]
            elif type(value) == str and resAttendu[key] == str:
                assert value == resAttendu[key]

    def test_empty_database(self):
        self.it.empty()
        self.it.load_test2()
        self.askview.empty_database()

    def test_delete_graph(self):
        self.it.empty()
        self.it.load_test2()
        date = time.strftime('%Y-%m-%d',time.localtime())

        self.request.json_body = {
        'namedGraphs':
        ['urn:sparql:personne.tsv:'+ date,
        'urn:sparql:enseigne.tsv:'+ date,
        'urn:sparql:connait.tsv:'+ date,
        'urn:sparql:instrument.tsv:'+ date,
        'urn:sparql:joue.tsv:'+ date]
        }
        self.askview.delete_graph()

    def test_get_list_named_graphs(self):
        self.it.empty()
        self.it.load_test2()
        namedGraphs = self.askview.get_list_named_graphs()

        date = time.strftime('%Y-%m-%d',time.localtime())
        resAttendu = ['urn:sparql:personne.tsv:'+ date,
            'urn:sparql:enseigne.tsv:'+ date,
            'urn:sparql:connait.tsv:'+ date,
            'urn:sparql:instrument.tsv:'+ date,
            'urn:sparql:joue.tsv:'+ date]

        assert namedGraphs.sort() == resAttendu.sort()

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

    def test_load_data_into_graph(self):
        self.request.json_body = {
            'file_name':'personne.tsv',
            'col_types': ['entity_start', 'text','category','numeric','text'],
            'disabled_columns':[]
        }

        #data = self.askview.load_data_into_graph();
