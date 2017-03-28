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
                                "dc": """http://purl.org/dc/elements/1.1/"""
                                }

        self.userfilesdir='askomics/static/results/'
        if not 'user.files.dir' in self.settings:
            self.log.warning(" ******* 'user.files.dir' is not defined ! ********* \n Csv are saved in "+self.userfilesdir)
        else:
            self.userfilesdir=self.settings['user.files.dir']+"/"

        self.ASKOMICS_html_template      = 'askomics/templates/integration.pt'

        self.escape = {
            'numeric' : lambda str: str,
            'text'    : json.dumps,
            'category': self.encodeToRDFURI,
            'taxon': lambda str: str,
            'ref': lambda str: str,
            'strand': lambda str: str,
            'start' : lambda str: str,
            'end' : lambda str: str,
            'entity'  : self.encodeToRDFURI,
            'entitySym'  : self.encodeToRDFURI,
            'entity_start'  : self.encodeToRDFURI,
            'goterm': lambda str: str.replace("GO:", "")
            }


    def get_user_directory(self,typ):
        mdir = self.userfilesdir+typ+"/"+self.session['username'] + '/'
        if not os.path.isdir(mdir):
            os.makedirs(mdir)

        return mdir

    def getUploadDirectory(self):
        dir_string = '__' + self.session['username'] + '__'
        if 'upload_directory' not in self.session.keys() or dir_string not in self.session['upload_directory'] or not os.path.isdir(self.session['upload_directory']):
            self.session['upload_directory'] = tempfile.mkdtemp(suffix='_tmp', prefix='__' + self.session['username'] + '__')

        self.log.debug('--- upload dir ---')
        self.log.debug(self.session['upload_directory'])
        return self.session['upload_directory']

    def getResultsCsvDirectory(self):
        return self.get_user_directory("csv")

    def getRdfDirectory(self):
        return self.get_user_directory("rdf")

    def get_param(self, key):
        if key in self.settings:
            return self.settings[key]
        else:
            return ''

    def is_defined(self, key):
        return key in self.settings.keys()

    def updateListPrefix(self,listPrefix):
        self.log.info("updateListPrefix")
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

    def reversePrefix(self,uri):
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
        self.updateListPrefix(listTermPref)

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
        self.updateListPrefix(listTermPref)

        header = ["@prefix {0}: <{1}> .".format(k,v) for k,v in self.ASKOMICS_prefix.items() ]

        asko_prefix = self.get_param("askomics.prefix")
        header.append("@base <{0}> .".format(asko_prefix))
        header.append("<{0}> rdf:type owl:Ontology .".format(asko_prefix))
        return '\n'.join(header)

    @staticmethod
    def encodeToRDFURI(toencode):
        import urllib.parse

        obj = urllib.parse.quote(toencode)
        obj = obj.replace(".", "_d_")
        obj = obj.replace("-", "_t_")
        obj = obj.replace(":", "_s1_")
        obj = obj.replace("/", "_s2_")
        obj = obj.replace("%", "_s3_")

        return obj

    @staticmethod
    def decodeToRDFURI(toencode):
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
