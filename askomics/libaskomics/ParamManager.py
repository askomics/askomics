
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

    def get_user_dir_path(self, force_username=None):

        if force_username:
            username = force_username
        elif 'username' in self.session:
            username = self.session['username']
        else:
            username = '_guest'

        return self.user_dir + username

    def get_directory(self, name, force_username=None):
        """Get a named directory of a user, create it if not exist"""

        if force_username:
            username = force_username
        elif 'username' in self.session:
            username = self.session['username']
        else:
            username = '_guest'

        mdir = self.user_dir + username + '/' + name + '/'

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
        self.log.warn("Deprecated, use __update_askomics_prefixes instead")
        self.__update_askomics_prefixes(listPrefix)

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

    def get_sparql_prefixes(self,sparqlrequest):
        # SLETORT: should be almost identical to get_turtle_prefixes,
        # SLETORT:   and also elsewhere (but this one is used by more classes)
        # SLETORT: why returning all askomics prefixes ? we only need those from the request.
        header = ""
        regex = re.compile('\s(\w+):')
        listTermPref = regex.findall(sparqlrequest)
        self.__update_askomics_prefixes(listTermPref)

        for key, value in self.ASKOMICS_prefix.items():
            header += "PREFIX "+key+": <"+value+">\n"

        return header

    def header_sparql_config(self,sparqlrequest):
        self.log.warn( "deprecated, use get_sparql_prefixes" )
        return self.get_sparql_prefixes(sparqlrequest)

    def remove_prefix(self, obj):
        for key, value in self.ASKOMICS_prefix.items():
            new = key
            if new:
                new += ":" # if empty prefix, no need for a :
            obj = obj.replace(value, new)

        return obj

    def __update_askomics_prefixes(self,l_prefixes):
        """removes duplicates,
            if the prefix is public, add it to ASKOMICS_prefix
            else log it."""
        self.log.debug("update_prefixes")
        l_prefixes = list(set(l_prefixes)) # remove duplicates

        url = "http://prefix.cc/"
        ext = ".file.json"

        for prefix in l_prefixes:
            if not prefix in self.ASKOMICS_prefix:
                # check that prefix correspond to public ontology
                prefix_url = url + prefix + ext
                response = requests.get(prefix_url)
                if response.status_code != 200:
                    self.log.error("request:"+str(prefix_url))
                    self.log.error("status_code:"+str(response.status_code))
                    self.log.error(response)
                    continue
                dic = json.loads(response.text)
                self.ASKOMICS_prefix[prefix]=dic[prefix]
                msg = "add prefix:" + str(prefix) + ":" + self.ASKOMICS_prefix[prefix]
                self.log.info(msg)
    # __update_askomics_prefixes

    def get_turtle_template(self,ttl):
        self.log.warn("deprecatred use get_turtle_prefixes.")
        return self.get_turtle_prefixes(ttl)

    def get_turtle_prefixes(self,ttl):
        """Parse the ttl string, looking for prefix.
            add them to ASKOMICS_prefix if they exist.
            Then return the prefixes as ttl header."""
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

    def get_size(self, path):
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                total_size += os.path.getsize(fp)

        return total_size

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
