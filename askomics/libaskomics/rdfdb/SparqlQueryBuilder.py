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

    # def build_update_on_the_fly(self, replacment, adminRequest=False):
    #     """
    #     build an update query
    #     """

    def build_query_on_the_fly(self, replacement,adminRequest=False):
        """
        Build a query from the private or public template
        """
        for elt in ['query','select'] :
            if not elt in replacement:
                raise ValueError('SparqlQueryBuilder::build_query_on_the_fly: can not build a query without "'+elt+'" index !')

        query = ""
        query += "SELECT DISTINCT "+replacement['select']+"\n"

        #security test
        if not 'admin' in self.session or type(self.session['admin']) != bool :
            self.session['admin'] = bool

        # ADM can query on all database !
        if not self.session['admin']:
            if type(adminRequest) != bool or not adminRequest :
                query += "FROM <>\n"
                if (not 'from' in self.session) or (len(self.session['from'])<=0):
                    pass
                    # None solution because none graph !
                else:
                    for elt in self.session['from']:
                        query += "FROM <"+elt+">\n"

        query += "WHERE {"+"\n"
        query += replacement['query']+"\n"
        query += "}"+"\n"

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
        return self.prepare_query(
            'CLEAR GRAPH <'+graph+">")

    def get_drop_named_graph(self, graph):
        return self.prepare_query(
            'DROP SILENT GRAPH <' + graph + '>')

    def get_delete_metadatas_of_graph(self, graph):
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
            WITH GRAPH <""" + self.get_param('askomics.users_graph') + """>
            DELETE { :""" + username + """ :isblocked ?blocked }
            INSERT { :""" + username + """ :isblocked \"""" + blocked + """\"^^xsd:boolean }
            WHERE { :""" + username + """ :isblocked ?blocked }
            """)

    def update_admin_status(self, admin, username):
        """
        Change the admin status of a user!
        """
        return self.prepare_query(
            """
            WITH GRAPH <""" + self.get_param('askomics.users_graph') + """>
            DELETE { :""" + username + """ :isadmin ?admin }
            INSERT { :""" + username + """ :isadmin \"""" + admin + """\"^^xsd:boolean }
            WHERE { :""" + username + """ :isadmin ?admin }
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
