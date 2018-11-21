from askomics.libaskomics.ParamManager import ParamManager

import logging
import sqlite3
import urllib.parse
import itertools

class DatabaseConnector(ParamManager):
    """
    Manage Database connection
    """

    def __init__(self, settings, session):

        ParamManager.__init__(self, settings, session)
        self.database_path = self.get_param("askomics.database_path")

        # Create tables
        self.create_user_table()
        self.create_galaxy_table()
        self.create_integration_table()
        self.create_query_table()
        self.create_endpoints_table()

    def execute_sql_query(self, query, variables=None, get_id=False):
        """
        execute a sql query
        """

        connection = sqlite3.connect("file:" + self.database_path, uri=True)
        cursor = connection.cursor()

        if variables:
            cursor.execute(query, variables)
        else:
            cursor.execute(query)
        rows = cursor.fetchall()
        connection.commit()
        connection.close()

        if get_id:
            return cursor.lastrowid

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

    def create_integration_table(self):

        query = '''
        CREATE TABLE IF NOT EXISTS integration (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            filename text,
            state text,
            start int,
            end int,
            error text,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
        '''
        self.execute_sql_query(query)

    def create_query_table(self):

        query = '''
        CREATE TABLE IF NOT EXISTS query (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            state text,
            start int,
            end int,
            data text,
            file text,
            preview text,
            graph text,
            variates text,
            nrows int,
            error text,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
        '''
        self.execute_sql_query(query)

    def create_endpoints_table(self):

        query = '''
        CREATE TABLE IF NOT EXISTS endpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text,
            url text,
            auth text,
            enable boolean,
            message text
        )
        '''
        self.execute_sql_query(query)
