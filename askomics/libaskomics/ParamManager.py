import os.path
import re
import requests
import json

class ParamManager(object):
    """
        Manage static file and template sparql queries
    """
    def __init__(self, settings, session):
        # User parameters
        self.settings = settings
        self.session = session

        # Dev SPARQL files template
        # FIXME use a dict to store settings
        self.ASKOMICS_abstractionRelationUser = "abstractionRelationUserQuery.sparql"
        self.ASKOMICS_abstractionEntityUser = "abstractionEntityUserQuery.sparql"
        self.ASKOMICS_abstractionPositionableEntityUser = "abstractionPositionableEntityUserQuery.sparql"
        self.ASKOMICS_abstractionAttributesEntityUser = "abstractionAttributesEntityUserQuery.sparql"
        self.ASKOMICS_abstractionCategoriesEntityUser = "abstractionCategoriesEntityUserQuery.sparql"
        self.ASKOMICS_initial_query = "initialQuery.sparql"
        self.ASKOMICS_get_class_info_from_abstraction_queryFile = "getClassInfoFromAbstractionQuery.sparql"
        self.ASKOMICS_privateQueryTemplate = 'privateQueryTemplate.rq'
        self.ASKOMICS_publicQueryTemplate = 'publicQueryTemplate.rq'


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

        self.ASKOMICS_sparql_queries_dir = 'askomics/sparql/'
        self.ASKOMICS_html_template      = 'askomics/templates/integration.pt'
        self.ASKOMICS_ttl_directory      = 'askomics/ttl/' + self.session['username'] + '/'

    def get_template_sparql(self, sparql_file):
        sparql_template = self.ASKOMICS_sparql_queries_dir + sparql_file
        return sparql_template

    def get_source_file_directory(self):

        if 'upload_directory' not in self.session.keys():
            raise RuntimeError("Missing config key 'upload_directory'")

        return self.session["upload_directory"]

    def get_user_data_file(self, filename):

        return self.get_source_file_directory() + "/" + filename

    def get_ttl_directory(self):
        if not os.path.isdir(self.ASKOMICS_ttl_directory):
            os.makedirs(self.ASKOMICS_ttl_directory)
        return self.ASKOMICS_ttl_directory

    def get_param(self, key):
        return self.settings[key]

    def is_defined(self, key):
        return key in self.settings.keys()

    def updateListPrefix(self,listPrefix):
        self.log.info("updateListPrefix")
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
        obj = obj.replace(".", "_dot_")
        obj = obj.replace("-", "_sep_")
        return obj
