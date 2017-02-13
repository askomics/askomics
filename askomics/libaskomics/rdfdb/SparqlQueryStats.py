import logging
# from pprint import pformat
# from string import Template

# from askomics.libaskomics.rdfdb.SparqlQuery import SparqlQuery
# from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder

class SparqlQueryStats(SparqlQueryBuilder):
    """
    This class contain method to build a sparql query to
    extract data from the users graph
    """

    def __init__(self, settings, session):
        SparqlQueryBuilder.__init__(self, settings, session)
        self.log = logging.getLogger(__name__)


    def get_number_of_triples(self,accessLevel):
        """
        Get number of triples in public graph
        """
        return self.build_query_on_the_fly({
            'select': '(COUNT(*) AS ?number)',
            'query': 'GRAPH ?g {?s ?p ?o} { ?g :accessLevel \''+accessLevel+'\' }'
        })

    def get_number_of_entities(self,accessLevel):
        """
        Get number of triples in public graph
        """
        return self.build_query_on_the_fly({
            'select': '(COUNT(DISTINCT ?s) AS ?number)',
            'query': 'GRAPH ?g {?s a []} { ?g :accessLevel \''+accessLevel+'\' }'
        })


    def get_number_of_classes(self,accessLevel):
        """
        Get number of triples in public graph
        """
        return self.build_query_on_the_fly({
            'select': '(COUNT(DISTINCT ?s) AS ?number)',
            'query': 'GRAPH ?g {?s rdf:type owl:Class} { ?g :accessLevel \''+accessLevel+'\' }'
        })

    def get_number_of_subgraph(self,accessLevel):
        """
        Get number of triples in public graph
        """
        return self.build_query_on_the_fly({
            'select': '(COUNT(DISTINCT ?g) AS ?number)',
            'query': 'GRAPH ?g {?s ?p ?o} { ?g :accessLevel \''+accessLevel+'\' }'
        })


    def get_subgraph_infos(self,accessLevel):
        """
        Get number of triples in public graph
        """
        return self.build_query_on_the_fly({
            'select': '?graph ?date ?owner ?server ?version',
            'query': '?graph_uri prov:wasDerivedFrom ?graph .\n' +
                     '\t?graph_uri dc:creator ?owner .\n' +
                     '\t?graph_uri dc:hasVersion ?version .\n' +
                     '\t?graph_uri prov:describesService ?server .\n' +
                     '\t?graph_uri prov:generatedAtTime ?date .\n'+
                     '\t?graph_uri :accessLevel \''+accessLevel+'\'.'
        })


    def get_attr_of_classes(self,accessLevel):
        """
        Get all the attributes of a class
        """
        return self.build_query_on_the_fly({
            'select': '?class ?attr',
            'query': 'GRAPH ?g {?uri_class a owl:Class .\n' +
                     '\t?uri_class rdfs:label ?class .\n' +
                     '\t?uri_attr rdfs:domain ?uri_class .\n' +
                     '\t?uri_attr rdfs:label ?attr .} { ?g :accessLevel \''+accessLevel+'\' }'
            })


    def get_rel_of_classes(self,accessLevel):
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
                     '\t?uri_range rdfs:label ?range .} { ?g :accessLevel \''+accessLevel+'\' }'
            })
