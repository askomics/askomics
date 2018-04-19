"""contain EndpointManager Class"""

import unittest
import os.path

from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.EndpointManager import EndpointManager


class EndpointManagerTests(unittest.TestCase):
    """Test for the ModuleManager class"""

    def setUp(self):
        """Set up the settings and session"""

        self.settings = get_appsettings('configs/test.virtuoso.ini', name='main')
        self.request = testing.DummyRequest()

        jm = EndpointManager(self.settings, self.request.session)
        jm.drop()

    def tearDown(self):
        jm = EndpointManager(self.settings, self.request.session)
        jm.drop()

    def test_saveEndpoint(self):
        jm = EndpointManager(self.settings, self.request.session)
        jm.saveEndpoint("testNameEndpoint","http://www.urlTPS.com",'Digest',True)
        jm.saveEndpoint("testNameEndpoint2","http://www.urlTPS.com",None,True)
        try:
            jm.saveEndpoint("testNameEndpoint3","http://www.urlTPS.com",'BIDON',False)
            assert False
        except ValueError:
            assert True
        jm.saveEndpoint("testNameEndpoint4","http://www.urlTPS.com",None,False)
        jm.drop()


    def test_disable_enable(self):
        jm = EndpointManager(self.settings, self.request.session)
        listActiveEndp = jm.listActiveEndpoints()
        assert len(listActiveEndp) == 0
        # no effect
        jm.enable(0)
        listActiveEndp = jm.listActiveEndpoints()
        assert len(listActiveEndp) == 0

        jm.saveEndpoint("testNameEndpoint","http://www.urlTPS.com",'Digest',False)
        # no effect
        jm.enable(0)
        listActiveEndp = jm.listActiveEndpoints()
        assert len(listActiveEndp) == 0

        jm.enable("testNameEndpoint")
        listActiveEndp = jm.listActiveEndpoints()

        assert len(listActiveEndp) == 1
        assert (listActiveEndp[0]['name'] == "testNameEndpoint"
                and listActiveEndp[0]['enable']
                and listActiveEndp[0]['endpoint'] == "http://www.urlTPS.com"
                and listActiveEndp[0]['auth'].lower() == "digest")

        jm.disable("testNameEndpoint","test disable")

        listActiveEndp = jm.listActiveEndpoints()

        assert len(listActiveEndp) == 0

        listEndp = jm.listEndpoints()
        assert len(listEndp) == 1

        assert (listEndp[0]['name'] == "testNameEndpoint"
                and not listEndp[0]['enable']
                and listEndp[0]['endpoint'] == "http://www.urlTPS.com"
                and listEndp[0]['auth'].lower() == "digest")
        jm.drop()

    def test_listEndpoints(self):
        jm = EndpointManager(self.settings, self.request.session)
        jm.remove("bidon")
        jm.saveEndpoint("testNameEndpoint","http://www.urlTPS.com",'Digest',True)
        listEndp = jm.listEndpoints()
        assert len(listEndp) == 1
        jm.remove("bidon")
        jm.remove("testNameEndpoint")
        listEndp = jm.listEndpoints()
        assert len(listEndp) == 0

    def test_raise_SQLException(self):
        jm = EndpointManager(self.settings, self.request.session)
        jm.drop()
        listEndp = jm.listEndpoints()
        listEndp = jm.listActiveEndpoints()
        jm.remove("bidon")
        jm.drop()
