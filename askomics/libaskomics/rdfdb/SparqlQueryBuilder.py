#! /usr/bin/env python
# -*- coding: utf-8 -*-
import logging
# from pprint import pformat
from string import Template

from askomics.libaskomics.rdfdb.SparqlQuery import SparqlQuery
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.rdfdb.MultipleQueryLauncher import MultipleQueryLauncher
from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.EndpointManager import EndpointManager
# from askomics.libaskomics.utils import prefix_lines

class SparqlQueryBuilder(ParamManager):
    """
    SparqlQueryBuilder create a SparqlQuery instance containing the query
    corresponding to an AskOmics graph (with load_from_query_json) or the
    pre-written query of a template file (with load_from_file).
    """

    def __init__(self, settings, session):
        ParamManager.__init__(self, settings, session)
        self.log = logging.getLogger(__name__)

    def getGraphUser(self,removeGraph=[]):
        self.log.debug("=== setGraphUser ===")
        settings = {}
        #finding all private graph graph

        qu = self.build_query_on_the_fly({
            'select': '?g',
            'query': 'GRAPH ?g {\n'+\
            "?g dc:creator '" + self.session['username'] + "' .\n"+
            " } ",
            'post_action': 'GROUP BY ?g'
        }, True)

        ql = QueryLauncher(self.settings, self.session)
        results = ql.process_query(qu.query)
        endpoint = self.get_param("askomics.endpoint")
        settings[endpoint] = {}
        settings[endpoint]['private'] = []

        for elt in results:
            if 'g' not in elt:
                continue
            if elt['g'] in removeGraph:
                continue
            settings[endpoint]['private'].append(elt['g'])

        #finding all public graph on all Askomics endpoint
        qu = self.build_query_on_the_fly({
            'select': '?g',
            'query': 'GRAPH ?g {\n'+
            "?g :accessLevel 'public'. \n"+
            "} ",
            'post_action': 'GROUP BY ?g'
        }, True)

        ql = MultipleQueryLauncher(self.settings, self.session)
        em = EndpointManager(self.settings, self.session)

        results = ql.process_query(qu.query,em.listAskomicsEndpoints(),indexByEndpoint=True)

        for endpoint in results:
            settings[endpoint] = {}
            settings[endpoint]['public'] = []
            for elt in results[endpoint]:
                if elt['g'] in removeGraph:
                    continue
                settings[endpoint]['public'].append(elt['g'])

        self.log.debug("setting:\n"+str(settings))
        return settings

    def build_query_on_the_fly(self, replacement, adminrequest=False):
        """
        Build a query from the private or public template
        """
        for elt in ['query', 'select']:
            if not elt in replacement:
                raise ValueError('SparqlQueryBuilder::build_query_on_the_fly:'
                                 ' can not build a query without "'+elt+'" index !')

        self.log.debug(" ========== build_query_on_the_fly ================")
        self.log.debug("select:\n:"+replacement['select'])
        self.log.debug("query:\n:"+replacement['query'])

        query = ""
        query += "SELECT DISTINCT "+replacement['select']+"\n"

        #security test
        if not 'admin' in self.session or not isinstance(self.session['admin'], bool):
            self.session['admin'] = False
        # ADM can query on all database !
        if not isinstance(adminrequest, bool) or not adminrequest:
            #add ALL GRAPHS user only if from is not defined !!
            if 'from' not in set(replacement) or \
                len(replacement['from']) == 0:
                endpoints = self.getGraphUser()
                for graphs in endpoints:
                    listfrom = endpoints[graphs]['public']
                    if 'private' in endpoints[graphs]:
                        endpoints[graphs]['private']
            else:
                listfrom = replacement['from']

            if len(listfrom) > 0:
                for elt in set(listfrom):
                    self.log.info(elt)
                    query += "FROM <"+elt+">\n"

        query += "WHERE {"+"\n"
        query += replacement['query']+"\n"
        query += "}"+"\n"

        if 'post_action' in replacement:
            query += replacement['post_action'] + "\n"

        prefixes = self.header_sparql_config(query)

        return SparqlQuery(prefixes + query)


    def custom_query(self, fromgraph, select, query):
        """
        launch a custom query.
        """
        self.log.debug('---> custom_query')
        return self.build_query_on_the_fly({
            'from' : fromgraph,
            'select': select,
            'query': query
        })

    def get_delete_query_string(self, graph):
        """
        clear a graph
        """
        return self.prepare_query(
            'CLEAR GRAPH <'+graph+">")

    def get_drop_named_graph(self, graph):
        """
        remove a graph
        """

        return self.prepare_query(
            'DROP SILENT GRAPH <' + graph + '>')

    def get_delete_metadatas_of_graph(self, graph):
        """
        Delte metadata linkd to a graph
        """

        if 'graph' not in self.session:
            raise Exception("graph key is not initialized in this askomics session.")

        return self.prepare_query(
            """
            DELETE WHERE { GRAPH <"""+self.session['graph']+"""> { <"""+graph+"""> ?p ?o }}
            """)

    def update_blocked_status(self, blocked, username):
        """
        hello!
        """

        return self.prepare_query(
            """
            DELETE { GRAPH <"""+self.get_param('askomics.users_graph')+""">
              { :""" + username + """ :isblocked ?blocked. } }
            INSERT { GRAPH <"""+self.get_param('askomics.users_graph')+""">
              { :""" + username + """ :isblocked \"""" + blocked + """\"^^xsd:boolean. } }
            WHERE { GRAPH <"""+self.get_param('askomics.users_graph')+""">
              { :""" + username + """ :isblocked ?blocked. } }
            """)

    def update_admin_status(self, admin, username):
        """
        Change the admin status of a user!
        """
        return self.prepare_query(
            """
            DELETE { GRAPH <"""+self.get_param('askomics.users_graph')+""">
              {  :""" + username + """ :isadmin ?admin. } }
            INSERT { GRAPH <"""+self.get_param('askomics.users_graph')+""">
              { :""" + username + """ :isadmin \"""" + admin + """\"^^xsd:boolean. } }
            WHERE { GRAPH <"""+self.get_param('askomics.users_graph')+""">
              { :""" + username + """ :isadmin ?admin. } }
            """)

    def get_graph_of_user(self, username):
        """
        Get all subgraph of a user
        """
        return self.prepare_query(
            """
            SELECT ?g
            WHERE {
                ?g dc:creator \"""" + username + """\"
            }
            """)

    def delete_user(self, username):
        """
        Delet all info of a user
        """
        return self.prepare_query(
            """
            DELETE WHERE {
                GRAPH <"""+self.get_param('askomics.users_graph')+"""> {
                    :""" + username +""" ?p ?o
                }
            }
            """)

    def prepare_query(self, template, replacement={}):
        """
        Prepare a query from a template and a substitution dictionary.
        The `$graph` variable is the public graph
        The `$graph2` variable is user graph or public graph if no user logged
        """

        query = Template(template).substitute(replacement)

        prefixes = self.header_sparql_config(query)
        return SparqlQuery(prefixes + query)
