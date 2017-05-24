"""Contain the AskViewTests class"""

import unittest
import os
import tempfile
import datetime

from shutil import copyfile

from pyramid import testing
from pyramid.paster import get_appsettings
from askomics.libaskomics.TripleStoreExplorer import TripleStoreExplorer
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.ask_view import AskView


from interface_tps import InterfaceTPS

class AskViewTests(unittest.TestCase):
    """Test for Askview

    Contain all the tests for the askView class
    """

    def setUp(self):
        """Set up the configuration to access the triplestore

        Use the config file test.virtuoso.ini to not interfere with
        production data
        """

        self.settings = get_appsettings('configs/test.virtuoso.ini', name='main')
        self.request = testing.DummyRequest()

        self.config = testing.setUp(request=self.request)
        self.config.add_route('load_data_into_graph', '/load_data_into_graph')
        self.config.scan()

        self.request.session['username'] = 'jdoe'
        self.request.session['blocked'] = False
        self.request.session['group'] = 'base'
        self.request.session['graph'] = 'urn:sparql:test_askomics:jdoe'

        self.request.host_url = 'http://localhost:6543'

        # Create the tmp_file
        self.temp_directory = tempfile.mkdtemp(suffix='_tmp', prefix='__' + self.request.session['username'] + '__')
        # Set the upload dir
        self.request.session['upload_directory'] = self.temp_directory

        # copy the test files into the temp dir
        files = ['people.tsv', 'instruments.tsv', 'play_instrument.tsv', 'transcript.tsv', 'qtl.tsv', 'small_data.gff3', 'turtle_data.ttl']
        for file in files:
            src = os.path.join(os.path.dirname(__file__), "..", "test-data") + '/' + file
            dst = self.request.session['upload_directory'] + '/' + file
            copyfile(src, dst)

        self.tps = InterfaceTPS(self.settings, self.request)

        self.askview = AskView(self.request)
        self.askview.settings = self.settings

    def getKeyNode(self,node):
        return node['uri']

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
                'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Instruments':
                {
                    'uri':
                    'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Instruments',
                    'g':
                    'urn:sparql:test_askomics:jdoe:instruments.tsv_' + timestamp_instruments,
                    'public': False,
                    'label': 'Instruments',
                    'private': True
                },
                'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#People':
                {
                    'uri':
                    'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#People',
                    'g':
                    'urn:sparql:test_askomics:jdoe:people.tsv_' + timestamp_people,
                    'public': False,
                    'label': 'People',
                    'private': True
                }
            }
        }



        print(data)
        print(len(data["nodes"]))

        assert len(data["nodes"]) == 2
        # data["nodes"] = sorted(data["nodes"], key=self.getKeyNode)
        # expected_result["nodes"] = sorted(
            # expected_result["nodes"], key=self.getKeyNode)
        assert expected_result["nodes"] == data["nodes"]

    def test_statistics(self):

        #TODO: do the test when ofilangi has repaired the function.
        pass


    def test_empty_database(self):
        """Test the empty_database method

        Insert data and test empty_database. Also test if
        start point return no results after deletion
        """

        # empty tps
        self.tps.clean_up()

        # load a test
        self.tps.load_people()
        self.tps.load_instruments()

        data = self.askview.empty_database()

        assert data == {} # if success, return an empty dict

        # test if start point return no data
        askview2 = AskView(self.request)
        askview2.settings = self.settings
        data = askview2.start_points()

        assert data == {'nodes': {}}


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
            'named_graph': ['urn:sparql:test_askomics:jdoe:people.tsv_' + timestamp_people]
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
                'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Instruments':
                {
                    'public': False,
                    'label': 'Instruments',
                    'uri':
                    'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Instruments',
                    'private': True,
                    'g':
                    'urn:sparql:test_askomics:jdoe:instruments.tsv_' + timestamp_instruments
                }
            }
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

        readable_date_people = datetime.datetime.strptime(timestamp_people, "%Y-%m-%dT%H:%M:%S.%f").strftime("%y-%m-%d at %H:%M:%S")
        readable_date_instrument = datetime.datetime.strptime(timestamp_instrument, "%Y-%m-%dT%H:%M:%S.%f").strftime("%y-%m-%d at %H:%M:%S")

        assert len(data) == 2
        assert isinstance(data, list)

        assert {
            'g': 'urn:sparql:test_askomics:jdoe:people.tsv_' + timestamp_people,
            'count': '73',
            'access': 'public',
            'date': timestamp_people,
            'readable_date': readable_date_people,
            'name': 'people.tsv',
            'access_bool': True
        } in data

        assert {
            'g':
            'urn:sparql:test_askomics:jdoe:instruments.tsv_' + timestamp_instrument,
            'count': '66',
            'access': 'private',
            'date': timestamp_instrument,
            'readable_date': readable_date_instrument,
            'name': 'instruments.tsv',
            'access_bool': False
        } in data

    def test_source_files_overview(self):
        """Test source_files_overview method"""

        self.tps.clean_up()

        data = self.askview.source_files_overview()


    def test_preview_ttl(self):
        """Test preview_ttl method"""
        self.tps.clean_up()

        self.request.json_body = {
            'file_name': 'people.tsv',
            'key_columns': [0],
            'col_types': [
                'entity_start', 'text', 'text', 'category', 'numeric'
            ],
            'disabled_columns': []
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
            'disabled_columns': [],
            'public': False,
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
        #The test can no be OK because no Askomics serveur is available and so the 
        # command LOAD <http://localhost:6543/ttl/jdoe/tmp_small_data.gff3sebeuo2e.ttl> INTO GRAPH <urn:sparql:test_askomics:jdoe:small_data.gff3_2017-04-27T14:58:59.676364>
        # can no be work ! 
        #assert data == {'status': 'ok'}


    def test_load_ttl_into_graph(self):
        """Test load_gff_into_graph method

        Load the file turtle_data.ttl and test the results
        """

        self.tps.clean_up()

        self.request.json_body = {
            'file_name': 'turtle_data.ttl',
            'public': False,
            'method': 'load'
        }

        #The load can not be work because none server http run and virtuoso can not find file to http://localhost:6543/file/xxxx.ttl
        #data = self.askview.load_ttl_into_graph()
        
        #assert data == {'status': 'ok'}


    def test_get_user_abstraction(self):
        """Test getUser_Abstraction"""

        self.tps.clean_up()

        # load a test
        self.tps.load_people()
        self.tps.load_instruments()

        self.request.json_body = {}

        data = self.askview.getUserAbstraction()

        #FIXME hard to compare wih expected result cause there is a timestamp
        assert len(data) == 7

    def test_importShortcut(self):
        """

        """
        #TODO:
        pass

    def test_deleteShortcut(self):
        """
        """
        #TODO:
        pass

    def test_get_value(self):
        """test get_value method

        Load a test and test get_value
        """
        self.tps.clean_up()

        # load a test
        self.tps.load_people()

        self.request.json_body = {
            'limit': 30,
            'constraintesRelations': [[[[
                '?URIPeople1 rdf:type <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#People>',
                '?URIPeople1 rdfs:label ?People1'
            ], '']], ''],
            'variates': ['?People1'],
            'removeGraph': []
        }

        data = self.askview.get_value()

        print(data)
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
            'nrow': 6
        }

    def test_get_sparql_query_text(self):
        """Test get_sparql_query_in_text_format method"""

        self.tps.clean_up()

        # load a test
        self.tps.load_people()

        self.request.json_body = {
            'export': False,
            'limit': 500,
            'constraintesRelations': [[[[
                '?URIPeople1 rdf:type <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#People>',
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

        assert data == {'error': [], 'blocked': False, 'admin': True, 'username': 'jdoe'}

    def test_checkuser(self):
        """Test checkuser method"""

        self.tps.clean_up()

        data = self.askview.checkuser()

        assert data == {'admin': False, 'username': 'jdoe', 'blocked': False}


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

        assert data == {'blocked': False, 'admin': True, 'error': [], 'username': 'jdoe'}

    def test_get_users_infos(self):
        """Test get_users_infos"""

        self.tps.clean_up()

        data = self.askview.get_users_infos()

        # first test with non admin
        assert data == 'forbidden'

        # then, is user is admin
        self.request.session['admin'] = True

        data = self.askview.get_users_infos()

        assert data == {'result': []} #result is empty cause there is no user

        #test with user
        self.request.json_body = {
            'username': 'jdoe',
            'email': 'jdoe@example.com',
            'password': 'iamjohndoe',
            'password2': 'iamjohndoe'
        }

        self.askview.signup()

        data = self.askview.get_users_infos()

        assert data == {'result': [], 'error': [], 'admin': True, 'blocked': False, 'username': 'jdoe'}

    def test_lock_user(self):
        """Test lock_user method"""

        self.tps.clean_up()

        self.request.json_body = {
            'username': 'jdoe',
            'lock': True
        }

        data = self.askview.lock_user()

        # first test with non admin
        assert data == 'forbidden'

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

        data = self.askview.set_admin()

        # first test with non admin
        assert data == 'forbidden'

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

        data = self.askview.delete_user()

        assert data == 'success'


    def test_get_my_infos(self):
        """Test get_my_infos"""

        self.tps.clean_up()

        # First, insert me
        self.request.json_body = {
            'username': 'jdoe',
            'email': 'jdoe@example.com',
            'password': 'iamjohndoe',
            'password2': 'iamjohndoe'
        }

        self.askview.signup()

        # get my infos
        data = self.askview.get_my_infos()

        assert data == {'email': 'jdoe@example.com', 'username': 'jdoe', 'apikeys': [], 'blocked': False, 'admin': True}

    def test_update_mail(self):
        """Test update_mail"""

        self.tps.clean_up()

        # First, insert me
        self.request.json_body = {
            'username': 'jdoe',
            'email': 'jdoe@example.com',
            'password': 'iamjohndoe',
            'password2': 'iamjohndoe'
        }

        self.askview.signup()

        # And change my email
        self.request.json_body = {
            'username': 'jdoe',
            'email': 'mynewmail@example.com'
        }

        data = self.askview.update_mail()

        assert data == {'username': 'jdoe', 'error': [], 'success': 'success', 'blocked': False, 'admin': True}

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

        assert data == {'error': [], 'admin': True, 'blocked': False, 'username': 'jdoe', 'success': 'success'}
