"""contain ModulesManager Class"""

import unittest
import os.path

from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.JobManager import JobManager


class JobManagerTests(unittest.TestCase):
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

        jm = JobManager(self.settings, self.request.session)
        jm.drop()

    def test_saveStartSparqlJob(self):
        jm = JobManager(self.settings, self.request.session)
        d = jm.saveStartSparqlJob("TypeBidon","{}")
        jm.removeJob(d)
        del self.request.session['username']
        d = jm.saveStartSparqlJob("","{}")
        jm.removeJob(d)

    def test_removeJob(self):
        jm = JobManager(self.settings, self.request.session)
        jm.removeJob("aaa")
        jm.removeJob(-1)
        jm.removeJob(44)

    def test_updateEndSparqlJob(self):
        jm = JobManager(self.settings, self.request.session)
        jobid = jm.saveStartSparqlJob("TypeBidon","{}")
        jm.updateEndSparqlJob(jobid,"Hello")
        l = jm.listJobs()
        assert len(l) == 1
        assert l[0]['state'] == "Hello"

        jm.updateEndSparqlJob(jobid,"Hello",nr=10)
        l = jm.listJobs()
        assert len(l) == 1
        assert l[0]['state'] == "Hello"
        assert l[0]['nr'] == 10

        jm.updateEndSparqlJob(jobid,"Hello",data={ "a" : "b" })
        l = jm.listJobs()
        assert len(l) == 1
        assert l[0]['state'] == "Hello"
        assert l[0]['data'] == { 'a' : 'b' }

        jm.updateEndSparqlJob(jobid,"Hello",file="test.tsv")
        l = jm.listJobs()
        assert len(l) == 1
        assert l[0]['state'] == "Hello"
        assert l[0]['file'] == "test.tsv"

        jm.updateEndSparqlJob(jobid,"Hello",file="test.tsv",data={'test': ['t1','t2']})
        l = jm.listJobs()
        assert len(l) == 1
        assert l[0]['state'] == "Hello"
        assert l[0]['file'] == "test.tsv"

        jm.removeJob(jobid)

    def test_updatePreviewJob(self):
        try:
            jm = JobManager(self.settings, self.request.session)
            jm.updatePreviewJob(-1,None)
            assert False
        except Exception as e:
            assert True

        jm.updatePreviewJob(-1,"")

    def test_listJobs(self):
        import os

        jm = JobManager(self.settings, self.request.session)
        l = jm.listJobs()

        os.remove(jm.pathdb)
        try:
            l = jm.listJobs()
            assert False
        except Exception as e:
            assert True

    def tes_drop(self):
        import os

        jm = JobManager(self.settings, self.request.session)
        os.remove(jm.pathdb)

        l = jm.drop()
