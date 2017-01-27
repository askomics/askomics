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

    def build_query_on_the_fly(self, replacement,adminRequest=False):
        """
        Build a query from the private or public template
        """
        for elt in ['query','select'] :
            if not elt in replacement:
                raise ValueError('SparqlQueryBuilder::build_query_on_the_fly: can not build a query without "'+elt+'" index !')

        query = ""
        query += "SELECT DISTINCT "+replacement['select']+"\n"

        # ADM can query on all database !
        if not self.session['admin']:
            if not adminRequest :
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

    def get_metadatas(self, graph):
        return self.prepare_query(
        """SELECT DISTINCT ?p ?o
            WHERE {	GRAPH <"""+self.get_param("askomics.graph")+""">
		        { <""" + graph + """> ?p ?o
                VALUES ?p {prov:generatedAtTime dc:creator dc:hasVersion prov:describesService prov:wasDerivedFrom :accessLevel foaf:Group} } }""")


    def get_list_named_graphs(self):
        """
        Get the list of named graph
        """
        self.log.debug('---> get_list_named_graphs')
        return self.build_query_from_template({
            'select': '?g',
            'query': '?s ?p ?o'
        })

    # Following function used when signup/login

    def check_username_presence(self, username):
        return self.prepare_query(
        """SELECT DISTINCT ?status
        WHERE {
            GRAPH <"""+self.get_param("askomics.users_graph")+"""> {
            BIND(EXISTS {:""" + username + """ rdf:type :user} AS ?status) }
        }""")

    def check_email_presence(self, email):
        return self.prepare_query(
        """SELECT DISTINCT ?status
        WHERE {
            GRAPH <"""+self.get_param("askomics.users_graph")+"""> {
            BIND(EXISTS {?uri :email \"""" + email + """\"} AS ?status) }
        }""")

    def get_password_with_email(self, email):
        return self.prepare_query(
        """SELECT DISTINCT ?salt ?shapw
        WHERE {
            GRAPH <"""+self.get_param("askomics.users_graph")+"""> {
            ?URIusername rdf:type :user .
            ?URIusername :email \"""" + email + """\" .
            ?URIusername :randomsalt ?salt .
            ?URIusername :password ?shapw . }
        }""")

    def get_password_with_username(self, username):
        return self.prepare_query(
        """SELECT DISTINCT ?salt ?shapw
        WHERE {
            GRAPH <"""+self.get_param("askomics.users_graph")+"""> {
            ?URIusername rdf:type :user .
            ?URIusername rdfs:label \"""" + username + """\" .
            ?URIusername :randomsalt ?salt .
            ?URIusername :password ?shapw . }
        }""")

    def get_number_of_users(self):
        return self.prepare_query(
        """SELECT (count(*) AS ?count)
        WHERE {
            GRAPH <"""+self.get_param("askomics.users_graph")+"""> {
                ?s rdf:type :user .
            }
        }""")

    def get_admin_status_by_username(self, username):
        return self.prepare_query(
        """SELECT DISTINCT ?admin
        WHERE {
            GRAPH <"""+self.get_param("askomics.users_graph")+"""> {
            ?URIusername rdf:type :user .
            ?URIusername rdfs:label \"""" + username + """\" .
            ?URIusername :isadmin ?admin}
        }""")

    def get_admin_status_by_email(self, email):
        return self.prepare_query(
        """SELECT DISTINCT ?admin
        WHERE {
            GRAPH <"""+self.get_param("askomics.users_graph")+"""> {
            ?URIusername rdf:type :user .
            ?URIusername :email \"""" + email + """\" .
            ?URIusername :isadmin ?admin}
        }""")

    def get_users_infos(self):
        return self.prepare_query(
        """SELECT DISTINCT ?username ?email ?admin
        WHERE {
            GRAPH <"""+self.get_param("askomics.users_graph")+"""> {
            ?URIusername rdf:type :user .
            ?URIusername rdfs:label ?username .
            ?URIusername :email ?email .
            ?URIusername :isadmin ?admin}
        }""")


    def prepare_query(self, template, replacement={}):
        """
        Prepare a query from a template and a substitution dictionary.
        The `$graph` variable is the public graph
        The `$graph2` variable is user graph or public graph if no user logged
        """

        query = Template(template).substitute(replacement)

        prefixes = self.header_sparql_config(query)
        return SparqlQuery(prefixes + query)
