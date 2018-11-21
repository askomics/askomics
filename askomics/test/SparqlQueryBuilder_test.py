# import unittest
# import os

# from pyramid import testing
# from pyramid.paster import get_appsettings
# from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
# from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher

# import json

# class SparqlQueryBuilderTests(unittest.TestCase):
#     def setUp(self):
#         self.config = testing.setUp()
#         self.settings = get_appsettings('configs/tests.ini', name='main')
#         self.request = testing.DummyRequest()
#         self.request.session['username'] = 'jdoe'
#         self.request.session['group']    = 'base'

#     def tearDown(self):
#         testing.tearDown()

#     def test_build_query_on_the_fly(self):
#         sqb = SparqlQueryBuilder(self.settings, self.request.session)
#         sqb.build_query_on_the_fly({})
#         sqb.build_query_on_the_fly({},True)
#         sqb.build_query_on_the_fly({},False)
#         sqb.build_query_on_the_fly({},"HelloWorld")
