"""Contain the AskViewTests class"""

import unittest
import os
import tempfile
import datetime
import json
import humanize

from shutil import copyfile

from pyramid import testing
from pyramid.paster import get_appsettings
from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.TripleStoreExplorer import TripleStoreExplorer
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.EndpointManager import EndpointManager
from askomics.ask_view import AskView
from SetupTests import SetupTests


from interface_tps_db import InterfaceTpsDb

class AskViewTests(unittest.TestCase):
    """Test for Askview

    Contain all the tests for the askView class
    """

    def setUp(self):
        """Set up the configuration to access the triplestore

        Use the config file test.virtuoso.ini to not interfere with
        production data
        """

        self.settings = get_appsettings('configs/tests.ini', name='main')
        self.settings['askomics.upload_user_data_method'] = 'insert'

        self.request = testing.DummyRequest()

        self.config = testing.setUp(request=self.request)
        self.config.add_route('load_data_into_graph', '/load_data_into_graph')
        self.config.scan()

        self.request.session['user_id'] = 1
        self.request.session['username'] = 'jdoe'
        self.request.session['email'] = 'jdoe@example.com'
        self.request.session['admin'] = True
        self.request.session['blocked'] = False
        self.request.session['graph'] = 'urn:sparql:test_askomics:jdoe'

        self.request.host_url = 'http://localhost:6543'

        self.request.json_body = {}

        SetupTests(self.settings, self.request.session)

        self.tps = InterfaceTpsDb(self.settings, self.request)

        self.askview = AskView(self.request)
        self.askview.settings = self.settings


    def getKeyNode(self,node):
        return node['uri']

    def test_main(self):
        import askomics
        askomics.main(self.config)

    def test_start_points(self):
        """Test the start_points method

        Insert 2 datasets and test the start points
        """

        self.tps.clean_up()

        # load a test
        timestamp_people = self.tps.load_people()
        timestamp_instruments = self.tps.load_instruments()
        data = self.askview.start_points()
        # empty tps
        self.tps.clean_up()


        expected_result = {
            'nodes': {
                self.settings['askomics.prefix']+'Instruments':
                {
                    'uri':
                    self.settings['askomics.prefix']+'Instruments',
                    'g':
                    'urn:sparql:test_askomics:jdoe:instruments_tsv_' + timestamp_instruments,
                    'public': False,
                    'label': 'Instruments',
                    'private': True,
                    'endpoint': 'http://localhost:8890/sparql'
                },
                self.settings['askomics.prefix']+'People':
                {
                    'uri':
                    self.settings['askomics.prefix']+'People',
                    'g':
                    'urn:sparql:test_askomics:jdoe:people_tsv_' + timestamp_people,
                    'public': False,
                    'label': 'People',
                    'private': True,
                    'endpoint': 'http://localhost:8890/sparql'
                }
            },
            'galaxy': False
        }

        assert len(data["nodes"]) == 2
        # data["nodes"] = sorted(data["nodes"], key=self.getKeyNode)
        # expected_result["nodes"] = sorted(
            # expected_result["nodes"], key=self.getKeyNode)
        assert expected_result["nodes"] == data["nodes"]

    def test_statistics(self):

        # empty tps
        self.tps.clean_up()

        # load a test
        timestamp_people = self.tps.load_public_people()
        timestamp_instrument = self.tps.load_instruments()
        self.askview.statistics()

    def test_add_endpoint(self):

            # empty tps
            self.tps.clean_up()
            try:
                self.askview.add_endpoint()
                assert False
            except Exception as e:
                assert True
            self.request.json_body['name'] = 'testendp'
            try:
                self.askview.add_endpoint()
                assert False
            except Exception as e:
                assert True

            self.request.json_body['url'] = 'https://dbpedia.org/sparql'
            try:
                self.askview.add_endpoint()
                assert False
            except Exception as e:
                assert True

            self.request.json_body['auth'] = 'bidon'
            try:
                self.askview.add_endpoint()
                assert False
            except Exception as e:
                assert True

            self.request.json_body['auth'] = 'basic'
            try:
               self.askview.add_endpoint()
               assert True
            except Exception as e:
               assert False

    def test_zenable_endpoint(self):

            # empty tps
            self.tps.clean_up()
            self.request.json_body['name'] = 'testendp'
            self.request.json_body['url'] = 'https://dbpedia.org/sparql'
            self.request.json_body['auth'] = 'basic'

            try:
                self.askview.add_endpoint()
                assert True
            except Exception as e:
                assert False

            try:
                self.askview.enable_endpoints()
                assert False
            except Exception as e:
                assert True

            self.request.json_body['id'] = 1
            try:
                self.askview.enable_endpoints()
                assert False
            except Exception as e:
                assert True

            self.request.json_body['enable'] = True
            try:
                self.askview.enable_endpoints()
                assert True
            except Exception as e:
                assert False
            self.request.json_body['enable'] = False
            try:
                self.askview.enable_endpoints()
                assert True
            except Exception as e:
                assert False

            self.tps.clean_up()

    def test_zdelete_endpoint(self):

            # empty tps
            self.tps.clean_up()
            self.request.json_body['name'] = 'testendp'
            self.request.json_body['url'] = 'https://dbpedia.org/sparql'
            self.request.json_body['auth'] = 'basic'

            try:
                self.askview.add_endpoint()
                assert True
            except Exception as e:
                assert False

            try:
                self.askview.delete_endpoints()
                assert False
            except Exception as e:
                assert True

            self.request.json_body['endpoints'] = 'testendp'
            try:
                self.askview.delete_endpoints()
                assert True
            except Exception as e:
                print(e)
                assert False

    def test_list_endpoint(self):

            # empty tps
            self.tps.clean_up()
            self.request.json_body['name'] = 'testendp'
            self.request.json_body['url'] = 'https://dbpedia.org/sparql'
            self.request.json_body['auth'] = 'basic'

            try:
                self.askview.add_endpoint()
                assert True
            except Exception as e:
                assert False

            self.askview.list_endpoints()

    def test_guess_csv_header_type(self):

        self.tps.clean_up()
        try:
            self.askview.guess_csv_header_type()
            assert False
        except Exception as e:
            assert True
        self.request.json_body['filename'] = 'people.tsv'
        self.askview.guess_csv_header_type()

    def test_empty_database(self):
        """Test the empty_database method

        Insert data and test empty_database. Also test if
        start point return no results after deletion
        """

        # empty tps
        self.tps.clean_up()

        # load a test
        timestamp_people = self.tps.load_people()
        self.tps.load_instruments()

        data = self.askview.empty_database()

        assert data == {} # if success, return an empty dict

        # test if start point return no data
        askview2 = AskView(self.request)
        askview2.settings = self.settings
        data = askview2.start_points()

        assert data == {'nodes': {}, 'galaxy': False}


    def test_delete_graph(self):
        """Test delete_graph method

        Insert 2 datasets, and test delete_graph on one. Also test if
        start point return only one datasets
        """

        # empty tps
        self.tps.clean_up()

        # load a test
        timestamp_people = self.tps.load_people() # need the timestamp of people to delete it
        timestamp_instruments = self.tps.load_instruments()

        # Delete only the people graph
        self.request.json_body = {
            'named_graph': ['urn:sparql:test_askomics:jdoe:people_tsv_' + timestamp_people]
        }

        data = self.askview.delete_graph()

        assert data is None

        # test if start point return only one entity
        askview2 = AskView(self.request)
        askview2.settings = self.settings
        data = askview2.start_points()

        assert len(data["nodes"]) == 1

        # test if startpoint return only instruments
        expected_result = {
            'nodes': {
                self.settings['askomics.prefix']+'Instruments':
                {
                    'public': False,
                    'label': 'Instruments',
                    'uri':
                    self.settings['askomics.prefix']+'Instruments',
                    'private': True,
                    'g':
                    'urn:sparql:test_askomics:jdoe:instruments_tsv_' + timestamp_instruments,
                    'endpoint': 'http://localhost:8890/sparql'
                }
            },
            'galaxy': False
        }

        assert data == expected_result

    def test_get_list_user_graph(self):
        """Test get_list_private_graph method

        insert 1 dataset and one public dataset and check which is private
        """

        # empty tps
        self.tps.clean_up()

        # load a test
        timestamp_people = self.tps.load_public_people()
        timestamp_instrument = self.tps.load_instruments()
        #TODO: insert data for another user and test that the function don't return data of another user

        data = self.askview.list_user_graph()

        readable_date_people = datetime.datetime.strptime(timestamp_people, "%Y-%m-%dT%H:%M:%S.%f").strftime("%d/%m/%Y %H:%M:%S")
        readable_date_instrument = datetime.datetime.strptime(timestamp_instrument, "%Y-%m-%dT%H:%M:%S.%f").strftime("%d/%m/%Y %H:%M:%S")

        assert len(data) == 2
        assert isinstance(data, list)

        print("-- PRINT data --")
        print(data)
        print("--")

        assert {
            'g': 'urn:sparql:test_askomics:jdoe:people_tsv_' + timestamp_people,
            'count': '85',
            'access': 'public',
            'owner': 'jdoe',
            'date': timestamp_people,
            'readable_date': readable_date_people,
            'name': 'people.tsv',
            'access_bool': True,
            'endpoint': ''
        } in data

        assert {
            'g':
            'urn:sparql:test_askomics:jdoe:instruments_tsv_' + timestamp_instrument,
            'count': '76',
            'access': 'private',
            'owner': 'jdoe',
            'date': timestamp_instrument,
            'readable_date': readable_date_instrument,
            'name': 'instruments.tsv',
            'access_bool': False,
            'endpoint': ''
        } in data

    def test_source_files_overview(self):
        """Test source_files_overview method"""

        self.tps.clean_up()

        self.request.json_body = ['people.tsv', 'instruments.tsv']

        data = self.askview.source_files_overview()

        instrument = {'name': 'instruments.tsv',
         'type': 'tsv',
         'headers': ['Instruments', 'Name', 'Class'],
         'preview_data': [['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9'],
          ['Tubular_Bells',
           'Mandolin',
           'Electric_guitar',
           'Violin',
           'Acoustic_guitar',
           'Bass_guitar',
           'MiniMoog',
           'Laser_Harp',
           'Piano'],
          ['Percussion',
           'String',
           'String',
           'String',
           'String',
           'String',
           'Electro-analog',
           'Electro-analog',
           'String']],
         'column_types': ['entity_start', 'text', 'category']}

        people = {'name': 'people.tsv',
         'type': 'tsv',
         'headers': ['People', 'First_name', 'Last_name', 'Sex', 'Age'],
         'preview_data': [['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
          ['Mike', 'Jean-Michel', 'Roger', 'Matthew', 'Ellen', 'Richard'],
          ['Oldfield', 'Jarre', 'Waters', 'Bellamy', 'Fraatz', 'Melville'],
          ['M', 'M', 'M', 'M', 'F', 'M'],
          ['63', '68', '73', '38', '39', '51']],
         'column_types': ['entity_start', 'text', 'text', 'category', 'numeric']}

        assert set(data) == {'files', 'taxons'}
        assert data['taxons'] == []
        assert len(data['files']) == 2
        assert instrument in data['files']
        assert people in data['files']

        self.request.json_body = ['transcript.tsv']

        data = self.askview.source_files_overview()

        expected = {
            "files": [
                {
                    "name": "transcript.tsv",
                    "headers": [
                        "transcript",
                        "taxon",
                        "chromosomeName",
                        "start",
                        "end",
                        "strand",
                        "biotype"
                        ],
                    "column_types": [
                        "entity_start",
                        "taxon",
                        "ref",
                        "start",
                        "end",
                        "strand",
                        "category"
                        ],
                    "preview_data": [
                        [
                        "AT3G10490","AT3G13660","AT3G51470","AT3G10460","AT3G22640","AT1G33615","AT5G41905","AT1G57800","AT1G49500","AT5G35334"
                        ],
                        [
                        "Arabidopsis_thaliana","Arabidopsis_thaliana","Arabidopsis_thaliana","Arabidopsis_thaliana","Arabidopsis_thaliana","Arabidopsis_thaliana","Arabidopsis_thaliana","Arabidopsis_thaliana","Arabidopsis_thaliana","Arabidopsis_thaliana"
                        ],
                        [
                        "At3","At3","At3","At3","At3","At1","At5","At1","At1","At5"
                        ],
                        [
                        "3267835","4464908","19097787","3255800","8011724","12193325","16775524","21408623","18321295","13537917"
                        ],
                        [
                        "3270883","4465586","19099275","3256439","8013902","12194374","16775658","21412283","18322284","13538984"
                        ],
                        [
                        "plus",
                        "plus",
                        "minus",
                        "plus",
                        "minus",
                        "minus",
                        "minus",
                        "minus",
                        "minus",
                        "plus"
                        ],
                        [
                        "protein_coding",
                        "protein_coding",
                        "protein_coding",
                        "protein_coding",
                        "protein_coding",
                        "ncRNA",
                        "miRNA",
                        "protein_coding",
                        "protein_coding",
                        "transposable_element"
                        ]
                    ],
                    "type": "tsv"
                    }
                ],
                "taxons": []
            }

        assert data == expected

        self.request.json_body = ['bed_example.bed']
        data = self.askview.source_files_overview()

        self.request.json_body = ['turtle_data.ttl']
        data = self.askview.source_files_overview()

        self.request.json_body = ['small_data.gff3']
        data = self.askview.source_files_overview()

        self.request.json_body = ['wrong.gff']
        data = self.askview.source_files_overview()

    def test_prefix_uri(self):
        """Test prefix_uri method"""
        self.tps.clean_up()
        data = self.askview.prefix_uri()

    def test_load_remote_data_into_graph(self):
        """Test load_remote_data_into_graph method"""
        self.tps.clean_up()
        try:
            data = self.askview.load_remote_data_into_graph()
            assert False
        except Exception as e:
            assert True
        self.request.json_body['public'] = True
        try:
            data = self.askview.load_remote_data_into_graph()
            assert False
        except Exception as e:
            assert True
        self.request.json_body['public'] = False
        try:
            data = self.askview.load_remote_data_into_graph()
            assert False
        except Exception as e:
            assert True

        self.request.json_body['public'] = False
        self.request.json_body['url'] = 'bidonurl.ttl'
        try:
            data = self.askview.load_remote_data_into_graph()
            assert 'error' in data
        except Exception as e:
            assert True

        self.request.json_body['public'] = True
        self.request.session['admin'] = False
        try:
            data = self.askview.load_remote_data_into_graph()
            assert False
        except Exception as e:
            assert True

        self.request.session['admin'] = True
        self.request.json_body['public'] = False
        self.request.json_body['url'] = 'https://raw.githubusercontent.com/askomics/askomics/master/askomics/static/modules/dbpedia.ttl'
        try:
            data = self.askview.load_remote_data_into_graph()
            assert True
        except Exception as e:
            assert False

    def test_preview_ttl(self):
        """Test preview_ttl method"""
        self.tps.clean_up()

        self.request.json_body = {
            'file_name': 'people.tsv',
            'key_columns': [0],
            'col_types': [
                'entity_start', 'text', 'text', 'category', 'numeric'
            ],
            'disabled_columns': [],
            'uris': {'0': 'http://www.semanticweb.org/user/ontologies/2018/1#', '1': None, '2': None, '3': None, '4': None}
        }

        data = self.askview.preview_ttl()

    def test_check_existing_data(self):
        """Test check_existing_data"""

        #FIXME: I think this method is no longer used in askomics
        pass


    def test_load_data_into_graph(self):
        """Test load_data_into_graph method

        Load the file people.tsv and test the results
        """

        self.tps.clean_up()

        self.request.json_body = {
            'file_name': 'people.tsv',
            'key_columns': [0],
            'col_types': [
                'entity_start', 'text', 'text', 'category', 'numeric'
            ],
            'uris': {'0': 'http://www.semanticweb.org/user/ontologies/2018/1#', '1': None, '2': None, '3': None, '4': None},
            'disabled_columns': [],
            'public': False,
            'headers': ['People', 'First_name', 'Last_name', 'Sex', 'Age'],
            'method': 'noload'
        }

        data = self.askview.load_data_into_graph()


        assert data == {'total_triple_count': 6, 'status': 'ok', 'expected_lines_number': 6}


    def test_load_gff_into_graph(self):
        """Test load_gff_into_graph method

        Load the file small_data.gff3 and test the results
        """

        self.tps.clean_up()

        self.request.json_body = {
            'file_name': 'small_data.gff3',
            'taxon': 'Arabidopsis_thaliana',
            'entities': ['transcript', 'gene'],
            'public': False,
            'method': 'load'
        }

        data = self.askview.load_gff_into_graph()
        self.request.json_body['uri'] = 'Bad uri'
        data = self.askview.load_gff_into_graph()

        self.request.json_body['forced_type'] = 'bad'
        data = self.askview.load_gff_into_graph()

        try:
            self.request.json_body['public'] = True
            self.request.session['admin'] = False
            data = self.askview.load_gff_into_graph()
            assert False  # Expected exception
        except ValueError:
            assert True

        self.request.json_body['public'] = True
        self.request.session['admin'] = True
        data = self.askview.load_gff_into_graph()

        #The test can no be OK because no Askomics serveur is available and so the
        # command LOAD <http://localhost:6543/ttl/jdoe/tmp_small_data.gff3sebeuo2e.ttl> INTO GRAPH <urn:sparql:test_askomics:jdoe:small_data.gff3_2017-04-27T14:58:59.676364>
        # can no be work !
        #assert data == {'status': 'ok'}

    def test_load_ttl_into_graph(self):
        """Test load_ttl_into_graph method

        Load the file turtle_data.ttl and test the results
        """

        self.tps.clean_up()

        self.request.json_body = {
            'file_name': 'turtle_data.ttl',
            'public': False,
            'method': 'load'
        }

        self.askview.load_ttl_into_graph()

        self.request.json_body['forced_type'] = 'bad'
        self.askview.load_ttl_into_graph()

        try:
            self.request.json_body['public'] = True
            self.request.session['admin'] = False
            self.askview.load_ttl_into_graph()
            assert False  # Expected exception
        except ValueError:
            assert True

        # The load can't work because no http server is running and virtuoso can not find file to http://localhost:6543/file/xxxx.ttl
        self.request.json_body['public'] = True
        self.request.session['admin'] = True
        self.askview.load_ttl_into_graph()

    def test_load_bed_into_graph(self):
        """Test load_bed_into_graph method

        Load the file turtle_data.ttl and test the results
        """

        self.tps.clean_up()

        self.request.json_body = {
            'file_name': 'bed_example.bed',
            'taxon': 'Arabidopsis_thaliana',
            'entity_name': 'test',
            'public': False,
            'method': 'load'
        }

        self.askview.load_ttl_into_graph()

        self.request.json_body['uri'] = 'test'
        self.askview.load_bed_into_graph()

        self.request.json_body['forced_type'] = 'bad'
        self.askview.load_bed_into_graph()

        try:
            self.request.json_body['public'] = True
            self.request.session['admin'] = False
            self.askview.load_bed_into_graph()
            assert False  # Expected exception
        except ValueError:
            assert True

        # The load can't work because no http server is running and virtuoso can not find file to http://localhost:6543/file/xxxx.ttl
        self.request.json_body['public'] = True
        self.request.session['admin'] = True
        self.askview.load_bed_into_graph()

    def test_get_user_abstraction(self):
        """Test getUser_Abstraction"""

        self.tps.clean_up()

        # load a test
        self.tps.load_people()
        self.tps.load_instruments()

        self.request.json_body = {}

        data = self.askview.getUserAbstraction()
        print("-- data --")
        for k in data:
            print(k)
        print(" -- ")

        # FIXME hard to compare wih expected result cause there is a timestamp
        assert len(data) == 8
        assert 'categories' in data
        assert 'endpoints' in data
        assert 'endpoints_ext' in data
        assert 'attributes' in data
        assert 'entities' in data
        assert 'subclassof' in data
        assert 'relations' in data
        assert 'positionable' in data

    def test_importShortcut(self):
        """

        """
        # TODO:
        pass

    def test_deleteShortcut(self):
        """
        """
        # TODO:
        pass

    def test_get_value(self):
        """test get_value method

        Load a test and test get_value
        """
        self.tps.clean_up()

        # load a test
        timestamp_people = self.tps.load_people()

        self.request.json_body = {
            'type_endpoints'       : [ "askomics" ],
            'endpoints'            : [ "http://localhost:8890/sparql" ],
            'graphs'               : [ 'urn:sparql:test_askomics:jdoe:people_tsv_' + timestamp_people ],
            'limit': 30,
            'constraintesRelations': [[[[
                '?URIPeople1 rdf:type <'+self.settings['askomics.prefix']+'People>',
                '?URIPeople1 rdfs:label ?People1'
            ], '']], ''],
            'variates': { 'People1' : ['?People1'] },
            'removeGraph': []
        }

        data = self.askview.get_value()

        assert data == {
            'values': [{
                'People1': 'p1'
            }, {
                'People1': 'p2'
            }, {
                'People1': 'p3'
            }, {
                'People1': 'p4'
            }, {
                'People1': 'p5'
            }, {
                'People1': 'p6'
            }],
            'file': data['file'],
            'nrow': 6,
            'galaxy': False
        }

    def test_get_sparql_query_text(self):
        """Test get_sparql_query_in_text_format method"""

        self.tps.clean_up()

        # load a test
        timestamp_people = self.tps.load_people()

        self.request.json_body = {
            'type_endpoints'       : [ "askomics" ],
            'endpoints'            : [ "http://localhost:8890/sparql" ],
            'graphs'               : [ 'urn:sparql:test_askomics:jdoe:people_tsv_' + timestamp_people ],
            'export': False,
            'limit': 500,
            'constraintesRelations': [[[[
                '?URIPeople1 rdf:type <'+self.settings['askomics.prefix']+'People>',
                '?URIPeople1 rdfs:label ?People1'
            ], '']], ''],
            'variates': ['?People1']
        }

        data = self.askview.getSparqlQueryInTextFormat()

    def test_upload_ttl(self):
        """Test uploadTtl method"""

        #TODO:
        pass


    def test_upload_csv(self):
        """Test uploadCsv method"""

        #TODO:
        pass

    def test_delet_csv(self):
        """Test deletCsv method"""

        #TODO:
        pass

    def test_delete_uploaded_files(self):
        """Test load_gff_into_graph method

        Load the file turtle_data.ttl and test the results
        """

        self.tps.clean_up()
        self.askview.delete_uploaded_files()
        self.request.session['admin'] = True
        self.askview.delete_uploaded_files()

    def test_serverinformations(self):
        """Test load_gff_into_graph method

        Load the file turtle_data.ttl and test the results
        """

        self.tps.clean_up()
        self.askview.serverinformations()
        self.request.session['admin'] = True
        self.askview.serverinformations()

    def test_cleantmpdirectory(self):
        """Test load_gff_into_graph method

        Load the file turtle_data.ttl and test the results
        """

        self.tps.clean_up()
        self.askview.cleantmpdirectory()
        self.request.session['admin'] = True
        self.askview.cleantmpdirectory()

    def test_signup(self):
        """Test signup method"""

        self.tps.clean_up()

        self.request.json_body = {
            'username': 'jdoe',
            'email': 'jdoe@example.com',
            'password': 'iamjohndoe',
            'password2': 'iamjohndoe'
        }

        data = self.askview.signup()

        assert data == {'error': [], 'user_id': 1, 'username': 'jdoe', 'email': 'jdoe@example.com', 'admin': True, 'blocked': False, 'galaxy': None}

    def test_checkuser(self):
        """Test checkuser method"""

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        data = self.askview.checkuser()

        assert data == {'user_id': 1, 'username': 'jdoe', 'email': 'jdoe@example.com', 'admin': False, 'blocked': False, 'galaxy': None}


    def test_logout(self):
        """Test logout method"""

        self.tps.clean_up()

        self.askview.logout()

        assert self.request.session == {}


    def test_login(self):
        """Test login method"""

        self.tps.clean_up()

        #first, create a user
        self.request.json_body = {
            'username': 'jdoe',
            'email': 'jdoe@example.com',
            'password': 'iamjohndoe',
            'password2': 'iamjohndoe'
        }

        self.askview.signup()

        # then, logout this user
        self.askview.logout()

        # and then, test login
        self.request.json_body = {
            'username_email': 'jdoe',
            'password': 'iamjohndoe'
        }

        data = self.askview.login()

        assert data == {'error': [], 'user_id': 1, 'username': 'jdoe', 'email': 'jdoe@example.com', 'admin': True, 'blocked': False, 'galaxy': None}

    def test_login_api(self):
        """Test login_api method"""

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        self.request.GET['key'] = 'jdoe_apikey'

        data = self.askview.login_api()

        assert data == {'error': '', 'user_id': 1, 'username': 'jdoe', 'email': 'jdoe@example.com', 'admin': False, 'blocked': False, 'galaxy': None}

    def test_login_api_gie(self):
        """Test login_api_gie method"""

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        self.request.GET['key'] = 'jdoe_apikey'

        self.askview.login_api()

    def test_get_users_infos(self):
        """Test get_users_infos"""

        self.tps.clean_up()
        # first test with non admin
        try :
            data = self.askview.get_users_infos()
            assert False
        except Exception as e:
            assert True

        # then, is user is admin
        self.request.session['admin'] = True

        data = self.askview.get_users_infos()

        assert data == {'result': [], 'me': 'jdoe'} #result is empty cause there is no user

        #test with user
        self.request.json_body = {
            'username': 'jdoe',
            'email': 'jdoe@example.com',
            'password': 'iamjohndoe',
            'password2': 'iamjohndoe'
        }

        # get dir size
        pm = ParamManager(self.settings, self.request.session)
        dir_size = pm.get_size(pm.get_user_dir_path())
        human_dir_size = humanize.naturalsize(dir_size)

        self.askview.signup()

        data = self.askview.get_users_infos()

        assert data == {'result': [{'ldap': False, 'username': 'jdoe', 'email': 'jdoe@example.com', 'admin': True, 'blocked': False, 'gurl': None, 'nquery': 0, 'nintegration': 0, 'dirsize': dir_size, 'hdirsize': human_dir_size}], 'me': 'jdoe', 'error': [], 'user_id': 1, 'username': 'jdoe', 'email': 'jdoe@example.com', 'admin': True, 'blocked': False, 'galaxy': None}

    def test_lock_user(self):
        """Test lock_user method"""

        self.tps.clean_up()

        self.request.json_body = {
            'username': 'jdoe',
            'lock': True
        }

        # first test with non admin

        try:
            data = self.askview.lock_user()
            assert False
        except Exception as e:
            assert True

        # then, is user is admin
        self.request.session['admin'] = True

        data = self.askview.lock_user()

        assert data == 'success'


    def test_set_admin(self):
        """Test set_admin_method"""

        self.tps.clean_up()

        self.request.json_body = {
            'username': 'jdoe',
            'admin': True
        }

        try:
            data = self.askview.set_admin()
        except Exception as e:
            assert True

        # then, is user is admin
        self.request.session['admin'] = True

        data = self.askview.set_admin()

        assert data == 'success'

    def test_delete_user(self):
        """Test delete_user method"""

        self.tps.clean_up()

        # Insert a user
        self.request.json_body = {
            'username': 'jdoe',
            'email': 'jdoe@example.com',
            'password': 'iamjohndoe',
            'password2': 'iamjohndoe'
        }

        self.askview.signup()

        # test the deletion
        self.request.json_body = {
            'username': 'jdoe',
            'passwd': 'iamjohndoe',
            'passwd_conf': 'iamjohndoe'
        }

        self.request.session['blocked'] = False
        self.request.session['admin'] = False
        self.request.session['username'] = 'jdoe'

        data = self.askview.delete_user()

        assert data == 'success'


    def test_get_my_infos(self):
        """Test get_my_infos"""

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        # get my infos
        data = self.askview.get_my_infos()

        assert data == {'user_id': 1, 'username': 'jdoe', 'email': 'jdoe@example.com', 'admin': False, 'blocked': False, 'apikey': 'jdoe_apikey', 'galaxy': None, 'ldap': False}

    def test_update_mail(self):
        """Test update_mail"""

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        # And change my email
        self.request.json_body = {
            'username': 'jdoe',
            'email': 'mynewmail@example.com'
        }

        data = self.askview.update_mail()

        assert data == {'success': 'success'}

    def test_update_passwd(self):
        """Test update_passwd method"""

        self.tps.clean_up()

        # First, insert me
        self.request.json_body = {
            'username': 'jdoe',
            'email': 'jdoe@example.com',
            'password': 'iamjohndoe',
            'password2': 'iamjohndoe'
        }

        self.askview.signup()

        # And update my password
        self.request.json_body = {
            'username': 'jdoe',
            'current_passwd': 'iamjohndoe',
            'passwd': 'mynewpassword',
            'passwd2': 'mynewpassword',
        }

        data = self.askview.update_passwd()

        assert data == {'error': [], 'user_id': 1, 'username': 'jdoe', 'email': 'jdoe@example.com', 'admin': True, 'blocked': False, 'galaxy': None, 'success': 'success'}
