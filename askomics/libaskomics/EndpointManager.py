from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.DatabaseConnector import DatabaseConnector

import logging

import platform

class EndpointManager(ParamManager):

    def __init__(self, settings, session):
        ParamManager.__init__(self, settings, session)

    def save_endpoint(self, name, url, auth='BASIC', isenable=False):

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        INSERT INTO endpoints VALUES (
            NULL,
            ?,
            ?,
            ?,
            ?,
            NULL
        )
        '''
        return database.execute_sql_query(query, (name, url, auth, isenable), get_id=True)

    def enable(self, id):

        database = DatabaseConnector(self.settings, self.session)

        query = '''
        UPDATE endpoints SET
        enable=?
        WHERE id=?
        '''
        database.execute_sql_query(query, (True, str(id)))

    def disable(self, id, message):

        database = DatabaseConnector(self.settings, self.session)

        query = '''
        UPDATE endpoints SET
        enable=?,
        message=?
        WHERE id=?
        '''

        database.execute_sql_query(query, (False, message, str(id)))

    def disable_by_url(self, url, message):

        database = DatabaseConnector(self.settings, self.session)

        query = '''
        UPDATE endpoints SET
        enable=?,
        message=?
        WHERE url=?
        '''

        database.execute_sql_query(query, (False, message, str(url)))


    def list_endpoints(self):

        database=DatabaseConnector(self.settings, self.session)

        query = '''
        SELECT *
        FROM endpoints
        '''

        rows = database.execute_sql_query(query)
        result = []
        for endpoint in rows:
            dict_endpoint = {}
            dict_endpoint['id'] = endpoint[0]
            dict_endpoint['name'] = endpoint[1]
            dict_endpoint['endpoint'] = endpoint[2]
            dict_endpoint['auth'] = endpoint[3]
            dict_endpoint['enable'] = (endpoint[4] == 1)
            dict_endpoint['message'] = endpoint[5]
            result.append(dict_endpoint)

        return result

    def list_active_endpoints(self):

        database=DatabaseConnector(self.settings, self.session)

        query = '''
        SELECT *
        FROM endpoints
        WHERE enable=?
        '''

        rows = database.execute_sql_query(query, (True, ))

        result = []
        for endpoint in rows:
            dict_endpoint = {}
            dict_endpoint['id'] = endpoint[0]
            dict_endpoint['name'] = endpoint[1]
            dict_endpoint['endpoint'] = endpoint[2]
            dict_endpoint['auth'] = endpoint[3]
            dict_endpoint['enable'] = (endpoint[4] == 1)
            dict_endpoint['message'] = endpoint[5]
            result.append(dict_endpoint)

        return result

    def remove_endpoint(self, id):

        database = DatabaseConnector(self.settings, self.session)

        query = '''
        DELETE FROM endpoints
        WHERE id=?
        '''

        database.execute_sql_query(query, (id, ))
