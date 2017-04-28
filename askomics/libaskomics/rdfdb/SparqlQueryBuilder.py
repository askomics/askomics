#! /usr/bin/env python
# -*- coding: utf-8 -*-
import logging
# from pprint import pformat
from string import Template

from askomics.libaskomics.rdfdb.SparqlQuery import SparqlQuery
from askomics.libaskomics.ParamManager import ParamManager
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


    def build_query_on_the_fly(self, replacement, adminrequest=False):
        """
        Build a query from the private or public template
        """
        for elt in ['query', 'select']:
            if not elt in replacement:
                raise ValueError('SparqlQueryBuilder::build_query_on_the_fly:'
                                 ' can not build a query without "'+elt+'" index !')

        query = ""
        query += "SELECT DISTINCT "+replacement['select']+"\n"

        #security test
        if not 'admin' in self.session or not isinstance(self.session['admin'], bool):
            self.session['admin'] = False

        # ADM can query on all database !
        if not isinstance(adminrequest, bool) or not adminrequest:
            if 'graph' not in self.settings:
                raise ValueError("SparqlQueryBuilder::build_query_on_the_fly:"
                                 ' bad initialization of settings["graph"]!')

            if 'public' not in self.settings['graph']:
                raise ValueError('SparqlQueryBuilder::build_query_on_the_fly:'
                                 ' bad initialization of settings["graph"]["public"]!')

            if 'private' not in self.settings['graph']:
                raise ValueError('SparqlQueryBuilder::build_query_on_the_fly:'
                                 ' bad initialization of settings["graph"]["private"]!')

            listfrom = self.settings['graph']['public'] + self.settings['graph']['private']
                # query += "FROM <>\n"
            self.log.debug(" === Graphs Available === ")
            self.log.debug(listfrom)
            if len(listfrom) <= 0:
                pass
                # None solution because none graph !
            else:
                for elt in set(listfrom):
                    query += "FROM <"+elt+">\n"

        if 'from' in set(replacement):
            for vfrom in replacement['from']:
                query += "FROM <"+vfrom+">\n"

        query += "WHERE {"+"\n"
        query += replacement['query']+"\n"
        query += "}"+"\n"

        if 'post_action' in replacement:
            query += replacement['post_action'] + "\n"

        prefixes = self.header_sparql_config(query)

        return SparqlQuery(prefixes + query)


    def custom_query(self, select, query):
        """
        launch a custom query.
        """
        self.log.debug('---> custom_query')
        return self.build_query_on_the_fly({
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
