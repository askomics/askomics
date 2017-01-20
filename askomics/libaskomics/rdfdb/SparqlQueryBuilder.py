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

    def load_from_file(self, template_file, replacement={}):
        """
        Get a sparql query from a file, possibly replacing a template
        word by another given as argument
        """
        self.log.debug("***********  QUERY FILE  ***********")
        self.log.debug(template_file)
        with open(template_file) as template_fd:
            template = template_fd.read()

        query = self.prepare_query(template, replacement=replacement)
        return query

    def prepare_query(self, template, replacement={}):
        """
        Prepare a query from a template and a substitution dictionary.
        The `$graph` variable is the public graph
        The `$graph2` variable is user graph or public graph if no user logged
        """

        replacement['graph'] = '<%s>' % self.get_param('askomics.public_graph')

        if 'graph' not in self.session.keys() or self.session['graph'] == '':
            replacement['graph2'] = '<%s>' % self.get_param('askomics.public_graph')
        else:
            replacement['graph2'] = '<%s>' % self.session['graph']

        query = Template(template).substitute(replacement)

        prefixes = self.header_sparql_config(query)
        return SparqlQuery(prefixes + query)

    def build_query_from_template(self, replacement={}):
        """
        choose which template to fill between public or private in
        function of if a user is logged or not
        """

        template = self.get_template_sparql(self.ASKOMICS_privateQueryTemplate)

        if 'graph' not in self.session.keys() or self.session['graph'] == '':
            template = self.get_template_sparql(self.ASKOMICS_publicQueryTemplate)
            
        return self.load_from_file(template, replacement)

    def custom_query(self, select, query):
        """
        launch a custom query.
        """
        self.log.debug('---> custom_query')
        return self.build_query_from_template({
            'select': select,
            'query': query
        })


######### TODO: refactor all the stats function ############

    # The following utilities use prepare_query to fill a template.
    def get_statistics_number_of_triples(self):
        return self.prepare_query(
            """SELECT (COUNT(?s) AS ?no) WHERE {
            GRAPH <"""+self.get_param("askomics.graph")+"""> { ?g rdfg:subGraphOf <"""+self.get_param("askomics.graph")+""">}
            GRAPH ?g { ?s ?p ?o }}""")

    def get_statistics_number_of_triples_AskOmics_graphs(self):
        return self.prepare_query(
            """SELECT (COUNT(?s) AS ?no) WHERE {
            GRAPH <"""+self.get_param("askomics.graph")+"""> { ?s ?p ?o}}""")

    def get_statistics_number_of_entities(self):
        return self.prepare_query(
            """SELECT (COUNT(distinct ?s) AS ?no) WHERE {
            GRAPH <"""+self.get_param("askomics.graph")+"""> { ?g rdfg:subGraphOf <"""+self.get_param("askomics.graph")+""">}
            GRAPH ?g { ?s a [] }}""")

    def get_statistics_number_of_graphs(self):
        return self.prepare_query(
            """SELECT (COUNT(distinct ?g) AS ?no) WHERE {
            GRAPH <"""+self.get_param("askomics.graph")+"""> { ?g rdfg:subGraphOf <"""+self.get_param("askomics.graph")+""">}
            GRAPH ?g { ?s ?p ?o } }""")

    def get_statistics_distinct_classes(self):
        return self.prepare_query(
            """SELECT (COUNT(distinct ?o) AS ?no) WHERE {
            GRAPH <"""+self.get_param("askomics.graph")+"""> { ?g rdfg:subGraphOf <"""+self.get_param("askomics.graph")+""">}
            GRAPH ?g { ?s rdf:type ?o }}""")

    def get_statistics_list_classes(self):
        return self.prepare_query(
            """SELECT DISTINCT ?class WHERE {
            GRAPH <"""+self.get_param("askomics.graph")+"""> { ?g rdfg:subGraphOf <"""+self.get_param("askomics.graph")+""">}
            GRAPH ?g { ?s a ?classVar. ?classVar rdfs:label ?class. }}""")

    def get_statistics_nb_instances_by_classe(self):
        return self.prepare_query(
            """SELECT ?class (COUNT(distinct ?s) AS ?count ) WHERE {
            GRAPH <"""+self.get_param("askomics.graph")+"""> { ?g rdfg:subGraphOf <"""+self.get_param("askomics.graph")+""">}
            GRAPH ?g { ?s a ?classVar. ?classVar rdfs:label ?class. }} GROUP BY ?class ORDER BY ?count""")

    def get_statistics_by_startpoint(self):
        return self.prepare_query(
            """SELECT ?p (COUNT(?p) AS ?pTotal) WHERE {
            GRAPH <"""+self.get_param("askomics.graph")+"""> { ?g rdfg:subGraphOf <"""+self.get_param("askomics.graph")+""">}
            GRAPH ?g { ?node displaySetting:startPoint "true"^^xsd:boolean . }}""")

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
                VALUES ?p {prov:generatedAtTime dc:creator dc:hasVersion prov:describesService prov:wasDerivedFrom} } }""")


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
