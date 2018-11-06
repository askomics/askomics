from askomics.libaskomics.ParamManager import ParamManager

import logging
import sqlite3
import urllib.parse

class DatabaseConnector(ParamManager):
    """
    Manage Database connection
    """

    def __init__(self, settings, session):

        ParamManager.__init__(self, settings, session)
        self.database_path = self.get_param("askomics.database_path")

        # If database file 
        self.create_user_table()
        self.create_galaxy_table()
        # self.create_integration_table()
        # self.create_query_table()



    def execute_sql_query(self, query):
        """
        execute a sql query
        """

        connection = sqlite3.connect("file:" + self.database_path, uri=True)
        cursor = connection.cursor()

        cursor.execute(query)
        rows = cursor.fetchall()
        connection.commit()
        connection.close()

        return rows

    def create_user_table(self):

        query = '''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username text,
            email text,
            password text,
            salt text,
            apikey text,
            admin boolean,
            blocked boolean
        )
        '''
        self.execute_sql_query(query)

    def create_galaxy_table(self):

        query = '''
        CREATE TABLE IF NOT EXISTS galaxy_accounts (
            galaxy_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            url text,
            apikey text,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
        '''
        self.execute_sql_query(query)