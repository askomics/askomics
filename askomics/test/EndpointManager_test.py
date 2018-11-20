"""contain EndpointManager Class"""

import unittest
import os.path

from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.EndpointManager import EndpointManager
from interface_tps_db import InterfaceTpsDb
from SetupTests import SetupTests

class EndpointManagerTests(unittest.TestCase):
    """Test for the ModuleManager class"""

    def setUp(self):
        """Set up the settings and session"""

        self.settings = get_appsettings('configs/tests.ini', name='main')
        self.request = testing.DummyRequest()
        self.request.session['username'] = 'jdoe'
        self.request.session['group'] = 'base'
        self.request.session['admin'] = False
        self.request.session['blocked'] = False
        self.request.session['graph'] = "test/nosetest/jdoe"

        SetupTests(self.settings, self.request.session)
        self.tps = InterfaceTpsDb(self.settings, self.request)

    def test_save_endpoint(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        endpoint_manager = EndpointManager(self.settings, self.request.session)
        assert endpoint_manager.save_endpoint('endpoint1', 'http://endpoint./sparql') == 1

    def test_enable(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        endpoint_manager = EndpointManager(self.settings, self.request.session)
        endpoint_manager.enable(endpoint_manager.save_endpoint('endpoint1', 'http://endpoint/sparql'))

        assert self.tps.test_row_presence('endpoints', 'id, name, url, auth, enable, message', (1, 'endpoint1', 'http://endpoint/sparql', 'BASIC', 1, None))


    def test_disable(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        endpoint_manager = EndpointManager(self.settings, self.request.session)
        endpoint_id = endpoint_manager.save_endpoint('endpoint1', 'http://endpoint/sparql', isenable=True)

        assert self.tps.test_row_presence('endpoints', 'id, name, url, auth, enable, message', (1, 'endpoint1', 'http://endpoint/sparql', 'BASIC', 1, None))

        endpoint_manager.disable(endpoint_id, 'message')

        assert self.tps.test_row_presence('endpoints', 'id, name, url, auth, enable, message', (1, 'endpoint1', 'http://endpoint/sparql', 'BASIC', 0, 'message'))

    def test_disable_by_url(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        endpoint_manager = EndpointManager(self.settings, self.request.session)
        endpoint_manager.save_endpoint('endpoint1', 'http://endpoint/sparql', isenable=True)

        assert self.tps.test_row_presence('endpoints', 'id, name, url, auth, enable, message', (1, 'endpoint1', 'http://endpoint/sparql', 'BASIC', 1, None))

        endpoint_manager.disable_by_url('http://endpoint/sparql', 'message')

        assert self.tps.test_row_presence('endpoints', 'id, name, url, auth, enable, message', (1, 'endpoint1', 'http://endpoint/sparql', 'BASIC', 0, 'message'))

    def test_list_endpoints(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        endpoint_manager = EndpointManager(self.settings, self.request.session)
        endpoint1 = endpoint_manager.save_endpoint('endpoint1', 'http://endpoint/sparql', isenable=True)
        endpoint2 = endpoint_manager.save_endpoint('endpoint2', 'http://other_endpoint/sparql', isenable=True)

        list_endpoints = endpoint_manager.list_endpoints()

        assert list_endpoints == [{
            'id': 1,
            'name': 'endpoint1',
            'endpoint': 'http://endpoint/sparql',
            'auth': 'BASIC',
            'enable': True,
            'message': None
        },
        {
            'id': 2,
            'name': 'endpoint2',
            'endpoint': 'http://other_endpoint/sparql',
            'auth': 'BASIC',
            'enable': True,
            'message': None
        }]


    def test_list_active_endpoints(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        endpoint_manager = EndpointManager(self.settings, self.request.session)
        endpoint1 = endpoint_manager.save_endpoint('endpoint1', 'http://endpoint/sparql', isenable=True)
        endpoint2 = endpoint_manager.save_endpoint('endpoint2', 'http://other_endpoint/sparql', isenable=False)

        list_endpoints = endpoint_manager.list_active_endpoints()

        assert list_endpoints == [{
            'id': 1,
            'name': 'endpoint1',
            'endpoint': 'http://endpoint/sparql',
            'auth': 'BASIC',
            'enable': True,
            'message': None
        }]



    def test_remove_endpoint(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        endpoint_manager = EndpointManager(self.settings, self.request.session)
        endpoint = endpoint_manager.save_endpoint('endpoint1', 'http://endpoint/sparql')
        
        assert self.tps.test_row_presence('endpoints', 'id, name, url, auth, enable, message', (1, 'endpoint1', 'http://endpoint/sparql', 'BASIC', 0, None))

        endpoint_manager.remove_endpoint(endpoint)

        assert not self.tps.test_row_presence('endpoints', 'id, name, url, auth, enable, message', (1, 'endpoint1', 'http://endpoint/sparql', 'BASIC', 0, None))
