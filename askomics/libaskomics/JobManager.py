from askomics.libaskomics.ParamManager import ParamManager

import logging
import tempfile,sqlite3

class JobManager(ParamManager):
    """
        Manage Askomics jobs inside a sqlite database
    """
    def __init__(self, settings, session):
        self.log = logging.getLogger(__name__)
        self.databasename = "jobs_test.db"
        self.pathdb = "file:"+tempfile.gettempdir() + "/" + \
                      session['username'] + \
                      self.databasename

        self.log.info(" ==> "+ self.pathdb +"<==");

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()
        reqSql = '''CREATE TABLE IF NOT EXISTS jobs
             (
             jobID INTEGER PRIMARY KEY AUTOINCREMENT,
             type text,
             state text,
             start int,
             end int ,
             data text,
             file text,
             preview string,
             requestGraph string,
             nr int
             )'''

        c.execute(reqSql)
        conn.commit()
        conn.close()

    def deljob(self,jobid):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()
        reqSql = "DELETE FROM jobs WHERE jobid = "+ str(jobid)
        c.execute(reqSql)
        conn.commit()
        conn.close()

    def saveStartSparqlJob(self,typeJob,requestGraph=""):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        reqSql = "INSERT INTO jobs VALUES ("\
                + "NULL,"     \
                +"'"+typeJob+"'," \
                + "'Wait',"     \
                + "strftime('%s','now'),"\
                + "0,"\
                + "NULL,"\
                + "''," \
                + "''," \
                + "'"+requestGraph+"'," \
                + "-1" \
                + ");"

        c.execute(reqSql)
        ID = c.lastrowid

        conn.commit()
        conn.close()
        return ID

    def updateEndSparqlJob(self,jobid,state,nr=-1, data=None, file=None):
        import json

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        d = 'NULL'

        if data:
            d = "'"+json.dumps(data)+"'"

        f = 'NULL'
        if file:
            f = "'"+file+"'"

        reqSql = "UPDATE jobs SET "\
                + " state = '"+ state +"'," \
                + " end = strftime('%s','now'),"\
                + " nr = "+str(nr)+","\
                + " data = "+ d +"," \
                + " file = "+ f \
                + " WHERE jobID = "+str(jobid)
        print(reqSql)
        c.execute(reqSql)
        conn.commit()
        conn.close()

    def updatePreviewJob(self,jobid,preview):

        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()
        preview = preview.replace("'","&#39;")

        reqSql = "UPDATE jobs SET "\
                + "preview = '" + preview +"'"\
                + " WHERE jobID = "+str(jobid)


        c.execute(reqSql)
        conn.commit()
        conn.close()


    def listJobs(self):
        import json

        data = []
        conn = sqlite3.connect(self.pathdb,uri=True)
        conn.row_factory = sqlite3.Row

        c = conn.cursor()

        reqSql = """ SELECT jobid, type, state, start, end, data, file, preview, requestGraph, nr FROM jobs"""
        try:
            c.execute(reqSql)
            rows = c.fetchall()

            for row in rows:
                d = {}
                d['jobid'] = row['jobid']
                d['type'] = row['type']
                d['state'] = row['state']
                d['start'] = row['start']
                d['end'] = row['end']
                if row['data'] != None :
                    d['data'] = json.loads(row['data'])
                if row['file'] != None :
                    d['file'] = row['file']
                d['preview'] = row['preview']
                d['requestGraph'] = row['requestGraph']
                d['nr'] = row['nr']

                data.append(d)

        except sqlite3.OperationalError as e :
            self.log.info("Jobs database does not exist .")


        c.execute(reqSql)
        conn.commit()
        conn.close()
        return data

    def removeJob(self,jobid):
        conn = sqlite3.connect(self.pathdb,uri=True)
        c = conn.cursor()

        reqSql = "DELETE FROM jobs WHERE jobid = "+ str(jobid)

        try:
            c.execute(reqSql)
            conn.commit()
        except sqlite3.OperationalError as e :
            self.log.info("Jobs database does not exist .")

        conn.close()
