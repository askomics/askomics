from askomics.libaskomics.ParamManager import ParamManager

import logging
import sqlite3
import platform

class EndpointManager(ParamManager):
    """
        Manage Askomics endpoint inside a sqlite database
    """
    def __init__(self, settings, session):
        ParamManager.__init__(self, settings, session)
        self.log = logging.getLogger(__name__)
        self.databasename = "endpoints.db"
        self.pathdb = self.get_common_user_directory()+"/"+self.databasename
        self.create_db()

    def create_db(self):
        print(self)

        conn = sqlite3.connect("file:"+self.pathdb,uri=True)
        c = conn.cursor()
        reqSql = '''CREATE TABLE IF NOT EXISTS endpoints
             (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             name text,
             url text,
             auth text,
             enable integer,
             message text
             )'''

        c.execute(reqSql)
        conn.commit()
        conn.close()


    def saveEndpoint(self,name,url,auth,isenable):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        if not auth:
            auth = 'BASIC'
        else:
            auth = auth.upper()
            if auth != 'BASIC' and auth != 'DIGEST':
                raise ValueError("Possible value for 'auth' : Digest, Basic, None")

        enable = '0'
        if isenable:
            enable = '1'

        reqSql = "INSERT INTO endpoints VALUES ("\
                + "NULL,"     \
                +"'"+name+"'," \
                +"'"+url+"'," \
                +"'"+auth+"'," \
                + enable +","\
                + "''" \
                + ");"

        c.execute(reqSql)
        ID = c.lastrowid

        conn.commit()
        conn.close()
        return ID

    def enable(self,name):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        reqSql = "UPDATE endpoints SET "\
                + " enable = 1 ," \
                + " message = '' " \
                + " WHERE name = '"+str(name)+"'"

        c.execute(reqSql)
        conn.commit()
        conn.close()

    def disable(self,name,message):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        reqSql = "UPDATE endpoints SET "\
                + " enable = 0 , " \
                + " message = '"+message+"' " \
                + " WHERE name = '"+str(name)+"'"

        c.execute(reqSql)
        conn.commit()
        conn.close()

    def listEndpoints(self):

        data = []
        try:
            conn = sqlite3.connect(self.pathdb,uri=True)
            conn.row_factory = sqlite3.Row

            c = conn.cursor()

            reqSql = """SELECT id, name, url, auth, enable, message FROM endpoints"""

            c.execute(reqSql)
            rows = c.fetchall()

            for row in rows:

                d = {}
                d['auth'] = ''

                d['id'] = row['id']
                d['name'] = row['name']
                d['endpoint'] = row['url']

                if row['auth'] != None and row['auth'] != 'NULL' :
                    d['auth'] = row['auth']

                d['enable'] = (row['enable'] == 1)
                d['message'] = row['message']
                data.append(d)
            conn.close()

        except sqlite3.OperationalError as e :
            self.log.warn("Endpoints database does not exist .")

        return data

    def listActiveEndpoints(self):

        data = []
        try:
            conn = sqlite3.connect(self.pathdb,uri=True)
            conn.row_factory = sqlite3.Row

            c = conn.cursor()

            reqSql = """SELECT id, name, url, auth, enable, message FROM endpoints WHERE enable == 1 """

            c.execute(reqSql)
            rows = c.fetchall()

            for row in rows:

                d = {}
                d['auth'] = ''
                d['id'] = row['id']
                d['name'] = row['name']
                d['endpoint'] = row['url']

                if row['auth'] != None and row['auth'] != 'NULL' :
                    d['auth'] = row['auth']

                d['enable'] = (row['enable'] == 1)
                d['message'] = row['message']

                data.append(d)

            conn.close()

        except sqlite3.OperationalError as e :
            self.log.warn("Endpoints database does not exist .")

        return data

    def remove(self,name):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        reqSql = "DELETE FROM endpoints WHERE name = '"+ str(name)+"'"

        try:
            c.execute(reqSql)
            conn.commit()
        except sqlite3.OperationalError as e :
            self.log.warn("Jobs database does not exist .")

        conn.close()

    def drop(self):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        reqSql = "DROP table endpoints;"

        try:
            c.execute(reqSql)
            conn.commit()
        except sqlite3.OperationalError as e :
            self.log.warn("Jobs database does not exist .")

        conn.close()
