import logging
# from pprint import pformat
# from string import Template

# from askomics.libaskomics.rdfdb.SparqlQuery import SparqlQuery
# from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder

class SparqlQueryGraph(SparqlQueryBuilder):
    """
    This class contain method to build a sparql query to
    extract data from public and private graph
    It replace the template files
    """

    def __init__(self, settings, session):
        SparqlQueryBuilder.__init__(self, settings, session)
        self.log = logging.getLogger(__name__)

    def query_exemple(self):
        """
        Query exemple. used for testing
        """
        return self.build_query_on_the_fly({
            'select': '?s ?p ?o',
            'from'  : '*',
            'query': '?s ?p ?o .'
            })

    def get_start_point(self):
        """
        Get the start point and in which graph they are
        """
        self.log.debug('---> get_start_point')
        return self.build_query_on_the_fly({
            'select': '?g ?nodeUri ?nodeLabel ?accesLevel',
            'query': 'GRAPH ?g {\n'+
                     '\t?nodeUri displaySetting:entity "true"^^xsd:boolean .\n' +
                     '\t?nodeUri displaySetting:startPoint "true"^^xsd:boolean .\n' +
                     '\t?nodeUri rdfs:label ?nodeLabel.\n'+
                     "}\n"+
                     "{ { ?g :accessLevel ?accesLevel VALUES ?accesLevel {'public'} } "+
                     " UNION "+
                     "{ ?g :accessLevel ?accesLevel.\n "+
                       "?g dc:creator '" + self.session['username'] + "' }\n"+
                      "}."
        },True)

    def get_entities_availables(self):
        """
        Get the list of entities
        """
        self.log.debug('---> get_public_graphs')
        return self.build_query_on_the_fly({
            'select': '?g ?uri',
            'query': 'GRAPH ?g {\n'+
                     '?uri displaySetting:entity "true"^^xsd:boolean.\n'+
                     "} { ?g dc:creator ?d.} \n"
        })

    def get_public_graphs(self):
        """
        Get the list of public named graph
        """
        self.log.debug('---> get_public_graphs')
        return self.build_query_on_the_fly({
            'select': '?g',
            'query': 'GRAPH ?g {\n'+
                     '?s ?p ?o.\n'+
                     "}\n"+
                     "{ ?g :accessLevel 'public'. } "
        },True)

    def get_private_graphs(self):
        """
        Get the list of privat named graph
        """
        self.log.debug('---> get_private_graphs')
        return self.build_query_on_the_fly({
            'select': '?g (count(*) as ?co)',
            'query': 'GRAPH ?g {\n'+
                 '?s ?p ?o.\n'+
                 "}\n"+
                 "{ ?g dc:creator '" + self.session['username'] + "' . } "
        },True)


    def get_if_positionable(self, uri):
        """
        Get if an entity is positionable
        """
        self.log.debug('---> get_if_positionable')
        return self.build_query_on_the_fly({
            'select': '?exist',
            'query': 'BIND(EXISTS {<' + uri + '> displaySetting:is_positionable "true"^^xsd:boolean} AS ?exist)'
        })

    def get_common_pos_attr(self, uri1, uri2):
        """
        Get the common positionable attributes between 2 entity
        """
        self.log.debug('---> get_common_pos_attr')
        return self.build_query_on_the_fly({
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
        return self.build_query_on_the_fly({
            'select': '?taxon',
            'query': ':taxonCategory displaySetting:category ?URItax .\n' +
                     '\t?URItax rdfs:label ?taxon'
        })

    def get_abstraction_attribute_entity(self, entities):
        """
        Get all attributes of an entity
        """
        return self.build_query_on_the_fly({
            'select': '?g ?entity ?attribute ?labelAttribute ?typeAttribute',
            'query': 'GRAPH ?g {\n' +
                     '\t?entity displaySetting:entity "true"^^xsd:boolean .\n\n' +
                     '\t?attribute displaySetting:attribute "true"^^xsd:boolean .\n\n' +
                     '\t?attribute rdf:type owl:DatatypeProperty ;\n' +
                     '\t           rdfs:label ?labelAttribute ;\n' +
                     '\t           rdfs:domain ?entity ;\n' +
                     '\t           rdfs:range ?typeAttribute .\n\n' +
                     '\tVALUES ?entity { ' + entities + ' }\n' +
                     '\tVALUES ?typeAttribute { xsd:decimal xsd:string } \n'+
                     '} { ?g dc:creator ?d.}'
        })

    def get_abstraction_relation(self, prop):
        """
        Get the relation of an entity
        """
        return self.build_query_on_the_fly({
            'select': '?g ?subject ?relation ?object',
            'query': 'GRAPH ?g { ?relation rdf:type ' + prop + ' ;\n' +
                     '\t          rdfs:domain ?subject ;\n' +
                     '\t          rdfs:range ?object .\n'+
                     '\t?subject displaySetting:entity "true"^^xsd:boolean .\n\n' +
                     '\t} { ?g dc:creator ?d.}'
            })


    def get_abstraction_entity(self, entities):
        """
        Get theproperty of an entity
        """
        return self.build_query_on_the_fly({
            'select': '?g ?entity ?property ?value',
            'query': 'GRAPH ?g { ?entity ?property ?value .\n' +
                     '\t?entity displaySetting:entity "true"^^xsd:boolean .\n' +
                     '\tVALUES ?entity { ' + entities + ' } } { ?g dc:creator ?d.}'
            })

    def get_abstraction_positionable_entity(self):
        """
        Get all positionable entities
        """
        return self.build_query_on_the_fly({
            'select': '?entity',
            'query': '?entity displaySetting:entity "true"^^xsd:boolean .\n' +
                     '\t?entity displaySetting:is_positionable "true"^^xsd:boolean .'
            })

    def get_abstraction_category_entity(self, entities):
        """
        Get the category of an entity
        """
        return self.build_query_on_the_fly({
            'select': '?g ?entity ?category ?labelCategory ?typeCategory',
            'query': 'GRAPH ?g { ?entity displaySetting:entity "true"^^xsd:boolean .\n' +
                     '\t?typeCategory displaySetting:category [] .\n' +
                     '\t?category rdf:type owl:ObjectProperty ;\n' +
                     '\t            rdfs:label ?labelCategory ;\n' +
                     '\t            rdfs:domain ?entity;\n' +
                     '\t            rdfs:range ?typeCategory\n' +
                     '\tVALUES ?entity { ' + entities + ' } }'
            })

    def get_class_info_from_abstraction(self, node_class):
        """
        get
        """
        return self.build_query_on_the_fly({
            'select': '?relation_label',
            'query': '?class rdf:type owl:Class .\n' +
                     '\tOPTIONAL { ?relation rdfs:domain ?class } .\n' +
                     '\tOPTIONAL { ?relation rdfs:range ?range } .\n' +
                     '\tOPTIONAL { ?relation rdfs:label ?relation_label } .\n' +
                     '\tVALUES ?class { :' + node_class + ' }'
            })
