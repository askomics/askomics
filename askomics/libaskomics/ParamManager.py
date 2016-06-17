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
        self.ASKOMICS_abstractionRelationUser = "abstractionRelationUserQuery.sparql"
        self.ASKOMICS_abstractionEntityUser = "abstractionEntityUserQuery.sparql"
        self.ASKOMICS_abstractionAttributesEntityUser = "abstractionAttributesEntityUserQuery.sparql"
        self.ASKOMICS_abstractionCategoriesEntityUser = "abstractionCategoriesEntityUserQuery.sparql"
        self.ASKOMICS_neighbor_query_following_shortcuts_file = "neighborQueryFollowingShortcuts.sparql"
        self.ASKOMICS_setting_query_file = "settingQuery.sparql"
        self.ASKOMICS_has_category_query_file = "hasCategoryQuery.sparql"
        self.ASKOMICS_initial_query = "initialQuery.sparql"
        self.ASKOMICS_get_class_info_from_abstraction_queryFile = "getClassInfoFromAbstractionQuery.sparql"

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

    def remove_prefix(self, obj):
        for key, value in self.ASKOMICS_prefix.items():
            new = key
            if new:
                new += ":" # if empty prefix, no need for a :
            obj = obj.replace(value, new)

        return obj

    def get_turtle_template(self):
        header = ["@prefix %s: <%s> ." % item
                           for item in self.ASKOMICS_prefix.items()]
        asko_prefix = self.get_param("askomics.prefix")
        header.append("@base <%s> ." % asko_prefix)
        header.append("<%s> rdf:type owl:Ontology ." % asko_prefix)
        return '\n'.join(header)
