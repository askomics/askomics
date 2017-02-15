"""Contain InterfaceTps class"""

from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.SparqlQueryGraph import SparqlQueryGraph
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
        return self.load_file("people", col_types)

    def load_instruments(self):
        """Load the file instruments.tsv
        
        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'text', 'category']
        return self.load_file("instruments", col_types)

    def load_play_instrument(self):
        """Load the file play_instruments.tsv
        
        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'entity', 'category']
        return self.load_file("play_instrument", col_types)

    def load_public_people(self):
        """Load the file people.tsv as public data
        
        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'text', 'text', 'category', 'numeric']
        return self.load_file("people", col_types, True)

    def load_transcript(self):
        """Load the file transcript.tsv
        
        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'taxon', 'ref', 'start', 'end', 'strand', 'category']
        return self.load_file("transcript", col_types)

    def load_qtl(self):
        """Load the file qtl.tsv
        
        :returns: the timestamp associated
        :rtype: string
        """

        col_types = ['entity_start', 'taxon', 'ref', 'start', 'end']
        return self.load_file("qtl", col_types)

    def clean_up(self):
        """Delete all tests data
        
        Delete the users graph and all public and private
        data used for the tests
        """

        # Delete all data
        self.empty()

        # Delete users
        self.delete_users()

    def delete_users(self):
        """Delete the test users graph"""

        sqb = SparqlQueryGraph(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)

        query_laucher.execute_query(sqb.get_drop_named_graph('urn:sparql:test_askomics:users').query)
