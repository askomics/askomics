#! /usr/bin/env python
# -*- coding: utf-8 -*-

from askomics.libaskomics.rdfdb.SparqlQuery import SparqlQuery
from askomics.libaskomics.ParamManager import ParamManager
import logging

class SparqlQueryBuilder(ParamManager):
    """
    SparqlQueryBuilder create a SparqlQuery instance containing the query
    corresponding to an AskOmics graph (with load_from_query_json) or the
    pre-written query of a template file (with load_from_file).
    """

    def __init__(self, settings, session):
        ParamManager.__init__(self, settings, session)

        self.log = logging.getLogger(__name__)

    def get_prefix(self):
        prefix = 'PREFIX : <{0}>\nPREFIX xsd: <{1}>\nPREFIX rdfs: <{2}>\n'.format(self.ASKOMICS_prefix[""], self.ASKOMICS_prefix["xsd"], self.ASKOMICS_prefix["rdfs"])
        return prefix

    def load_from_file(self, template, replacement={}):
        """ Get a sparql query from a file, possibly replacing a template word by another given as argument """
        #f = open('SPARQL_queries.txt', 'a')
        #Add HEADER
        query = self.header_sparql_config()
        query += '\n'.join([line.rstrip('\r\n') for line in open(template)])
        for joker in replacement.keys():
            query = query.replace(joker, replacement[joker])

        # OFI : graph information to have compatibility betwwen virtuoso and fuseki triple store
        query = query.replace("#graph#", "<"+self.get_param("askomics.graph")+">")

        return SparqlQuery(query)


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
        list_name_node = []
        for c in json['constraint']:
            if c['link'] == 'node' and c['src'] == node_id:
                list_name_node.append(c['tag'])

        list_nodes = []
        for n in list_name_node:
            list_nodes.append(self.get_node(json, n))

        return list_nodes

    def more_than_one_child_with_the_same_uri(self, lneib):
        for c in lneib:
            for d in lneib:
                if c['uri'] == d['uri'] and c['id'] != d['id']:
                    return True
        return False

    def build_new_json_by_unionpath(self, json, node_id, lneib): # FIXME lneib is unused

        current_node = self.get_node(json, node_id)
        # build a subgraph for each
        #for n in lneib:


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

    def load_from_query_json(self, json):
        """  Get a sparql query from a json """

        prefix = self.get_prefix()
        self.log.debug(json)
        self.log.debug("#####################################")

        query = 'SELECT DISTINCT '

        if len(json['display']) > 0:
            for s in json['display']:
                if 'id' in s:
                    query += '?{0} '.format(s['id'])
        else:
            query += '* '

        query += '\nFROM '+ "<"+self.get_param("askomics.graph")+">"
        query += '\nWHERE {'

        for c in json['constraint']:
            if c['type'] == 'link':
                query += '\n\t?{0} {1} ?{2} .'.format(c['src'], c['uri'], c['tg'])
            elif c['type'] == 'node':
                query += '\n\t?{0} a {1} .'.format(c['id'], c['uri'])
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

        query += '\n} ' + 'LIMIT {0}'.format(json['limit'])

        # Replace all the uri by a prefix
        query = query.replace(self.ASKOMICS_prefix[""], ":")
        query = query.replace(self.ASKOMICS_prefix["xsd"], "xsd:")

        # Rewrite the query deleting virtual relation
        query_lines = query.split('\n')
        query = ''
        for c in json['constraint']:
            if c['type'] == 'clause':
                relation = c['relation']
                for line in query_lines:
                    if relation not in line and line + '\n' not in query:
                        query += line + '\n'
        if query == '':
            query = '\n'.join(query_lines)

        return SparqlQuery(prefix + query)

    def get_statistics_number_of_triples(self):

        prefix = self.header_sparql_config()
        query = 'SELECT (COUNT(*) AS ?no)'
        query += '\nFROM '+ "<"+self.get_param("askomics.graph")+">"
        query += '\n{ ?s ?p ?o  }'

        return SparqlQuery(prefix + query)

    def get_statistics_number_of_entities(self):

        prefix = self.header_sparql_config()
        query = 'SELECT (COUNT(distinct ?s) AS ?no)'
        query += '\nFROM '+ "<"+self.get_param("askomics.graph")+">"
        query += '\n{ ?s a []  }'
        self.log.debug(prefix + query)

        return SparqlQuery(prefix + query)

    def get_statistics_distinct_classes(self):

        prefix = self.header_sparql_config()
        query = 'SELECT (COUNT(distinct ?o) AS ?no)'
        query += '\nFROM '+ "<"+self.get_param("askomics.graph")+">"
        query += '\n{ ?s rdf:type ?o }'
        self.log.debug(prefix + query)

        return SparqlQuery(prefix + query)

    def get_statistics_list_classes(self):

        prefix = self.header_sparql_config()
        query = 'SELECT DISTINCT ?class'
        query += '\nFROM '+ "<"+self.get_param("askomics.graph")+">"
        query += '\n{ ?s a ?class }'
        self.log.debug(prefix + query)

        return SparqlQuery(prefix + query)

    def get_statistics_nb_instances_by_classe(self):

        prefix = self.header_sparql_config()
        query = 'SELECT  ?class (COUNT(?s) AS ?count )'
        query += '\nFROM '+ "<"+self.get_param("askomics.graph")+">"
        query += '\n{ ?s a ?class } GROUP BY ?class ORDER BY ?count'
        self.log.debug(prefix + query)

        return SparqlQuery(prefix + query)

    def get_statistics_by_startpoint(self):

        prefix = self.header_sparql_config()
        query = 'SELECT ?p (COUNT(?p) AS ?pTotal)\n'
        query += '\nFROM '+ "<"+self.get_param("askomics.graph")+">"
        query += '\nWHERE\n{ ?node displaySetting:startPoint "true"^^xsd:boolean . }'

        return SparqlQuery(prefix + query)
