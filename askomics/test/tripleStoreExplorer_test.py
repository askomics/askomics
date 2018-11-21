# import unittest
# import os
# import tempfile,shutil,copy

# from pyramid import testing
# from pyramid.paster import get_appsettings
# from askomics.libaskomics.TripleStoreExplorer import TripleStoreExplorer

# import json
# from interface_tps_db import InterfaceTpsDb

# class tripleStoreExplorerTests(unittest.TestCase):
#     def setUp( self ):
#         self.settings = get_appsettings('configs/tests.ini', name='main')
#         self.request = testing.DummyRequest()
#         self.request.session['upload_directory'] = os.path.join( os.path.dirname( __file__ ), "..", "test-data")
#         self.request.session['username'] = 'jdoe'
#         self.request.session['group']    = 'base'

#         self.temp_directory = tempfile.mkdtemp()

#         self.it = InterfaceTpsDb(self.settings,self.request)
#         self.it.empty()
#         self.it.load_test1()

#     def tearDown( self ):
#         shutil.rmtree( self.temp_directory )
#         self.it.empty()

#     def test_start_points(self):
#         tse = TripleStoreExplorer(self.settings, self.request.session)
#         tse.get_start_points()

#     def test_build_sparql_query_from_json(self):
#         variates              = ['?Personne1', '?label1', '?Age1', '?ID1', '?Sexe1']
#         constraintesRelations = [['?URIPersonne1 rdf:type <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Personne>',
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
#                                  '?URIPersonne1 <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Sexe> ?Sexe1'],'']

#         limit = 10
#         tse = TripleStoreExplorer(self.settings, self.request.session)
#         results,query = tse.build_sparql_query_from_json(variates,constraintesRelations,limit,True)

#         a = {'Age1': '23',
#         'ID1': 'AZERTY',
#         'Personne1': 'A',
#         'Sexe1': 'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#F',
#         'label1': 'Alice'}

#         b = {'Age1': '25',
#         'ID1': 'QSDFG',
#         'Personne1': 'B',
#         'Sexe1': 'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#M',
#         'label1': 'Bob'}

#         c = {'Age1': '34',
#         'ID1': 'WXCVB',
#         'Personne1': 'C',
#         'Sexe1': 'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#M',
#         'label1': 'Charles'}

#         d = {'Age1': '45',
#         'ID1': 'RTYU',
#         'Personne1': 'D',
#         'Sexe1': 'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#M',
#         'label1': 'Denis'}

#         e = {'Age1': '55',
#         'ID1': 'RTYUIO',
#         'Personne1': 'E',
#         'Sexe1': 'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#F','label1': 'Elise'}

#         f = {'Age1': '77',
#         'ID1': 'DFGH',
#         'Personne1': 'F',
#         'Sexe1': 'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#M',
#         'label1': 'Fred'}

#         g = {'Age1': '99',
#         'ID1': 'BNHJK',
#         'Personne1': 'G',
#         'Sexe1': 'http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#M',
#         'label1': 'Georges'}

#         for elt in results:
#             self.assertTrue(elt in [a,b,c,d,e,f,g])

#         assert len(results) == 7
#         constraintesR1 = copy.deepcopy(constraintesRelations)
#         constraintesR1[0].append('VALUES ?Sexe1 { :F }')
#         #results,query = tse.build_sparql_query_from_json(variates,constraintesR1,limit,True)

#         #for elt in results:
#         #    print(elt)
#         #    self.assertTrue(elt in [a,e])

#         #assert len(results) == 2

#         #constraintesR2 = copy.deepcopy(constraintesRelations)
#         #constraintesR2[0].append('FILTER ( ?Age1 < 25)')
#         #results,query = tse.build_sparql_query_from_json(variates,constraintesR2,limit,True)
#         #assert results == [a]
