# import os
# import unittest
# import json
# import tempfile, shutil

# from pyramid import testing
# from pyramid.paster import get_appsettings

# from askomics.libaskomics.rdfdb.ResultsBuilder import ResultsBuilder
# from askomics.libaskomics.TripleStoreExplorer import TripleStoreExplorer

# import json
# from interface_tps_db import InterfaceTpsDb

# class ResultsBuilderTests(unittest.TestCase):

#     def setUp( self ):

#         self.temp_directory = tempfile.mkdtemp()
#         self.settings = get_appsettings('configs/tests.ini', name='main')
#         self.request = testing.DummyRequest()
#         self.request.session['username'] = 'jdoe'
#         self.request.session['group']    = 'base'
#         self.request.session['upload_directory'] = os.path.join( os.path.dirname( __file__ ), "..", "test-data")
#         self.temp_directory = tempfile.mkdtemp()

#         self.it = InterfaceTpsDb(self.settings,self.request)
#         self.it.empty()
#         self.it.load_test1()

#         variates              = ['?Personne1', '?label1', '?Age1', '?ID1', '?Sexe1']
#         constraintesRelations = [[['?URIPersonne1 rdf:type <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Personne>',
#                                  '?URIPersonne1 rdfs:label ?Personne1',
#                                  '?URIPersonne1 <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#label> ?label1',
#                                  '<http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#label> rdfs:domain <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Personne>',
#                                  '<http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#label> rdfs:range <http://www.w3.org/2001/XMLSchema#string>',
#                                  '<http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#label> rdf:type owl:DatatypeProperty',
#                                  '?URIPersonne1 <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Age> ?Age1',
#                                  '<http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Age> rdfs:domain <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Personne>',
#                                  '<http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Age> rdfs:range <http://www.w3.org/2001/XMLSchema#decimal>',
#                                  '<http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Age> rdf:type owl:DatatypeProperty',
#                                  '?URIPersonne1 <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#ID> ?ID1',
#                                  '<http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#ID> rdfs:domain <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Personne>',
#                                  '<http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#ID> rdfs:range <http://www.w3.org/2001/XMLSchema#string>',
#                                  '<http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#ID> rdf:type owl:DatatypeProperty',
#                                  '?URIPersonne1 <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Sexe> ?Sexe1'],''],'']

#         limit = 10
#         tse = TripleStoreExplorer(self.settings, self.request.session)
#         self.results, self.query = tse.build_sparql_query_from_json(variates,constraintesRelations,limit, True)
#         results, query = tse.build_sparql_query_from_json(variates,constraintesRelations,limit, False)
#         assert len(results) == 0

#     def tearDown( self ):
#         shutil.rmtree( self.temp_directory )
#         self.it.empty()

#     def test_build_csv_table(self):
#         rb = ResultsBuilder(self.settings, self.request.session)
#         res = rb.build_csv_table(self.results)
#         r = []
#         res = rb.build_csv_table(r)

#     def test_gen_csv_table(self):
#         rb = ResultsBuilder(self.settings, self.request.session)
#         gen = rb.gen_csv_table(self.results)
#         for i in gen:
#             print(i)
