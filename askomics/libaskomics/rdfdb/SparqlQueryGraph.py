import logging
# from pprint import pformat
# from string import Template

# from askomics.libaskomics.rdfdb.SparqlQuery import SparqlQuery
# from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder

class SparqlQueryGraph(SparqlQueryBuilder):
    """
    This class contain method to build a sparql query to
    extract data
    """

    def __init__(self, settings, session):
        SparqlQueryBuilder.__init__(self, settings, session)
        self.log = logging.getLogger(__name__)

    def query_exemple(self):
        """
        Query exemple. used for testing
        """
        return self.build_query_from_template({
            'select': '?s ?p ?o',
            'query': '?s ?p ?o .'
            })

    def get_start_point(self):
        """
        Get the start point and in which graph they are
        """
        self.log.debug('---> get_start_point')
        return self.build_query_from_template({
            'select': '?nodeUri ?nodeLabel ?g',
            'query': '?nodeUri displaySetting:startPoint "true"^^xsd:boolean .\n' +
                     '\t?nodeUri rdfs:label ?nodeLabel'
        })

    def get_list_named_graphs(self):
        """
        Get the list of named graph
        """
        self.log.debug('---> get_list_named_graphs')
        return self.build_query_from_template({
            'select': '?g',
            'query': '?s ?p ?o'
        })

    def get_if_positionable(self, uri):
        """
        Get if an entity is positionable
        """
        self.log.debug('---> get_if_positionable')
        return self.build_query_from_template({
            'select': '?exist',
            'query': 'BIND(EXISTS {<' + uri + '> displaySetting:is_positionable "true"^^xsd:boolean} AS ?exist)'
        })

    def get_common_pos_attr(self, uri1, uri2):
        """
        Get the common positionable attributes between 2 entity
        """
        self.log.debug('---> get_common_pos_attr')
        return self.build_query_from_template({
            'select': '?uri ?pos_attr ?status',
            'query': 'VALUES ?pos_attr {:position_taxon :position_ref :position_strand }\n' +
                     '\tVALUES ?uri {<'+uri1+'> <'+uri2+'> }\n' +
                     '\tBIND(EXISTS {?pos_attr rdfs:domain ?uri} AS ?status)'
        })

    def get_all_taxons(self):
        """
        Get the list of all taxon
        """
        self.log.debug('---> get_all_taxons')
        return self.build_query_from_template({
            'select': '?taxon',
            'query': ':taxonCategory displaySetting:category ?URItax .\n' +
                     '\t?URItax rdfs:label ?taxon'
        })

    def get_abstraction(self, entities):
        """
        """
        return self.build_query_from_template({
            'select': '?entity ?attribute ?labelAttribute ?typeAttribute',
            'query': '?entity rdf:type owl:class .\n' +
                     '\t?attribute displaySetting:attribute "true"^^xsd:boolean .\n\n' +
                     '\t?attribute rdf:type owl:DatatypeProperty ;\n' +
                     '\t           rdfs:label ?labelAttribute ;\n' +
                     '\t           rdfs:domain ?entity ;\n' +
                     '\t           rdfs:range ?typeAttribute .\n\n' +
                     '\tVALUES ?entity { ' + entities + ' }\n' +
                     '\tVALUES ?typeAttribute { xsd:decimal xsd:string }'
        })
