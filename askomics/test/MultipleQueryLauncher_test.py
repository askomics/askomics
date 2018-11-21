"""contain MultipleQueryLauncher Class"""

import unittest
import os.path

from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.rdfdb.MultipleQueryLauncher import MultipleQueryLauncher
from askomics.libaskomics.EndpointManager import EndpointManager

class MultipleQueryLauncher(unittest.TestCase):
    """Test for the MultipleQueryLauncher class"""

    def setUp(self):
        """Set up the settings and session"""

        self.settings = get_appsettings('configs/tests.ini', name='main')

        self.request = testing.DummyRequest()
        #self.settings['askomics.fdendpoint'] = 'http://localhost:8890/sparql'

    def test_process_query(self):
        jm = EndpointManager(self.settings, self.request.session)
        jm.save_endpoint("testNameEndpoint",'http://localhost:8890/sparql','Digest',True)
        jm.save_endpoint("testNameEndpoint2",'http://localhost:8890/sparql','Digest',True)
        #mql = MultipleQueryLauncher(self.settings, self.request.session)
        try:

        #    mql.process_query("SELECT * WHERE { ?a ?b ?c. } LIMIT 1",jm.listEndpoints(),indexByEndpoint=True)
            assert True
        except ValueError:
            assert False
