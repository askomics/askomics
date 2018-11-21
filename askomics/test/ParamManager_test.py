"""contain ModulesManager Class"""

import unittest
import os.path
import shutil

from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.ParamManager import ParamManager


class ParamManagerTests(unittest.TestCase):
    """Test for the ModuleManager class"""

    def setUp(self):
        """Set up the settings and session"""

        self.settings = get_appsettings('configs/tests.ini', name='main')
        self.settings['askomics.upload_user_data_method'] = 'insert'

        self.request = testing.DummyRequest()
        self.request.session['username'] = 'jdoe'
        self.request.session['group'] = 'base'
        self.request.session['admin'] = False
        self.request.session['blocked'] = True

        self.request.session['graph'] = "test/nosetest/jdoe"

    def test_instance(self):
        """Test """

        m = ParamManager(self.settings, self.request.session)

    def test_get_upload_directory(self):
        m = ParamManager(self.settings, self.request.session)

        d = m.get_upload_directory()
        assert os.path.isdir(d)

        shutil.rmtree(d)
        del self.request.session['username']
        d = m.get_upload_directory()
        assert os.path.isdir(d)

    def test_get_user_csv_directory(self):
        m = ParamManager(self.settings, self.request.session)
        d = m.get_user_csv_directory()
        assert os.path.isdir(d)
        shutil.rmtree(d)

        del self.request.session['username']
        d = m.get_user_csv_directory()
        assert os.path.isdir(d)

    def test_get_rdf_user_directory(self):
        m = ParamManager(self.settings, self.request.session)
        d = m.get_rdf_user_directory()
        assert os.path.isdir(d)
        shutil.rmtree(d)

        del self.request.session['username']
        d = m.get_rdf_user_directory()
        assert os.path.isdir(d)

    def test_get_turtle_template(self):
        m = ParamManager(self.settings, self.request.session)
        try:
            m.get_turtle_template(None)
            assert False
        except Exception as e:
            assert True
        m.get_turtle_template(":a :b :c.")

    def test_set_param(self):
        m = ParamManager(self.settings, self.request.session)
        m.set_param("test","test")

    def test_get_param(self):
        m = ParamManager(self.settings, self.request.session)
        m.set_param("test","testValue")
        d = m.get_param("test")
        assert d == "testValue"
        d = m.get_param("test2")
        assert d == ""

    def test_is_defined(self):
        m = ParamManager(self.settings, self.request.session)
        m.set_param("test","testValue")
        assert m.is_defined("test")
        assert not m.is_defined("test2")

    def test_update_list_prefix(self):
        m = ParamManager(self.settings, self.request.session)
        m.update_list_prefix(["eat","toto"]);

    def test_reverse_prefix(self):
        m = ParamManager(self.settings, self.request.session)
        assert "xsd" == m.reverse_prefix("http://www.w3.org/2001/XMLSchema#")
        assert "" == m.reverse_prefix("http://totototo")
        assert "yago" == m.reverse_prefix("http://yago-knowledge.org/resource/")

    def test_header_sparql_config(self):
        m = ParamManager(self.settings, self.request.session)
        m.header_sparql_config("SELECT ?a FROM { ?a a owl:Class. \n ?a yago:test eat:test. }")

    def test_remove_prefix(self):
        m = ParamManager(self.settings, self.request.session)
        d = m.remove_prefix("SELECT ?a FROM { ?a a http://www.w3.org/2002/07/owl#Class. }")
        assert d == "SELECT ?a FROM { ?a a owl:Class. }"

    def test_encode(self):
        r = ParamManager.encode("@&###:::123%%%%!!!")
        assert r != "@&###123%%%%!!!"

    def test_decode(self):
        r = ParamManager.encode("@&###:::123%%%%!!!")
        assert ParamManager.decode(r) == "@&###:::123%%%%!!!"

    def test_encode_to_rdf_uri(self):
        r = ParamManager.encode_to_rdf_uri("A",prefix="http://helloworld/test/")
        assert r == "<http://helloworld/test/A>"
        r = ParamManager.encode_to_rdf_uri("A",prefix="<http://helloworld/test/>")
        assert r == "<http://helloworld/test/A>"

        r = ParamManager.encode_to_rdf_uri("A<A>A",prefix="<http://helloworld/test/>")
        assert r == "<http://helloworld/test/A_s3_3CA_s3_3EA>"


    def test_decode_to_rdf_uri(self):
        r = ParamManager.encode_to_rdf_uri("A",prefix="<http://helloworld/test/>")
        assert ParamManager.decode_to_rdf_uri(r,prefix="http://helloworld/test/") == "A"

    def test_bool(self):
        try:
            ParamManager.Bool(None)
            assert False
        except Exception as e:
            assert True
        assert not ParamManager.Bool("FALSE")
        assert not ParamManager.Bool("FaLsE")
        assert ParamManager.Bool("TRUE")
        assert ParamManager.Bool("TrUe")
        assert ParamManager.Bool("1")
        try:
            ParamManager.Bool(1)
            assert False
        except Exception as e:
            assert True

    def test_send_mails(self):
        m = ParamManager(self.settings, self.request.session)

        m.send_mails("bidon_url","test@test.fr","Subject","Message")
        m.set_param('askomics.smtp_host','smtp.test.fr')
        m.send_mails("bidon_url","test@test.fr","Subject","Message")
        m.set_param('askomics.smtp_port','20')
        m.send_mails("bidon_url","test@test.fr","Subject","Message")
        m.set_param('askomics.smtp_login','test')
        m.send_mails("bidon_url","test@test.fr","Subject","Message")
        m.set_param('askomics.smtp_password','test')
        m.send_mails("bidon_url","test@test.fr","Subject","Message")
