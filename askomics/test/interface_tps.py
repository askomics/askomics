"""Contain InterfaceTps class"""

from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.SparqlQueryGraph import SparqlQueryGraph
from askomics.libaskomics.rdfdb.SparqlQueryAuth import SparqlQueryAuth
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.SourceFileConvertor import SourceFileConvertor

class InterfaceTPS(object):
    """Allow communication with the triplestore
    
    This class allow the communication with the triplestore
    during the tests
    """


    def __init__(self, settings, request):
        """constructor
        
        :param settings: settings dicct
        :type settings: dict
        :param request: pyramid request dict
        :type request: dict
        """

        self.settings = settings
        self.request = request

    def empty(self):
        """Delete all test data

        Get the list of all public and private graphs and delete them
        """

        sqb = SparqlQueryGraph(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)
        private_graphs = self.list_private_graphs()
        public_graphs = self.list_public_graphs()

        for graph in private_graphs:
            query_laucher.execute_query(sqb.get_delete_query_string(graph).query)

        for graph in public_graphs:
            query_laucher.execute_query(sqb.get_delete_query_string(graph).query)

    def list_private_graphs(self):
        """List the private graphs

        :returns: decription of the private graphs
        :rtype: dict
        """

        sqb = SparqlQueryGraph(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)

        res = query_laucher.execute_query(sqb.get_private_graphs().query)

        named_graphs = []

        for index_result in range(len(res['results']['bindings'])):
            named_graphs.append(res['results']['bindings'][index_result]['g']['value'])

        return named_graphs

    def list_public_graphs(self):
        """list the public graphs
        
        :returns: description of the public graph
        :rtype: dict
        """

        sqb = SparqlQueryGraph(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)

        res = query_laucher.execute_query(sqb.get_public_graphs().query)

        named_graphs = []

        for index_result in range(len(res['results']['bindings'])):
            named_graphs.append(res['results']['bindings'][index_result]['g']['value'])

        return named_graphs

    def load_file(self, file, col_types, public=False):
        """Load a file into the triplestore

        :param file: name of the file without extention
        :type file: string
        :param col_types: type of the column
        :type col_types: list
        :param public: insert in public graph, defaults to False
        :type public: bool, optional
        :returns: the timestamp associated with the graph
        :rtype: string
        """

        disabled_columns = []

        sfc = SourceFileConvertor(self.settings, self.request.session)

        src_file = sfc.get_source_file(file)

        src_file.set_forced_column_types(col_types)
        src_file.set_disabled_columns(disabled_columns)
        src_file.persist('', 'noload', public)

        return src_file.get_timestamp()

    def load_people(self):
        """Load the file people.tsv
        
        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'text', 'text', 'category', 'numeric']
        return self.load_file("people.tsv", col_types)

    def load_instruments(self):
        """Load the file instruments.tsv
        
        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'text', 'category']
        return self.load_file("instruments.tsv", col_types)

    def load_play_instrument(self):
        """Load the file play_instruments.tsv
        
        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'entity', 'category']
        return self.load_file("play_instrument.tsv", col_types)

    def load_public_people(self):
        """Load the file people.tsv as public data
        
        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'text', 'text', 'category', 'numeric']
        return self.load_file("people.tsv", col_types, True)

    def load_transcript(self):
        """Load the file transcript.tsv
        
        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'taxon', 'ref', 'start', 'end', 'strand', 'category']
        return self.load_file("transcript.tsv", col_types)

    def load_qtl(self):
        """Load the file qtl.tsv
        
        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'taxon', 'ref', 'start', 'end']
        return self.load_file("qtl.tsv", col_types)

    def clean_up(self):
        """Delete all tests data
        
        Delete the users graph and all public and private
        data used for the tests
        """

        # Delete all data
        self.empty()

        # Delete users
        self.delete_users()

        # Delete askomics graph
        self.delete_askograph()


    def delete_users(self):
        """Delete the test users graph"""

        sqb = SparqlQueryGraph(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)

        query_laucher.execute_query(sqb.get_drop_named_graph('urn:sparql:test_askomics:users').query)

    def delete_askograph(self):
        """Delete the askomics graph"""

        sqb = SparqlQueryGraph(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)

        query_laucher.execute_query(sqb.get_drop_named_graph('urn:sparql:test_askomics').query)


    def add_jdoe_in_users(self):
        """Insert a John Doe User

        username is jdoe
        mail is jdoe@example.com
        password is iamjohndoe
        not admin and not blocked
        """

        query_laucher = QueryLauncher(self.settings, self.request.session)
        sqa = SparqlQueryAuth(self.settings, self.request.session)
        chunk = ':jdoe rdf:type foaf:Person ;\n'
        indent = len('jdoe') * ' ' + ' '
        chunk += indent + 'foaf:name \"jdoe\" ;\n'
        chunk += indent + ':password \"23df582b51c3482b677c8eac54872b8bd0a49bfadc853628b8b8bd4806147b54\" ;\n' #iamjohndoe
        chunk += indent + 'foaf:mbox <mailto:jdoe@example.com> ;\n'
        chunk += indent + ':isadmin \"false\"^^xsd:boolean ;\n'
        chunk += indent + ':isblocked \"false\"^^xsd:boolean ;\n'
        chunk += indent + ':randomsalt \"00000000000000000000\" .\n'

        header_ttl = sqa.header_sparql_config(chunk)
        query_laucher.insert_data(chunk, 'urn:sparql:test_askomics:users', header_ttl)

    def add_jsmith_in_users(self):
        """Insert a Jane Smith User

        username is jsmith
        mail is jsmith@example.com
        password is iamjanesmith
        not admin and not blocked
        """

        query_laucher = QueryLauncher(self.settings, self.request.session)
        sqa = SparqlQueryAuth(self.settings, self.request.session)
        chunk = ':jsmith rdf:type foaf:Person ;\n'
        indent = len('jsmith') * ' ' + ' '
        chunk += indent + 'foaf:name \"jsmith\" ;\n'
        chunk += indent + ':password \"db64872417dcc1488a72b034cbe75268f52eb2486807af096dd2f4c620694efc\" ;\n' #iamjanesmith
        chunk += indent + 'foaf:mbox <mailto:jsmith@example.com> ;\n'
        chunk += indent + ':isadmin \"false\"^^xsd:boolean ;\n'
        chunk += indent + ':isblocked \"false\"^^xsd:boolean ;\n'
        chunk += indent + ':randomsalt \"00000000000000000000\" .\n'

        header_ttl = sqa.header_sparql_config(chunk)
        query_laucher.insert_data(chunk, 'urn:sparql:test_askomics:users', header_ttl)

    def add_admin_in_users(self):
        """Insert an admin User

        username is admin
        mail is admin@example.com
        password is iamadmin
        admin and not blocked
        """

        query_laucher = QueryLauncher(self.settings, self.request.session)
        sqa = SparqlQueryAuth(self.settings, self.request.session)
        chunk = ':admin rdf:type foaf:Person ;\n'
        indent = len('admin') * ' ' + ' '
        chunk += indent + 'foaf:name \"admin\" ;\n'
        chunk += indent + ':password \"682cf6a90d94758bdedcf854e8d784e3d5d360a36cd65a2c49eaff214998c23a\" ;\n' #iamadmin
        chunk += indent + 'foaf:mbox <mailto:admin@example.com> ;\n'
        chunk += indent + ':isadmin \"true\"^^xsd:boolean ;\n'
        chunk += indent + ':isblocked \"false\"^^xsd:boolean ;\n'
        chunk += indent + ':randomsalt \"00000000000000000000\" .\n'

        header_ttl = sqa.header_sparql_config(chunk)
        query_laucher.insert_data(chunk, 'urn:sparql:test_askomics:users', header_ttl)

    def add_another_admin_in_users(self):
        """Insert an admin User

        username is otheradmin
        mail is otheradmin@example.com
        password is iamadmin
        admin and not blocked
        """

        query_laucher = QueryLauncher(self.settings, self.request.session)
        sqa = SparqlQueryAuth(self.settings, self.request.session)
        chunk = ':otheradmin rdf:type foaf:Person ;\n'
        indent = len('otheradmin') * ' ' + ' '
        chunk += indent + 'foaf:name \"otheradmin\" ;\n'
        chunk += indent + ':password \"682cf6a90d94758bdedcf854e8d784e3d5d360a36cd65a2c49eaff214998c23a\" ;\n' #iamadmin
        chunk += indent + 'foaf:mbox <mailto:otheradmin@example.com> ;\n'
        chunk += indent + ':isadmin \"true\"^^xsd:boolean ;\n'
        chunk += indent + ':isblocked \"false\"^^xsd:boolean ;\n'
        chunk += indent + ':randomsalt \"00000000000000000000\" .\n'

        header_ttl = sqa.header_sparql_config(chunk)
        query_laucher.insert_data(chunk, 'urn:sparql:test_askomics:users', header_ttl)

    def test_triple_presence(self, graph, triple):
        """Test the presence of a triple in the triplestore

        get if a triple is present in a specific graph of the triplestore
        :param graph: the named graph
        :type graph: string
        :param triple: the triple to test
        :type triple: string
        :returns: Result of the test
        :rtype: bool
        """

        sqb = SparqlQueryGraph(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)


        query = sqb.prepare_query("""
            SELECT count(*) AS ?count
            WHERE {
                GRAPH <""" + graph + """> {
                    """ + triple + """ .
                }
            }
            """)

        res = query_laucher.execute_query(query.query)

        print(bool(int(res['results']['bindings'][0]['count']['value'])))

        return bool(int(res['results']['bindings'][0]['count']['value']))
