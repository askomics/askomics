"""Contain InterfaceTps class"""

from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.SparqlQueryGraph import SparqlQueryGraph
from askomics.libaskomics.rdfdb.SparqlQueryAuth import SparqlQueryAuth
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.SourceFileConvertor import SourceFileConvertor
from askomics.libaskomics.DatabaseConnector import DatabaseConnector

class InterfaceTpsDb(object):
    """Allow communication with the triplestore and the sql database

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
            query_laucher.process_query(sqb.get_delete_query_string(graph).query)

        for graph in public_graphs:
            query_laucher.process_query(sqb.get_delete_query_string(graph).query)

    def list_private_graphs(self):
        """List the private graphs

        :returns: decription of the private graphs
        :rtype: dict
        """

        sqb = SparqlQueryGraph(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)

        res = query_laucher.process_query(sqb.get_user_graph_infos_with_count().query)

        named_graphs = []

        for index_result in range(len(res)):
            named_graphs.append(res[index_result]['g'])

        return named_graphs

    def list_public_graphs(self):
        """list the public graphs

        :returns: description of the public graph
        :rtype: dict
        """

        sqb = SparqlQueryGraph(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)

        res = query_laucher.process_query(sqb.get_public_graphs().query)

        named_graphs = []
        print(res)
        for index_result in range(len(res)):
            named_graphs.append(res[index_result]['g'])

        return named_graphs

    def load_file(self, file, col_types, uri_set, public=False):
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

        src_file = sfc.get_source_files([file], uri_set=uri_set)[0]

        src_file.set_forced_column_types(col_types)
        src_file.set_disabled_columns(disabled_columns)
        src_file.set_param("askomics.upload_user_data_method",'insert')
        src_file.persist('', public)

        return src_file.get_timestamp()

    def load_people(self):
        """Load the file people.tsv

        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'text', 'text', 'category', 'numeric']
        uri_set = {'0': 'http://www.semanticweb.org/user/ontologies/2018/1#', '1': None, '2': None, '3': None, '4': None}
        return self.load_file("people.tsv", col_types, uri_set)

    def load_instruments(self):
        """Load the file instruments.tsv

        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'text', 'category']
        uri_set = {'0': 'http://www.semanticweb.org/user/ontologies/2018/1#', '1': None, '2': None}
        return self.load_file("instruments.tsv", col_types, uri_set)

    def load_play_instrument(self):
        """Load the file play_instruments.tsv

        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'entity', 'category']
        uri_set = {'0': 'http://www.semanticweb.org/user/ontologies/2018/1#', '1': None, '2': None}
        return self.load_file("play_instrument.tsv", col_types, uri_set)

    def load_public_people(self):
        """Load the file people.tsv as public data

        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'text', 'text', 'category', 'numeric']
        uri_set = {'0': 'http://www.semanticweb.org/user/ontologies/2018/1#', '1': None, '2': None, '3': None, '4': None}
        return self.load_file("people.tsv", col_types, uri_set, True)

    def load_transcript(self):
        """Load the file transcript.tsv

        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'taxon', 'ref', 'start', 'end', 'strand', 'category']
        uri_set = {'0': 'http://www.semanticweb.org/user/ontologies/2018/1#', '1': None, '2': None, '3': None, '4': None, '5': None, '6': None}
        return self.load_file("transcript.tsv", col_types, uri_set)

    def load_qtl(self):
        """Load the file qtl.tsv

        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'taxon', 'ref', 'start', 'end']
        uri_set = {'0': 'http://www.semanticweb.org/user/ontologies/2018/1#', '1': None, '2': None, '3': None, '4': None}
        return self.load_file("qtl.tsv", col_types, uri_set)

    def clean_up(self):
        """Delete all tests data

        Delete the users graph and all public and private
        data used for the tests
        """

        # Delete all data
        self.empty()

        # Delete users
        self.delete_users()
        self.clean_database()

        # Delete askomics graph
        self.delete_askograph()

    def clean_database(self):

        database = DatabaseConnector(self.settings, self.request.session)
        query = '''
        DROP TABLE IF EXISTS users
        '''
        database.execute_sql_query(query)

        query = '''
        DROP TABLE IF EXISTS galaxy_accounts
        '''
        database.execute_sql_query(query)

        query = '''
        DROP TABLE IF EXISTS integration
        '''
        database.execute_sql_query(query)

        query = '''
        DROP TABLE IF EXISTS query
        '''
        database.execute_sql_query(query)


    def delete_users(self):
        """Delete the test users graph"""

        sqb = SparqlQueryGraph(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)

        query_laucher.process_query(sqb.get_drop_named_graph('urn:sparql:test_askomics:users').query)

    def delete_askograph(self):
        """Delete the askomics graph"""

        sqb = SparqlQueryGraph(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)

        query_laucher.process_query(sqb.get_drop_named_graph('urn:sparql:test_askomics').query)


    def add_jdoe_in_users(self):
        """Insert a John Doe User

        username is jdoe
        mail is jdoe@example.com
        password is iamjohndoe
        not admin and not blocked
        """

        database = DatabaseConnector(self.settings, self.request.session)
        query='''
        INSERT INTO users VALUES(
            NULL,
            "jdoe",
            "jdoe@example.com",
            "23df582b51c3482b677c8eac54872b8bd0a49bfadc853628b8b8bd4806147b54",
            "00000000000000000000",
            "jdoe_apikey",
            "false",
            "false"
        )
        '''

        database.execute_sql_query(query)

    def add_jsmith_in_users(self):
        """Insert a Jane Smith User

        username is jsmith
        mail is jsmith@example.com
        password is iamjanesmith
        not admin and not blocked
        """

        database = DatabaseConnector(self.settings, self.request.session)
        query='''
        INSERT INTO users VALUES(
            NULL,
            "jsmith",
            "jsmith@example.com",
            "db64872417dcc1488a72b034cbe75268f52eb2486807af096dd2f4c620694efc",
            "00000000000000000000",
            "jsmith_apikey",
            "false",
            "false"
        )
        '''

        database.execute_sql_query(query)

    def add_admin_in_users(self):
        """Insert an admin User

        username is king
        mail is king@example.com
        password is iamadmin
        admin and not blocked
        """

        database = DatabaseConnector(self.settings, self.request.session)
        query='''
        INSERT INTO users VALUES(
            NULL,
            "king",
            "king@example.com",
            "682cf6a90d94758bdedcf854e8d784e3d5d360a36cd65a2c49eaff214998c23a",
            "00000000000000000000",
            "admin_apikey",
            "true",
            "false"
        )
        '''

        database.execute_sql_query(query)

    def add_another_admin_in_users(self):
        """Insert an admin User

        username is queen
        mail is queen@example.com
        password is iamadmin
        admin and not blocked
        """

        database = DatabaseConnector(self.settings, self.request.session)
        query='''
        INSERT INTO users VALUES(
            NULL,
            "queen",
            "queen@example.com",
            "682cf6a90d94758bdedcf854e8d784e3d5d360a36cd65a2c49eaff214998c23a",
            "00000000000000000000",
            "otheradmin_apikey",
            "true",
            "false"
        )
        '''

        database.execute_sql_query(query)

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

        res = query_laucher.process_query(query.query)

        print(bool(int(res[0]['count'])))

        return bool(int(res[0]['count']))

    def test_row_presence(self, table, cols, res):

        database = DatabaseConnector(self.settings, self.request.session)
        query = '''
        SELECT {0}
        FROM {1}
        '''.format(cols, table)
        rows = database.execute_sql_query(query)
        # print('---')
        # print(query)
        # print(rows)
        # print('---')
        return res in rows
