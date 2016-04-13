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
        self.ASKOMICS_neighbor_query_file = "neighborHierarchyQuery.sparql"
        self.ASKOMICS_neighbor_query_following_shortcuts_file = "neighborQueryFollowingShortcuts.sparql"
        self.ASKOMICS_setting_query_file = "settingQuery.sparql"
        self.ASKOMICS_has_category_query_file = "hasCategoryQuery.sparql"
        self.ASKOMICS_initial_query = "initialQuery.sparql"
        self.ASKOMICS_get_class_info_from_abstraction_queryFile = "getClassInfoFromAbstractionQuery.sparql"
        self.ASKOMICS_insert_data_query = "InsertDataQuery.sparql"

        self.ASKOMICS_prefix = {"": self.get_param("askomics.prefix"),
                                "displaySetting": self.get_param("askomics.display_setting"),
                                "xsd": """http://www.w3.org/2001/XMLSchema#""",
                                "rdfs": """http://www.w3.org/2000/01/rdf-schema#""",
                                "rdf": """http://www.w3.org/1999/02/22-rdf-syntax-ns#""",
                                "owl": """http://www.w3.org/2002/07/owl#"""}

        self.ASKOMICS_sparql_queries_dir = 'askomics/sparql/'

        self.ASKOMICS_html_template = 'askomics/templates/integration.pt'

    def get_template_sparql(self, sparql_file):
        sparql_template = self.ASKOMICS_sparql_queries_dir + sparql_file
        return sparql_template

    def get_source_file_directory(self):

        if 'upload_directory' not in self.session.keys():
            raise RuntimeError("Missing config key 'upload_directory'")

        return self.session["upload_directory"]

    def get_user_data_file(self, filename):

        return self.get_source_file_directory() + "/" + filename

    def get_param(self, key):
        return self.settings[key]

    def is_defined(self, key):
        return key in self.settings.keys()

    def header_sparql_config(self):
        header = ""

        for key, value in self.ASKOMICS_prefix.items():
            header += "PREFIX "+key+": <"+value+">\n"

        return header

    def header_ttl_config(self):
        header = ""

        for key, value in self.ASKOMICS_prefix.items():
            header += "@prefix "+key+": <"+value+"> .\n"

        header += "\n"

        return header

    def remove_prefix(self, obj):
        for key, value in self.ASKOMICS_prefix.items():
            new = key
            if new:
                new += ":" # if empty prefix, no need for a :
            obj = obj.replace(value, new)

        return obj

    def turtle_template(self):
        header = ""

        for key, value in self.ASKOMICS_prefix.items():
            header += "@prefix "+key+":<"+value+"> .\n"

        header += "@base" +"<"+self.get_param("askomics.prefix")+"> .\n"
        header += "<" + self.get_param("askomics.prefix")+" rdf:type owl:Ontology .\n"
        header += "\n"
        header += "## Individuals\n"

        return header
