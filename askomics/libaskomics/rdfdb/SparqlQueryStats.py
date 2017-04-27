#! /usr/bin/env python
# -*- coding: utf-8 -*-
"""
Classes to query triplestore on stats data.

information on build_query_on_the_fly:

* When querying as asdmin : build_query_on_the_fly(QUERY, True) 
==> The query have to contains GRAPH ?g { ... } because all data are store on a Graph 

* When querying as a classic user : build_query_on_the_fly(QUERY) or build_query_on_the_fly(QUERY, False)  
=> The query can not contain the GRAPH keyword because 'FROM' clauses cause all triplets are merged in the unique DEFAULT graph !!  

"""

import logging

from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder


class SparqlQueryStats(SparqlQueryBuilder):
    """
    This class contain method to build a sparql query to
    extract data from the users graph
    """

    def __init__(self, settings, session):
        SparqlQueryBuilder.__init__(self, settings, session)
        self.log = logging.getLogger(__name__)


    def condition_query(self, access_level):
        '''
            return the query according the accessLevel
        '''

        if access_level == 'public':
            return '?g :accessLevel "public".'

        if self.session['admin']:
            return '?g :accessLevel "private".'

        query = '{ ?g :accessLevel \''+access_level+'\'.'
        query += '  ?g dc:creator "'+self.session['username']+'" .}'

        return query

    def get_number_of_triples(self, access_level):
        """
        Get number of triples in public graph
        """
        return self.build_query_on_the_fly({
            'select': '(COUNT(*) AS ?number)',
            'query': 'GRAPH ?g {?s ?p ?o.'+self.condition_query(access_level)+'}'
        }, True)

    def get_number_of_entities(self, access_level):
        """
        Get number of triples in public graph
        """
        return self.build_query_on_the_fly({
            'select': '(COUNT(DISTINCT ?s) AS ?number)',
            'query': 'GRAPH ?g {?s a [].'+self.condition_query(access_level)+'}'
        }, True)


    def get_number_of_classes(self, access_level):
        """
        Get number of triples in public graph
        """
        return self.build_query_on_the_fly({
            'select': '(COUNT(DISTINCT ?s) AS ?number)',
            'query': 'GRAPH ?g {?s rdf:type owl:Class.'+self.condition_query(access_level)+'}'
        }, True)

    def get_number_of_subgraph(self, access_level):
        """
        Get number of triples in public graph
        """
        return self.build_query_on_the_fly({
            'select': '(COUNT(DISTINCT ?g) AS ?number)',
            'query': 'GRAPH ?g {?s ?p ?o.'+self.condition_query(access_level)+'}'
        }, True)


    def get_subgraph_infos(self, access_level):
        """
        Get number of triples in public graph
        """
        return self.build_query_on_the_fly({
            'select': '?graph ?date ?owner ?server ?version',
            'query': 'GRAPH ?g {?g prov:wasDerivedFrom ?graph .\n' +
                     '\t?g dc:creator ?owner .\n' +
                     '\t?g dc:hasVersion ?version .\n' +
                     '\t?g prov:describesService ?server .\n' +
                     '\t?g prov:generatedAtTime ?date .'+self.condition_query(access_level)+'}'
        }, True)


    def get_attr_of_classes(self, access_level):
        """
        Get all the attributes of a class
        """
        return self.build_query_on_the_fly({
            'select': '?class ?attr',
            'query': 'GRAPH ?g {?uri_class a owl:Class .\n' +
                     '\t?uri_class rdfs:label ?class .\n' +
                     '\t?uri_attr rdfs:domain ?uri_class .\n' +
                     '\t?uri_attr rdfs:label ?attr .'+self.condition_query(access_level)+'}'
            }, True)


    def get_rel_of_classes(self, access_level):
        """
        Get all the attributes of a class
        """
        return self.build_query_on_the_fly({
            'select': '?domain ?relname ?range',
            'query': 'GRAPH ?g {?rel a owl:ObjectProperty .\n' +
                     '\t?rel rdfs:label ?relname .\n' +
                     '\t?rel rdfs:domain ?uri_domain .\n' +
                     '\t?rel rdfs:range ?uri_range .\n' +
                     '\t?uri_domain rdfs:label ?domain .\n' +
                     '\t?uri_range rdfs:label ?range .'+self.condition_query(access_level)+'}'
            }, True)
