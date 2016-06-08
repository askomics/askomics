import unittest

from pyramid import testing
from pyramid.paster import get_appsettings

class AskoTestCase(unittest.TestCase):
    "Base class for setting up a Pyramid Configurator and app settings"
    def setUp(self):
        self.config = testing.setUp(
            settings=get_appsettings('configs/development.ini', name='main'))
        self.settings = self.config.registry.settings

    def tearDown(self):
        testing.tearDown()
