
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os.path
import re
import requests
import json
import tempfile
import logging
import urllib.parse

class ParamManager(object):
    """
        Manage static file and template sparql queries
    """
    def __init__(self, settings, session):
        self.log = logging.getLogger(__name__)
        # User parameters
        self.settings = settings
        self.session = session

        self.ASKOMICS_prefix = {
            "": self.get_param("askomics.prefix"),
            "askomics": self.get_param("askomics.namespace"),
            "xsd": """http://www.w3.org/2001/XMLSchema#""",
            "rdfs": """http://www.w3.org/2000/01/rdf-schema#""",
            "rdf": """http://www.w3.org/1999/02/22-rdf-syntax-ns#""",
            "rdfg": """http://www.w3.org/2004/03/trix/rdfg-1/""",
            "owl": """http://www.w3.org/2002/07/owl#""",
            "prov": """http://www.w3.org/ns/prov#""",
            "dc": """http://purl.org/dc/elements/1.1/""",
            "foaf": """http://xmlns.com/foaf/0.1/""",
            "faldo": """http://biohackathon.org/resource/faldo#"""
        }

        self.user_dir = self.get_param('askomics.files_dir') + '/'

        self.escape = {
            'numeric' : lambda str,str2: str,
            'text'    : lambda str,str2: json.dumps(str),
            'category': self.encode_to_rdf_uri,
            'taxon': self.encode_to_rdf_uri,
            'ref': self.encode_to_rdf_uri,
            'strand': self.encode_to_rdf_uri,
            'start' : lambda str,str2: str,
            'end' : lambda str,str2: str,
            'entity'  : self.encode_to_rdf_uri,
            'entitySym'  : self.encode_to_rdf_uri,
            'entity_start'  : self.encode_to_rdf_uri,
            'goterm': lambda str,str2: str.replace("GO:", ""),
            'date': lambda str,str2: json.dumps(str)
            }

    def get_directory(self, name):
        """Get a named directory of a user, create it if not exist"""

        if 'username' not in self.session:
            mdir = self.user_dir + '_guest/' + name + '/'
        else:
            mdir = self.user_dir + self.session['username'] + '/' + name + '/'
        if not os.path.isdir(mdir):
            os.makedirs(mdir)

        return mdir


    def get_upload_directory(self):
        """Get the upload directory of a user, create it if not exist

        :returns: The path of the user upload directory
        :rtype: string
        """

        return self.get_directory('upload')


    def get_user_csv_directory(self):

        return self.get_directory('result')

    def get_rdf_directory(self):

        mdir = self.user_dir+"rdf/"
        if not os.path.isdir(mdir):
            os.makedirs(mdir)

        return mdir

    def get_rdf_user_directory(self):

        return self.get_directory('rdf')

    def set_param(self, key,value):
        self.settings[key] = value

    def get_param(self, key):
        if key in self.settings:
            return self.settings[key]
        else:
            return ''

    def is_defined(self, key):
        return key in self.settings.keys()

    def update_list_prefix(self,listPrefix):
        self.log.debug("update_list_prefix")
        listPrefix = list(set(listPrefix))

        lPrefix = {}
        url = "http://prefix.cc/"
        ext = ".file.json"

        for item in listPrefix:
            if not (item in self.ASKOMICS_prefix):
                response = requests.get(url+item+ext)
                if response.status_code != 200:
                    self.log.error("request:"+str(url+item+ext))
                    self.log.error("status_code:"+str(response.status_code))
                    self.log.error(response)
                    continue
                dic = json.loads(response.text)
                self.ASKOMICS_prefix[item]=dic[item]
                self.log.info("add prefix:"+str(item)+":"+self.ASKOMICS_prefix[item])

    def reverse_prefix(self,uri):
        url = "http://prefix.cc/reverse?format=json&uri="

        for prefix in self.ASKOMICS_prefix:
            if uri.startswith(self.ASKOMICS_prefix[prefix]):
                return prefix

        response = requests.get(url+uri)
        if response.status_code != 200:
            self.log.error("request:"+str(url+uri))
            self.log.error("status_code:"+str(response.status_code))
            self.log.error(response)
            self.ASKOMICS_prefix[uri]=uri
            return ""

        dic = json.loads(response.text)
        if (len(dic)>0):
            v = list(dic.values())[0]
            k = list(dic.keys())[0]
            self.ASKOMICS_prefix[k]=v
            self.log.info("add prefix:"+str(k)+":"+self.ASKOMICS_prefix[k])
            return k

        return uri

    def header_sparql_config(self,sparqlrequest):
        header = ""
        regex = re.compile('\s(\w+):')
        listTermPref = regex.findall(sparqlrequest)
        self.update_list_prefix(listTermPref)

        for key, value in self.ASKOMICS_prefix.items():
            header += "PREFIX "+key+": <"+value+">\n"

        return header

    def remove_prefix(self, obj):
        for key, value in self.ASKOMICS_prefix.items():
            new = key
            if new:
                new += ":" # if empty prefix, no need for a :
            obj = obj.replace(value, new)

        return obj

    def get_turtle_template(self,ttl):

        #add new prefix if needed
        if ttl == None:
            raise ValueError("Turtle is empty.")

        regex = re.compile('\s(\w+):')
        listTermPref = regex.findall(ttl)
        self.update_list_prefix(listTermPref)

        header = ["@prefix {0}: <{1}> .".format(k,v) for k,v in self.ASKOMICS_prefix.items() ]

        asko_prefix = self.get_param("askomics.prefix")
        header.append("@base <{0}> .".format(asko_prefix))
        header.append("<{0}> rdf:type owl:Ontology .".format(asko_prefix))
        return '\n'.join(header)

    @staticmethod
    def encode(toencode):

        obj = urllib.parse.quote(toencode)
        obj = obj.replace("'", "_qu_")
        obj = obj.replace(".", "_d_")
        obj = obj.replace("-", "_t_")
        obj = obj.replace(":", "_s1_")
        obj = obj.replace("/", "_s2_")
        obj = obj.replace("%", "_s3_")

        return obj

    @staticmethod
    def encode_to_rdf_uri(toencode,prefix=None):

        if toencode.startswith("<") and toencode.endswith(">"):
            return toencode

        idx = toencode.find(":")
        if idx > -1:
            return toencode[:idx+1]+ParamManager.encode(toencode[idx+1:])

        pref = ":"
        suf  = ""
        if prefix:
            prefix = prefix.strip()
            if prefix[len(prefix)-1] == ":":
                pref = prefix
            elif prefix.startswith("<") and prefix.endswith(">"):
                pref = prefix[:len(prefix)-1]
                suf  = ">"
            else:
                pref = "<" + prefix
                suf  = ">"

        v = pref+ParamManager.encode(toencode)+suf
        return v

    @staticmethod
    def decode(toencode):

        obj = toencode.replace("_d_", ".")
        obj = obj.replace("_t_", "-")
        obj = obj.replace("_s1_", ":")
        obj = obj.replace("_s2_","/")
        obj = obj.replace("_s3_","%")
        obj = obj.replace("_qu_","'")

        obj = urllib.parse.unquote(obj)

        return obj


    @staticmethod
    def decode_to_rdf_uri(todecode, prefix=""):

        obj = todecode.strip()

        if obj.startswith("<") and obj.endswith(">"):
            obj = obj[1:len(obj)-1]
            if prefix != "":
                obj = obj.replace(prefix,"")

        idx = obj.find(":")
        if idx > -1 :
            obj = obj[idx+1:]

        return ParamManager.decode(obj)

    @staticmethod
    def Bool(result):

        if type(result) != str:
            raise ValueError("Can not convert string to boolean : "+str(result))

        if result.lower() == 'false':
            return False

        if result.lower() == 'true':
            return True

        if result.isdigit():
            return bool(int(result))

    def send_mails(self, host_url, dests, subject, text):
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        """
        Send a mail to a list of Recipients
        """
        self.log.debug(" == Security.py:send_mails == ")
        # Don't send mail if the smtp server is not in
        # the config file
        if not self.get_param('askomics.smtp_host'):
            return
        if not self.get_param('askomics.smtp_port'):
            return
        if not self.get_param('askomics.smtp_login'):
            return
        if not self.get_param('askomics.smtp_password'):
            return
        starttls = False
        if self.get_param('askomics.smtp_starttls'):
            starttls = self.get_param('askomics.smtp_starttls').lower() == 'yes' or \
                       self.get_param('askomics.smtp_starttls').lower() == 'ok' or \
                       self.get_param('askomics.smtp_starttls').lower() == 'true'

        host = self.get_param('askomics.smtp_host')
        port = self.get_param('askomics.smtp_port')
        login = self.get_param('askomics.smtp_login')
        password = self.get_param('askomics.smtp_password')

        msg = MIMEMultipart()
        msg['From'] = 'AskoMics@'+host_url
        msg['To'] = ", ".join(dests)
        msg['Subject'] = subject
        msg.attach(MIMEText(text, 'plain'))

        try:
            smtp = smtplib.SMTP(host, port)
            smtp.set_debuglevel(1)
            if starttls:
                smtp.ehlo()
                askomics.smtp_starttls()
            askomics.smtp_login(login, password)
            smtp.sendmail(dests[0], dests, msg.as_string())
            smtp.quit()
            self.log.debug("Successfully sent email")
        except Exception as e:
            self.log.debug("Error: unable to send email: " + str(e))
