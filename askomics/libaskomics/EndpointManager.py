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
             user text,
             passwd text,
             auth text,
             askomics integer
             )'''

        c.execute(reqSql)
        conn.commit()

        name = 'Askomics-'+platform.node()
        url  = self.get_param("askomics.endpoint")
        user = 'NULL'
        if self.is_defined("askomics.endpoint_username") :
            user = self.get_param("askomics.endpoint_username")
        passwd = 'NULL'
        if self.is_defined("askomics.endpoint_passwd"):
            passwd = self.get_param("askomics.endpoint_passwd")
        auth = 'NULL'
        if self.is_defined("askomics.askomics.endpoint.auth"):
            auth = self.get_param("askomics.askomics.endpoint.auth")

        reqSql ="INSERT OR IGNORE INTO endpoints (id,name,url,user,passwd,auth,askomics) "+\
             "VALUES(1,'"+name+"'," \
             +"'"+url+"'," \
             +"'"+user+"'," \
             +"'"+passwd+"'," \
             +"'"+auth+"'," \
             + "1 )"

        c.execute(reqSql)
        conn.commit()
        #test
        reqSql = '''
        INSERT OR IGNORE INTO endpoints (id,name,url,user,passwd,auth,askomics)
        VALUES(2,'Askomics-Regine','http://openstack-192-168-100-46.genouest.org/virtuoso/sparql','NULL','NULL','NULL',1 )
        '''

        c.execute(reqSql)
        conn.commit()
        conn.close()

    def saveEndpoint(self,name,url,isAskomics,user=None,passwd=None,auth=None):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        if not user:
            user = 'NULL'
        if not passwd:
            passwd = 'NULL'
        if not auth:
            auth = 'NULL'
        askomics = '0'
        if isAskomics:
            askomics = '1'

        reqSql = "INSERT INTO endpoints VALUES ("\
                + "NULL,"     \
                +"'"+name+"'," \
                +"'"+url+"'," \
                +"'"+user+"'," \
                +"'"+passwd+"'," \
                +"'"+auth+"'," \
                +"'"+askomics+"'" \
                + ");"

        c.execute(reqSql)
        ID = c.lastrowid

        conn.commit()
        conn.close()
        return ID

    def updateEndpoint(self,id,name,url,isAskomics,user=None,passwd=None,auth=None):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        if not user:
            user = 'NULL'
        if not passwd:
            passwd = 'NULL'
        if not auth:
            auth = 'NULL'
        askomics = '0'
        if isAskomics:
            askomics = '1'

        reqSql = "UPDATE endpoints SET "\
                + " name = '"+ name +"'," \
                + " url = '"+ url +"'," \
                + " user = '"+ user +"'," \
                + " passwd = '"+ passwd +"'," \
                + " auth = '"+ auth +"'," \
                + " askomics = '"+ askomics +"'" \
                + " WHERE id = "+str(id)

        c.execute(reqSql)
        conn.commit()
        conn.close()


    def listEndpoints(self):
        data = []
        try:
            conn = sqlite3.connect(self.pathdb,uri=True)
            conn.row_factory = sqlite3.Row

            c = conn.cursor()

            reqSql = """ SELECT name, url, user, passwd, auth, askomics FROM endpoints"""

            c.execute(reqSql)
            rows = c.fetchall()

            for row in rows:
                d = {}
                d['name'] = row['name']
                d['endpoint'] = row['url']
                if row['user'] != None and row['user'] != 'NULL':
                    d['user'] = row['user']
                if row['passwd'] != None and row['passwd'] != 'NULL' :
                    d['passwd'] = row['passwd']
                if row['auth'] != None and row['auth'] != 'NULL' :
                    d['auth'] = row['auth']
                d['askomics'] = (row['askomics'] == '1')

                data.append(d)

        except sqlite3.OperationalError as e :
            self.log.info("Endpoints database does not exist .")


        c.execute(reqSql)
        conn.commit()
        conn.close()
        return data

    def removeJob(self,id):
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
