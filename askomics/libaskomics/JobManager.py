from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.DatabaseConnector import DatabaseConnector

import logging
import sqlite3
import urllib.parse
import json

class JobManager(ParamManager):
    """
        Manage Askomics jobs inside a sqlite database
    """
    def __init__(self, settings, session):
        ParamManager.__init__(self, settings, session)

    def save_integration_job(self, filename, user_id):

        database = DatabaseConnector(self.settings, self.session)

        query = '''
        INSERT INTO integration VALUES(
            NULL,
            ?,
            ?,
            "wait",
            strftime('%s', 'now'),
            NULL,
            NULL
        )
        '''

        return database.execute_sql_query(query, (user_id, filename), get_id=True)

    def save_query_job(self, request_graph, variates, user_id):

        database = DatabaseConnector(self.settings, self.session)

        # Format strings
        request_graph = urllib.parse.quote(request_graph)
        variates = self.encode(str(variates))

        query = '''
        INSERT INTO query VALUES(
            NULL,
            ?,
            "wait",
            strftime('%s', 'now'),
            NULL,
            NULL,
            NULL,
            NULL,
            ?,
            ?,
            NULL,
            NULL
        )
        '''

        return database.execute_sql_query(query, (user_id, request_graph, variates), get_id=True)


    def done_integration_job(self, jobid):

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        UPDATE integration SET
        state="done",
        end=strftime('%s', 'now')
        WHERE id=?
        '''

        database.execute_sql_query(query, (jobid, ))

    def done_query_job(self, jobid, nrows, data, file):

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        UPDATE query SET
        state="done",
        end=strftime('%s', 'now'),
        nrows=?,
        data=?,
        file=?
        WHERE id=?
        '''

        database.execute_sql_query(query, (nrows, self.encode(json.dumps(data, ensure_ascii=False)), file, jobid))

    def set_error_message(self, table, message, jobid):

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        UPDATE {0} SET
        error=?,
        state=?
        WHERE id=?
        '''.format(table)

        print(query)

        database.execute_sql_query(query, (message, 'error', jobid))


    def list_integration_jobs(self, user_id):

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT id, filename, state, start, end, error
        FROM integration
        WHERE user_id=?
        '''

        res = database.execute_sql_query(query, (user_id, ))
        result = []
        for job in res:
            dict_job = {}
            dict_job['id'] = job[0]
            dict_job['filename'] = job[1]
            dict_job['state'] = job[2]
            dict_job['start'] = job[3]
            dict_job['end'] = job[4]
            dict_job['error'] = job[5]
            result.append(dict_job)

        return result

    def list_query_jobs(self, user_id):


        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT id, state, start, end, data, file, preview, graph, variates, nrows, error
        FROM query
        WHERE user_id=?
        '''

        res = database.execute_sql_query(query, (user_id, ))
        result = []
        for job in res:
            dict_job = {}
            dict_job['id'] = job[0]
            dict_job['state'] = job[1]
            dict_job['start'] = job[2]
            dict_job['end'] = job[3]
            dict_job['data'] = ''
            if job[4]:
                dict_job['data'] = json.loads(self.decode(job[4]))
            dict_job['file'] = job[5]
            dict_job['preview'] = job[6]
            dict_job['graph'] = urllib.parse.unquote(job[7])
            dict_job['variates'] = eval(self.decode(job[8]))
            dict_job['nrows'] = job[9]
            dict_job['error'] = job[10]
            result.append(dict_job)

        return result

    def remove_job(self, table, jobid):

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        DELETE FROM {0}
        WHERE id=?
        '''.format(table)

        database.execute_sql_query(query, (jobid, ))

    def remove_all_user_jobs(self, table, user_id):

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        DELETE FROM {0}
        WHERE user_id=?
        '''.format(table)

        database.execute_sql_query(query, (user_id, ))
