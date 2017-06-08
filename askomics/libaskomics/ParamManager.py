
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os.path
import re
import requests
import json
import tempfile
import logging

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
            "displaySetting": self.get_param("askomics.display_setting"),
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

        self.userfilesdir = self.get_param('askomics.files_dir') + '/'

        self.escape = {
            'numeric' : lambda str: str,
            'text'    : json.dumps,
            'category': self.encode_to_rdf_uri,
            'taxon': lambda str: str,
            'ref': lambda str: str,
            'strand': lambda str: str,
            'start' : lambda str: str,
            'end' : lambda str: str,
            'entity'  : self.encode_to_rdf_uri,
            'entitySym'  : self.encode_to_rdf_uri,
            'entity_start'  : self.encode_to_rdf_uri,
            'goterm': lambda str: str.replace("GO:", "")
            }

    def get_upload_directory(self):
        """Get the upload directory of a user, create it if not exist

        :returns: The path of the user upload directory
        :rtype: string
        """

        path = self.userfilesdir + 'upload/' + self.session['username'] + '/'
        if not os.path.isdir(path):
            os.makedirs(path)
        return path

    def get_user_csv_directory(self):
        mdir = self.userfilesdir+"csv"+"/"+self.session['username'] + '/'
        if not os.path.isdir(mdir):
            os.makedirs(mdir)
        return mdir

    def get_rdf_directory(self):
        return self.userfilesdir+"rdf/"

    def get_rdf_user_directory(self):
        mdir = self.userfilesdir+"rdf"+"/"+self.session['username'] + '/'
        if not os.path.isdir(mdir):
            os.makedirs(mdir)
        return mdir

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
            print("URI..... uri:"+uri+" rec:"+self.ASKOMICS_prefix[prefix])
            if uri.startswith(self.ASKOMICS_prefix[prefix]):
                return prefix

        response = requests.get(url+uri)
        if response.status_code != 200:
            self.log.error("request:"+str(url+item+ext))
            self.log.error("status_code:"+str(response.status_code))
            self.log.error(response)
            self.ASKOMICS_prefix[uri]=uri
            return
        dic = json.loads(response.text)
        if (len(dic)>0):
            v = list(dic.values())[0]
            k = list(dic.keys())[0]
            self.ASKOMICS_prefix[k]=v
            self.log.info("add prefix:"+str(k)+":"+self.ASKOMICS_prefix[k])
            return k

        return uri

    def header_sparql_config(self,sarqlrequest):
        header = ""
        regex = re.compile('\s(\w+):')
        listTermPref = regex.findall(sarqlrequest)
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

        regex = re.compile('\s(\w+):')
        listTermPref = regex.findall(ttl)
        self.update_list_prefix(listTermPref)

        header = ["@prefix {0}: <{1}> .".format(k,v) for k,v in self.ASKOMICS_prefix.items() ]

        asko_prefix = self.get_param("askomics.prefix")
        header.append("@base <{0}> .".format(asko_prefix))
        header.append("<{0}> rdf:type owl:Ontology .".format(asko_prefix))
        return '\n'.join(header)

    @staticmethod
    def encode_to_rdf_uri(toencode):
        import urllib.parse

        obj = urllib.parse.quote(toencode)
        obj = obj.replace(".", "_d_")
        obj = obj.replace("-", "_t_")
        obj = obj.replace(":", "_s1_")
        obj = obj.replace("/", "_s2_")
        obj = obj.replace("%", "_s3_")

        return obj

    @staticmethod
    def decode_to_rdf_uri(toencode):
        import urllib.parse

        obj = toencode.replace("_d_", ".")
        obj = obj.replace("_t_", "-")
        obj = obj.replace("_s1_", ":")
        obj = obj.replace("_s2_","/")
        obj = obj.replace("_s3_","%")
        
        obj = urllib.parse.unquote(obj)

        return obj

    @staticmethod
    def Bool(result):

        if result.lower() == 'false':
            return False

        if result.lower() == 'true':
            return True

        if result.isdigit():
            return bool(int(result))

        raise ValueError("Can not convert string to boolean : "+str(result))

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
        if not self.get_param('smtp.host'):
            return
        if not self.get_param('smtp.port'):
            return
        if not self.get_param('smtp.login'):
            return
        if not self.get_param('smtp.password'):
            return
        starttls = False
        if self.get_param('smtp.starttls'):
            starttls = self.get_param('smtp.starttls').lower() == 'yes' or \
                       self.get_param('smtp.starttls').lower() == 'ok' or \
                       self.get_param('smtp.starttls').lower() == 'true'

        host = self.get_param('smtp.host')
        port = self.get_param('smtp.port')
        login = self.get_param('smtp.login')
        password = self.get_param('smtp.password')

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
                smtp.starttls()
            smtp.login(login, password)
            smtp.sendmail(dests[0], dests, msg.as_string())
            smtp.quit()
            self.log.debug("Successfully sent email")
        except Exception as e:
            self.log.debug("Error: unable to send email: " + str(e))