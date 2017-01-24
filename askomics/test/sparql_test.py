import unittest
import os

from pyramid import testing
from pyramid.paster import get_appsettings
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher

import json

class SparqlTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        self.settings = get_appsettings('configs/development.ini', name='main')
        self.request.session['username'] = 'jdoe'

    def tearDown(self):
        testing.tearDown()

    def get_template1(self):
        return os.path.join( os.path.dirname( __file__ ), "..", "sparql", "initialQuery.sparql" )

    def test_print_ids(self):
        request = testing.DummyRequest()
        sqb = SparqlQueryBuilder(self.settings, request.session)

        #graph = {'limit': 30, 'return_only_query': False, 'filter_cat': [], 'constraint': [{'type': 'node', 'id': 'entity1', 'uri': 'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#entity'}], 'filter_str': [{'id': 'entity1', 'value': 'xxxx'}], 'display': [{'id': 'entity1'}, {}], 'export': 0, 'filter_num': [], 'uploaded': ''}
        #query = sqb.load_from_query_json(graph).query
        #self.assertIn('?entity1 a :entity .\n\tFILTER (regex(str(?entity1), "xxxx", "i")) .', query)

    def test_load_from_file(self):
        request = testing.DummyRequest()
        sqb = SparqlQueryBuilder(self.settings, request.session)
        temp = self.get_template1()

        sqb.load_from_file(temp)

    def test_prepare_query(self):
        request = testing.DummyRequest()
        sqb = SparqlQueryBuilder(self.settings, request.session)
        temp = self.get_template1()

        sqb.prepare_query(temp)

    def test_statistics(self):
        request = testing.DummyRequest()
        sqb = SparqlQueryBuilder(self.settings, request.session)
        ql = QueryLauncher(self.settings, request.session)

        sqb.get_statistics_number_of_triples()
        sqb.get_statistics_number_of_entities()
        sqb.get_statistics_distinct_classes()
        sqb.get_statistics_list_classes()
        sqb.get_statistics_nb_instances_by_classe()
        sqb.get_statistics_by_startpoint()
        sqb.get_list_named_graphs()
        res = ql.execute_query(sqb.get_list_named_graphs().query)

        for indexResult in range(len(res['results']['bindings'])):
                    sqb.get_delete_query_string(res['results']['bindings'][indexResult]['g']['value'])
                    sqb.get_metadatas(res['results']['bindings'][indexResult]['g']['value'])
