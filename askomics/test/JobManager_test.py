"""contain ModulesManager Class"""

import unittest
import os.path

from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.JobManager import JobManager

from interface_tps_db import InterfaceTpsDb

class JobManagerTests(unittest.TestCase):
    """Test for the ModuleManager class"""

    def setUp(self):
        """Set up the settings and session"""

        self.settings = get_appsettings('configs/tests.ini', name='main')
        self.settings['askomics.upload_user_data_method'] = 'insert'

        self.request = testing.DummyRequest()
        self.request.session['username'] = 'jdoe'
        self.request.session['group'] = 'base'
        self.request.session['admin'] = False
        self.request.session['blocked'] = False

        self.request.session['graph'] = "test/nosetest/jdoe"

        self.tps = InterfaceTpsDb(self.settings, self.request)

        
    def test_save_integration_job(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        job_manager = JobManager(self.settings, self.request.session)
        job_manager.save_integration_job('file.tsv')

        assert self.tps.test_row_presence('integration', 'user_id, filename, state, end, error', (1, 'file.tsv', 'wait', None, None))


    def test_query_job(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        job_manager = JobManager(self.settings, self.request.session)
        job_manager.save_query_job('graph_string', '_s3_7B_s3_27variate_s3_27_s3_3A_s3_20_s3_5B_s3_27_s3_3Fvariate_s3_27_s3_5D_s3_7D')

        assert self.tps.test_row_presence('query', 'user_id, state, end, data, file, preview, graph, variates, nrows, error', (1, 'wait', None, None, None, None, 'graph_string', '_s3_7B_s3_27variate_s3_27_s3_3A_s3_20_s3_5B_s3_27_s3_3Fvariate_s3_27_s3_5D_s3_7D', None, None))

    def test_done_integration_job(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        job_manager = JobManager(self.settings, self.request.session)
        job_manager.save_integration_job('file.tsv')
        job_manager.done_integration_job(1)

        assert self.tps.test_row_presence('integration', 'user_id, filename, state, error', (1, 'file.tsv', 'done', None))


    def test_done_query_job(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        job_manager = JobManager(self.settings, self.request.session)
        job_manager.save_query_job('graph_string', '_s3_7B_s3_27variate_s3_27_s3_3A_s3_20_s3_5B_s3_27_s3_3Fvariate_s3_27_s3_5D_s3_7D')
        job_manager.done_query_job(1, 15, 'data_string', 'file_string')

        assert self.tps.test_row_presence('query', 'user_id, state, data, file, preview, graph, variates, nrows, error', (1, 'done', '_s3_22data_string_s3_22', 'file_string', None, 'graph_string', '_s3_7B_s3_27variate_s3_27_s3_3A_s3_20_s3_5B_s3_27_s3_3Fvariate_s3_27_s3_5D_s3_7D', 15, None))

    def test_set_error_message(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        job_manager = JobManager(self.settings, self.request.session)
        job_manager.save_integration_job('error_file.tsv')
        job_manager.set_error_message('integration', 'error_string', 1)

        assert self.tps.test_row_presence('integration', 'user_id, filename, state, end, error', (1, 'error_file.tsv', 'error', None, 'error_string'))

    def test_list_integration_jobs(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        job_manager = JobManager(self.settings, self.request.session)
        job_manager.save_integration_job('file.tsv')
        job_manager.save_integration_job('file2.tsv')
        job_manager.done_integration_job(2)

        result = job_manager.list_integration_jobs()

        assert len(result) == 2

    def test_list_query_jobs(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        job_manager = JobManager(self.settings, self.request.session)
        job_manager.save_query_job('graph_string', '_s3_7B_s3_27variate_s3_27_s3_3A_s3_20_s3_5B_s3_27_s3_3Fvariate_s3_27_s3_5D_s3_7D')
        job_manager.save_query_job('graph_string2', '_s3_7B_s3_27variate_s3_27_s3_3A_s3_20_s3_5B_s3_27_s3_3Fvariate_s3_27_s3_5D_s3_7D')
        job_manager.done_query_job(2, 15, 'data_string2', 'file_string2')

        result = job_manager.list_query_jobs()

        assert len(result) == 2

    def test_remove_job(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()
        job_manager = JobManager(self.settings, self.request.session)
        job_manager.save_integration_job('file.tsv')
        assert self.tps.test_row_presence('integration', 'user_id, filename, state, end, error', (1, 'file.tsv', 'wait', None, None))
        job_manager.remove_job('integration', 1)
        assert not self.tps.test_row_presence('integration', 'user_id, filename, state, end, error', (1, 'file.tsv', 'wait', None, None))
