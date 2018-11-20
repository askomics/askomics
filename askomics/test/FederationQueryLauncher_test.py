"""contain FederationQueryLauncher Class"""

import unittest
import os.path

from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.rdfdb.FederationQueryLauncher import FederationQueryLauncher
from askomics.libaskomics.EndpointManager import EndpointManager

class FederationQueryLauncherTests(unittest.TestCase):
    """Test for the FederationQueryLauncher class"""

    def setUp(self):
        """Set up the settings and session"""

        self.settings = get_appsettings('configs/tests.ini', name='main')

        self.request = testing.DummyRequest()
        self.settings['askomics.fdendpoint'] = 'http://localhost:8890/sparql'

    def test_process_query(self):
        jm = EndpointManager(self.settings, self.request.session)
        jm.save_endpoint("testNameEndpoint",'http://localhost:8890/sparql','Digest',True)

        try:
            fql = FederationQueryLauncher(self.settings, self.request.session,jm.list_endpoints())
            fql.process_query("SELECT * WHERE { ?a ?b ?c. } LIMIT 1")
            assert False
        except ValueError:
            assert True

        lE = jm.list_endpoints()
        for i in range(0, len(lE)):
            lE[i]['askomics'] = True

        try:
            fql = FederationQueryLauncher(self.settings, self.request.session,lE)
            fql.process_query("SELECT * WHERE { ?a ?b ?c. } LIMIT 1")
            assert True
        except ValueError as e:
            print(str(e))
            assert False
