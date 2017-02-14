
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.SparqlQueryGraph import SparqlQueryGraph
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.SourceFileConvertor import SourceFileConvertor

class InterfaceTPS(object):

    def __init__(self,settings,request):

        self.settings = settings
        self.request = request

    def empty(self):
        sqb = SparqlQueryGraph(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)
        namedGraphs = self.list_private_graphs()
        for graph in namedGraphs:
            ql.execute_query(sqb.get_delete_query_string(graph).query)

    def list_private_graphs(self):
        sqb = SparqlQueryGraph(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)

        res = ql.execute_query(sqb.get_private_graphs().query)

        namedGraphs = []

        for indexResult in range(len(res['results']['bindings'])):
            namedGraphs.append(res['results']['bindings'][indexResult]['g']['value'])

        return namedGraphs

    def list_public_graph(self):
        sqb = SparqlQueryGraph(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)

        res = ql.execute_query(sqb.get_public_graphs().query)

        for indexResult in range(len(res['results']['bindings'])):
            namedGraphs.append(res['results']['bindings'][indexResult]['g']['value'])

        return namedGraphs

    def load_file(self, file, col_types, public=False):
        """
        Load a test file in the TS
        """
        # copy the test file into the tmp dir



        disabled_columns = []
        sfc = SourceFileConvertor(self.settings, self.request.session)
        src_file = sfc.get_source_file(file)
        print(type(src_file))
        src_file.set_forced_column_types(col_types)
        src_file.set_disabled_columns(disabled_columns)
        src_file.persist('', 'noload', public)
        return src_file.get_timestamp()

    def load_people(self):
        """
        Load the test file people.tsv
        """
        col_types = ['entity_start', 'text', 'text', 'category', 'numeric']
        return self.load_file("people", col_types)

    def load_instruments(self):
        """
        Load the instruments.tsv file
        """
        col_types = ['entity_start', 'text', 'category']
        return self.load_file("instruments", col_types)

    def load_play_instrument(self):
        """
        Load the play_instrument.tsv file
        """
        col_types = ['entity_start', 'entity', 'category']
        return self.load_file("play_instrument", col_types)

    def load_public_people(self):
        """
        Load the test file people.tsv into the public graph
        """
        col_types = ['entity_start', 'text', 'text', 'category', 'numeric']
        return self.load_file("people", col_types, True)

    def load_transcript(self):
        """
        Load the test file transcript.tsv into the public graph
        """
        col_types = ['entity_start', 'taxon', 'ref', 'start', 'end', 'strand', 'category']
        return self.load_file("transcript", col_types)

    def load_qtl(self):
        """
        Load the test file qtl.tsv into the public graph
        """
        col_types = ['entity_start', 'taxon', 'ref', 'start', 'end']
        return self.load_file("qtl", col_types)

    def load_small_gff(self):
        """
        """
        pass


    def clean_up(self):
        """Delete the users graph and all the datasets"""

        # delete data
        self.empty()

        # Delete users
        self.delete_users()

    def delete_users(self):
        """Delete the users graph"""

        sqb = SparqlQueryGraph(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)

        query_laucher.execute_query(sqb.get_drop_named_graph('urn:sparql:test_askomics:users').query)




    # def drop_graph(self, graph):
    #     sqb = SparqlQueryBuilder(self.settings, self.request.session)
    #     ql = QueryLauncher(self.settings, self.request.session)
    #     ql.execute_query(sqb.get_drop_named_graph(graph).query)
