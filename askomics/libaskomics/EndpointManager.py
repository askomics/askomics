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
        self.pathdb = self.get_db_directory()+self.databasename
        self.log.info(" ==> "+ self.pathdb +"<==");

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

        #test
        #reqSql = '''
        #INSERT OR IGNORE INTO endpoints (id,name,url,user,passwd,auth,askomics)
        #VALUES(2,'Askomics-Regine','http://openstack-192-168-100-46.genouest.org/virtuoso/sparql','NULL','NULL','NULL',1 )
        #'''

        #c.execute(reqSql)
        #conn.commit()
        conn.close()

    def saveEndpoint(self,name,url,auth,isenable):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        if not auth:
            auth = 'NULL'
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

    def enable(self,id):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        reqSql = "UPDATE endpoints SET "\
                + " enable = 1 ," \
                + " message = '' " \
                + " WHERE id = "+str(id)

        c.execute(reqSql)
        conn.commit()
        conn.close()
        self.listEndpoints()

    def disable(self,id,message):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        reqSql = "UPDATE endpoints SET "\
                + " enable = 0 , " \
                + " message = '"+message+"' " \
                + " WHERE id = "+str(id)
        print(reqSql)
        c.execute(reqSql)
        conn.commit()
        conn.close()
        self.listEndpoints()

    def listEndpoints(self):
        self.log.info(" == listEndpoints == ")
        data = []
        try:
            conn = sqlite3.connect(self.pathdb,uri=True)
            conn.row_factory = sqlite3.Row

            c = conn.cursor()

            reqSql = """SELECT id, name, url, auth, enable, message FROM endpoints"""

            c.execute(reqSql)
            rows = c.fetchall()
            self.log.info("nb row:"+str(len(rows)))
            for row in rows:

                d = {}
                d['id'] = row['id']
                d['name'] = row['name']
                d['endpoint'] = row['url']
                if row['auth'] != None and row['auth'] != 'NULL' :
                    d['auth'] = row['auth']
                else:
                    d['auth'] = ''
                d['enable'] = (row['enable'] == 1)
                d['message'] = row['message']
                data.append(d)

        except sqlite3.OperationalError as e :
            self.log.info("Endpoints database does not exist .")


        c.execute(reqSql)
        conn.commit()
        conn.close()
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
            self.log.info("nb row:"+str(len(rows)))
            for row in rows:

                d = {}
                d['id'] = row['id']
                d['name'] = row['name']
                d['endpoint'] = row['url']
                if row['auth'] != None and row['auth'] != 'NULL' :
                    d['auth'] = row['auth']
                else:
                    d['auth'] = ''
                d['enable'] = (row['enable'] == 1)
                d['message'] = row['message']

                data.append(d)

        except sqlite3.OperationalError as e :
            self.log.info("Endpoints database does not exist .")


        c.execute(reqSql)
        conn.commit()
        conn.close()
        return data


    def remove(self,id):
        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        reqSql = "DELETE FROM endpoints WHERE id = "+ str(id)

        try:
            c.execute(reqSql)
            conn.commit()
        except sqlite3.OperationalError as e :
            self.log.info("Jobs database does not exist .")

        conn.close()

    def drop(self):
        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        reqSql = "DROP table endpoints;"

        try:
            c.execute(reqSql)
            conn.commit()
        except sqlite3.OperationalError as e :
            self.log.info("Jobs database does not exist .")

        conn.close()
