import unittest
import os

from pyramid import testing
from pyramid.paster import get_appsettings
from askomics.libaskomics.TripleStoreExplorer import TripleStoreExplorer

import json

class tripleStoreExplorerTests(unittest.TestCase):
    def setUp( self ):
        self.settings = get_appsettings('configs/development.ini', name='main')
        self.request = testing.DummyRequest()

    def tearDown( self ):
        shutil.rmtree( self.temp_directory )

    def test_start_points(self):
        tse = TripleStoreExplorer(self.settings, self.request.session)
        tse.get_start_points()

    def test_build_sparql_query_from_json(self):
        variates              = []
        constraintesRelations = []
        constraintesFilters   = []
        limit = 10
        tse = TripleStoreExplorer(self.settings, self.request.session)
        tse.build_sparql_query_from_json(variates,constraintesRelations,constraintesFilters,limit)
