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

    # Definition of constraint type
    #FIXME: More doc : to what json bit is this related
    constraint_type_2_clause_tmpl = {
        'link'     : '?{src} {uri} ?{tg} .',
        'node'     : '?{id} a {uri} .',
        'attribute': '?{parent} {uri} ?{id} .',
        'clause'   : '{clause}',
        }

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

    def get_node(self, json, node_id):
        """
            get a node from the json according the id
        """
        for c in json['constraint']:
            if c['type'] == 'node' and c['id'] == node_id:
                return c
        return None

    def get_neighbours_source_node(self, json, node_id):
        """
            get a node link with the id node
        """
        return [self.get_node(json, c['tag']) for c in json['constraint']
                    if c['link'] == 'node' and c['src'] == node_id
               ]

    #FIXME: Dead code. (see gen_block_request for a refactored version)
    def get_block_request(self, json, node_id):
        lneib = self.get_neighbours_source_node(json, node_id)

        if len(lneib) > 0:
            lnewjson = self.build_new_json_by_unionpath(self, json, node_id, lneib)
            request = ""
            for neib in lneib:
                if request != "":
                    request += " UNION "
                request += "{" + self.get_block_request(lnewjson[neib['id']], neib['id']) + "}"
            query = request
        else:
            for c in json['constraint']:
                if c['type'] == 'link':
                    query += '\n\t?{0} {1} ?{2} .'.format(c['src'], c['uri'], c['tg'])
                elif c['type'] == 'attribute':
                    query += '\n\t?{0} {1} ?{2} .'.format(c['parent'], c['uri'], c['id'])
                elif c['type'] == 'clause':
                    query += '\n' + c['clause']

            if len(json['filter_cat']) > 0:
                for f in json['filter_cat']:
                    query += '\n\tVALUES ?{0} '.format(f['id']) + '{'
                    for elt in f['value']:
                        query += ' :{0}'.format(elt)
                    query += ' } .'

            if len(json['filter_str']) > 0:
                for f in json['filter_str']:
                    query += '\n\tFILTER (regex(str(?{0}), "{1}", "i")) .'.format(f['id'], f['value'])

            if len(json['filter_num']) > 0:
                for f in json['filter_num']:
                    query += '\n\tFILTER ( ?{0} {1} {2} ) .'.format(f['id'], f['op'], f['value'])

        return query

    #FIXME: Dead code. refactored but not tested. (was: get_block_request)
    def gen_block_request(self, json, node_id):
        neighbs = self.get_neighbours_source_node(json, node_id)

        if len(neighbs) > 0: # Recursive case
            lnewjson = self.get_node(json, node_id)
            # Generate the constraint for each neighbs nodes
            blocks_iter = ( self.gen_block_request(lnewjson[neighb['id']], neighb['id'],
                                                   indent='\t'+indent)
                            for neighb in neighbs )
            # Output the union of the constraints for each neighbour nodes
            yield '{'
            yield from next(blocks_iter) # First block
            for block_lines in blocks_iter:
                yield '} UNION {'
                yield from prefix_lines('\t', block_lines)
            yield '}'
        else: # Base case
            yield from self.gen_constraint_SPARQL(json)

    def load_from_query_json(self, json):
        """  Get a sparql query from a json """
        self.log.debug('load_from_query_json, json input: \n%s', pformat(json))

        # Rewrite the query deleting virtual relation
        # FIXME: Better way to do this ?
        query_lines = list(self.gen_query_from_json(json))
        query = ''
        for c in json['constraint']:
            if c['type'] == 'clause':
                relation = c['relation']
                #FIXME: multiple iteration on query_lines, this is explain why the
                # iterator is materialized as a list
                for line in query_lines:
                    if relation not in line and line + '\n' not in query:
                        query += line + '\n'
        if query == '':
            query = '\n'.join(query_lines)


        # Replace all the uri by a prefix
        # FIXME: The frontend should tag all URIs and CURIEs nodes to differentiate them,
        # in order to allow URIs that can't be prefixed to be properly written between <>.
        for prefix, uri_base in self.ASKOMICS_prefix.items():
            query = query.replace(uri_base, prefix + ':')

        self.log.debug('load_from_query_json, query output: \n%s', query)
        prefix = self.header_sparql_config()
        return SparqlQuery(prefix + query)

    def gen_query_from_json(self, json):
        """:return:A generator producing query line from json.
        seealso:: load_from_query_json for an aggregated string.
        """

        yield 'SELECT DISTINCT {projection_vars} FROM <{graph}>'.format(
                projection_vars = ' '.join('?'+var['id'] for var in json['display'] if 'id' in var),
                graph = self.get_param("askomics.graph"),
            )

        yield 'WHERE {'

        yield from prefix_lines('\t', self.gen_constraint_SPARQL(json))

        yield '}} LIMIT {limit}'.format_map(json)

    def gen_constraint_SPARQL(self, json):
        """:return: a generator of WHERE clauses from json."""
        for c in json['constraint']:
            assert all('type' in c for c in json['constraint'])
            yield self.constraint_type_2_clause_tmpl[c['type']].format_map(c)

        for cat_selection_sets in json['filter_cat']:
            yield 'VALUES ?{id} {{ {selections} }}.'.format(
                id = cat_selection_sets['id'],
                selections = ' '.join(':'+sel for sel in cat_selection_sets['value']))

        for f in json['filter_str']:
            yield 'FILTER (regex(str(?{id}), "{value}", "i")) .'.format_map(f)

        for f in json['filter_num']:
            yield 'FILTER ( ?{id} {op} {value} ) .'.format_map(f)


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
