#! /usr/bin/env python
# -*- coding: utf-8 -*-
import logging
from pprint import pformat
from string import Template

from askomics.libaskomics.rdfdb.SparqlQuery import SparqlQuery
from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.utils import prefix_lines

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
        """ Get a sparql query from a file, possibly replacing a template word by another given as argument """
        with open(template_file) as template_fd:
            template = template_fd.read()

        query = self.prepare_query(template, replacement=replacement)
        return query

    def prepare_query(self, template, replacement={}):
        """Prepare a query from a template and a substitution dictionary.
            The `$graph` variable defaults to "askomics.graph" config
        """
        if 'graph' not in replacement:
            replacement['graph'] = '<%s>' % self.get_param("askomics.graph")

        query = Template(template).substitute(replacement)

        prefixes = self.header_sparql_config()
        return SparqlQuery(prefixes + query)

    # The following utilities use prepare_query to fill a template.
    def get_statistics_number_of_triples(self):
        return self.prepare_query(
            'SELECT (COUNT(*) AS ?no)  FROM $graph { ?s ?p ?o  }')

    def get_statistics_number_of_entities(self):
        return self.prepare_query(
            'SELECT (COUNT(distinct ?s) AS ?no) FROM $graph { ?s a []  }')

    def get_statistics_distinct_classes(self):
        return self.prepare_query(
            'SELECT (COUNT(distinct ?o) AS ?no) FROM $graph { ?s rdf:type ?o }')

    def get_statistics_list_classes(self):
        return self.prepare_query(
            'SELECT DISTINCT ?class FROM $graph { ?s a ?class }')

    def get_statistics_nb_instances_by_classe(self):
        return self.prepare_query(
            'SELECT  ?class (COUNT(?s) AS ?count ) FROM $graph'
            ' { ?s a ?class } GROUP BY ?class ORDER BY ?count')

    def get_statistics_by_startpoint(self):
        return self.prepare_query(
            'SELECT ?p (COUNT(?p) AS ?pTotal)\n FROM $graph'
            ' { ?node displaySetting:startPoint "true"^^xsd:boolean . }')

    def get_delete_query_string(self):
        return self.prepare_query(
            'CLEAR GRAPH $graph')
