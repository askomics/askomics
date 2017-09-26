"""contain ModulesManager Class"""

import unittest
from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.ModulesManager import ModulesManager


class ModulesManagerTests(unittest.TestCase):
    """Test for the ModuleManager class"""

    def setUp(self):
        """Set up the settings and session"""

        self.settings = get_appsettings('configs/test.virtuoso.ini', name='main')
        self.settings['askomics.upload_user_data_method'] = 'insert'

        self.request = testing.DummyRequest()
        self.request.session['username'] = 'jdoe'
        self.request.session['group'] = 'base'
        self.request.session['admin'] = False
        self.request.session['blocked'] = True

        self.request.session['graph'] = "test/nosetest/jdoe"

    def test_instance(self):
        """Test """

        m = ModulesManager(self.settings, self.request.session)

    def test_loadAvailableMo(self):
        m = ModulesManager(self.settings, self.request.session)
        m.loadAvailableMo()

        m.modulesdir = 'bidon'
        m.loadAvailableMo()
        assert 'error' in m.data and m.data['error'] != ''

    def test_saveMo(self):
        m = ModulesManager(self.settings, self.request.session)

        #raise because module files are not loaded
        try:
            m.saveMo('testSaveMo')
            assert False
        except ValueError:
            assert True

        m.loadAvailableMo()

        #raise because testSaveMo does not exist in the module directory
        try:
            m.saveMo('testSaveMo')
            assert False
        except ValueError:
            assert True

        #Ok : Test exist !!!
        m.saveMo('Test')

        #raise because bad module directory
        m.modulesdir = 'bidon'
        m.saveMo('testSaveMo')
        assert 'error' in m.data and m.data['error'] != ''

    def test_checkMo(self):
        m = ModulesManager(self.settings, self.request.session)
        m.checkMo()

        m.modulesdir = 'bidon'
        m.moduleFiles['bidon'] = {}
        try:
            m.checkMo()
            assert False
        except ValueError:
            assert True

    def test_listModules(self):
        m = ModulesManager(self.settings, self.request.session)
        data =  m.getListModules()

    def test_mostate(self):
        m = ModulesManager(self.settings, self.request.session)

        mo = {}
        mo['module'] = 'test'
        mo['comment'] = 'this is a comment !'
        mo['version'] = '1.0.0'
        mo['graph'] = 'urn:test:askomics'

        m.importMoSate(mo,'off')
        m.deleteMoState(mo['module'])
        m.importMoSate(mo,'wait')
        m.deleteMoState(mo['module'])
        m.importMoSate(mo,'ok')
        m.deleteMoState(mo['module'])

    def test_moStateOnTPS(self):
        import shutil,os

        m = ModulesManager(self.settings, self.request.session)

        # module to load
        mo = {}
        mo['module'] = 'test'
        mo['comment'] = 'this is a comment !'
        mo['version'] = '1.0.0'
        mo['graph'] = 'urn:test:askomics'

        m.importMoSate(mo,'off')
        m.moStateOnTPS()
        m.deleteMoState(mo['module'])

        #new module file
        shutil.copy(m.modulesdir+"/Test.mo",m.modulesdir+"/test_bidon.mo");
        m.moStateOnTPS()
        os.remove(m.modulesdir+"/test_bidon.mo")


    def test_getListModules(self):
        m = ModulesManager(self.settings, self.request.session)
        m.getListModules()

    def test_importRDF(self):
        m = ModulesManager(self.settings, self.request.session)
        host_url = 'http://localhost:6543'
        namemodule = 'Test' # have to exist in the modfule dir

        mo = {}
        mo['module'] = 'Test'
        mo['comment'] = 'this is a comment !'
        mo['version'] = '1.0.0'
        mo['graph'] = 'urn:test:askomics'

        m.moduleFiles = {}
        m.moduleFiles[namemodule] = {}
        m.moduleFiles[namemodule]['rdf'] = []
        m.moduleFiles[namemodule]['rdf'].append('<http://unknown_prefix/bar> rdfs:label "Hello World".')
        m.importRDF(mo,namemodule,host_url)

        m.importRDF(mo,namemodule,host_url,graph="test/test")

    def test_generateAbstractAskomicsRDF(self):
        import os

        from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
        from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher

        m = ModulesManager(self.settings, self.request.session)

        sqb = SparqlQueryBuilder(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)
        sh = sqb.header_sparql_config('')

        rdf = """
              <http://bidon/relationTest> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#ObjectProperty> ;
			  <http://www.w3.org/2000/01/rdf-schema#label> "relationBidon" ;
			  <http://www.w3.org/2000/01/rdf-schema#domain> <http://bidon/Type1> ;
		      <http://www.w3.org/2000/01/rdf-schema#range> <http://bidon/Type2>.

              <http://bidon/Type1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#Class>.
              <http://bidon/Type2> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#Class>.
              """

        ql.insert_data(rdf, "urn:test:askomics", sh)
        m.generateAbstractAskomicsRDF("urn:test:askomics")

        rdf = """
              <http://bidon/relationTest> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#ObjectProperty> ;
			  <http://www.w3.org/2000/01/rdf-schema#label> "relationBidon" ;
			  <http://www.w3.org/2000/01/rdf-schema#domain> <http://bidon/Type1> ;
		      <http://www.w3.org/2000/01/rdf-schema#range> <http://bidon/Type2>.

              <http://bidon/Type1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#Class>.
              <http://bidon/Type2> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#Class>.

              <http://bidon/Type1> <http://www.w3.org/2000/01/rdf-schema#label> "Type1".
              <http://bidon/Type2> <http://www.w3.org/2000/01/rdf-schema#label> "Type2".

              <http://bidon/Attribute1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#DatatypeProperty> ;
              <http://www.w3.org/2000/01/rdf-schema#label> "Attribute1";
              <http://www.w3.org/2000/01/rdf-schema#domain> <http://bidon/Type1> ;
              <http://www.w3.org/2000/01/rdf-schema#range> <http://www.w3.org/2001/XMLSchema#int>.
              """
        ql.insert_data(rdf, "urn:test:askomics2", sh)
        m.generateAbstractAskomicsRDF("urn:test:askomics2")

        rdf = """
              <http://bidon/relationTest> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#ObjectProperty> ;
			  <http://www.w3.org/2000/01/rdf-schema#label> "relationBidon" ;
			  <http://www.w3.org/2000/01/rdf-schema#domain> <http=bidon=Type1> ;
		      <http://www.w3.org/2000/01/rdf-schema#range> <http=bidon=Type2>.

              <http=bidon=Type1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#Class>.
              <http=bidon=Type2> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#Class>.

              <http=bidon=Type1> <http://www.w3.org/2000/01/rdf-schema#label> "Type1".
              <http=bidon=Type2> <http://www.w3.org/2000/01/rdf-schema#label> "Type2".

              <http://bidon/Attribute1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#DatatypeProperty> ;
              <http://www.w3.org/2000/01/rdf-schema#label> "Attribute1";
              <http://www.w3.org/2000/01/rdf-schema#domain> <http=bidon=Type1> ;
              <http://www.w3.org/2000/01/rdf-schema#range> <http://www.w3.org/2001/XMLSchema#int>.
              """
        ql.insert_data(rdf, "urn:test:askomics3", sh)
        m.generateAbstractAskomicsRDF("urn:test:askomics3")


    def test_manageModules(self):
        m = ModulesManager(self.settings, self.request.session)
        host_url = 'http://localhost:6543'

        m.manageModules(host_url,"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Test","Test",False)
        m.manageModules(host_url,"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Test","Test",True)
        try:
            m.manageModules(host_url,"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Test","Test111",True)
        except ValueError:
            assert True
        m.moduleFiles["Test"]['rdf'] = None
        m.manageModules(host_url,"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Test","Test",True)
