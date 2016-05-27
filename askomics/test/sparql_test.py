from pyramid import testing
from askomics.test import AskoTestCase

class SparqlTests(AskoTestCase):
    def test_print_ids(self):
        from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder

        request = testing.DummyRequest()

        sqb = SparqlQueryBuilder(self.settings, request.session)

        graph = {'limit': 30, 'return_only_query': False, 'filter_cat': [], 'constraint': [{'type': 'node', 'id': 'entity1', 'uri': 'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#entity'}], 'filter_str': [{'id': 'entity1', 'value': 'xxxx'}], 'display': [{'id': 'entity1'}, {}], 'export': 0, 'filter_num': [], 'uploaded': ''}

        query = sqb.load_from_query_json(graph).query

        self.assertIn('?entity1 a :entity .\n\tFILTER (regex(str(?entity1), "xxxx", "i")) .', query)
