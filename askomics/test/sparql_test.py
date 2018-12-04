# import unittest
# import os

# from pyramid import testing
# from pyramid.paster import get_appsettings
# from askomics.libaskomics.rdfdb.SparqlQueryStats import SparqlQueryStats
# from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher

# import json

# class SparqlTests(unittest.TestCase):
#     def setUp(self):
#         self.config = testing.setUp()
#         self.settings = get_appsettings('configs/development.ini', name='main')
#         self.request = testing.DummyRequest()
#         self.request.session['username'] = 'jdoe'
#         self.request.session['group']    = 'base'

#     def tearDown(self):
#         testing.tearDown()

#     def test_statistics(self):
#         sqb = SparqlQueryStats(self.settings, self.request.session)
#         ql = QueryLauncher(self.settings, self.request.session)

#         ql.process_query(sqb.get_number_of_triples())
#         ql.process_query(sqb.get_number_of_entities())
#         ql.process_query(sqb.get_number_of_classes())
#         ql.process_query(sqb.get_number_of_subgraph())
#         ql.process_query(sqb.get_subgraph_infos())
#         ql.process_query(sqb.get_attr_of_classes())
#         ql.process_query(sqb.get_rel_of_classes())
#         ql.process_query(sqb.get_rel_of_classes())
