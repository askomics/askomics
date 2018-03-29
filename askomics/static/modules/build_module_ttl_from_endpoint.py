import random
import rdflib
import re
from rdflib import Graph, Literal, BNode, Namespace, RDF, URIRef
from rdflib.namespace import DC, FOAF, OWL, XSD, RDFS, RDF, DCTERMS, VOID

from SPARQLWrapper import SPARQLWrapper, JSON

#nameEnpoint="BNF"
#endpoint="http://data.bnf.fr/sparql"
#descriptionEnpoint="Bibliotheque nationale de France"

nameEnpoint="DBpedia"
endpoint="https://dbpedia.org/sparql"
descriptionEnpoint="DBpedia"

#nameEnpoint="LinkedMDB"
#endpoint="http://data.linkedmdb.org/sparql"
#descriptionEnpoint="the first open semantic web database for movies"

# upper this threshold the script build an ASKOMICS entities with theses relations
cutoffNbInstancesEntities = 10000
# Sample of elemntt to find relation
samplesize = 1000
# to simulate a random
offset = random.randint(10,samplesize)

Entities = {}

sparql = SPARQLWrapper(endpoint)

g = Graph()
ASKOMICS = Namespace("http://www.semanticweb.org/askomics/ontologies/2018/1#")
SD       = Namespace("http://www.w3.org/ns/sparql-service-description#")

service = BNode()

g.add( (service,RDF.type,SD.Service) )
g.add( (service,SD.endpoint,Literal(endpoint)) )
g.add( (service,DCTERMS.title,Literal(nameEnpoint)) )
g.add( (service,DCTERMS.description,Literal(descriptionEnpoint)) )

defaultDataset = BNode()
g.add( (service,SD.defaultDataset,defaultDataset) )
g.add( (defaultDataset,RDF.type,SD.Dataset) )

defaultGraph = BNode()
g.add( (defaultDataset,SD.defaultGraph,defaultGraph) )
g.add( (defaultGraph,RDF.type,SD.Graph) )

classPartition = BNode()
g.add( (defaultGraph,VOID.classPartition,classPartition) )

#print g.serialize(format='turtle')

##################" entities #################"""
sparql.setQuery("""
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
select distinct ?typeElt ?label where {
  ?elt a ?typeElt .
  OPTIONAL { ?typeElt rdfs:label ?label. }
} LIMIT 100
""")

sparql.setReturnFormat(JSON)
results = sparql.query().convert()

for result in results["results"]["bindings"]:
    #if result['typeElt']['value'] != "http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing":
    #    continue
    #print("#"+str(result['typeElt']['value'])+" => "+str(result['c']['value']))

    #if int(result['c']['value'])>cutoffNbInstancesEntities:
    uri = URIRef(result['typeElt']['value'])

    g.add( (classPartition,VOID['class'],uri) )

    g.add( (uri,ASKOMICS.entity,Literal('true', datatype=XSD.boolean)) )
    g.add( (uri,ASKOMICS.startPoint,Literal('true', datatype=XSD.boolean)) )

    if 'label' in result and result['label']['value'] != "":
        g.add( (uri,RDFS.label,Literal(result['label']['value'])) )
    else:
        v = re.split("[/#]",result['typeElt']['value'])
        g.add( (uri,RDFS.label,Literal(v[len(v)-1])) )

    Entities[uri] = {}
    Entities[uri]['relations'] = []
    Entities[uri]['relations_type'] = []
    Entities[uri]['relations_range'] = []

##################" relations with literal to build attributes #################"""

for uri in Entities :
    #print("# attributes relations for "+uri)
    sparql.setQuery("""
        select distinct ?relation ?isL where {
    		{
    		SELECT ?elt WHERE {
      			?elt a <"""+ uri + """> .
    		} ORDER BY ?elt OFFSET """ +str(offset)+""" LIMIT """ +str(samplesize)+"""
  			}
    		?elt ?relation ?value.
            BIND( isLiteral(?value) as ?isL ).
        }
    """)
    sparql.setReturnFormat(JSON)
    results = sparql.query().convert()

    for result in results["results"]["bindings"]:
        if result['relation']['value'] == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":
            continue
        if result['relation']['value'] == "http://www.w3.org/2000/01/rdf-schema#label":
            continue
        if result['relation']['value'] == "http://www.w3.org/2002/07/owl#sameAs":
            continue

        rel = URIRef(result['relation']['value'])

        Entities[uri]['relations'].append(rel)

        v = re.split("[/#]",result['relation']['value'])

        g.add( (rel,RDFS.label,Literal(v[len(v)-1])) )
        g.add( (rel,RDFS.domain,uri) )

        if bool(int(result['isL']['value'])):
            Entities[uri]['relations_type'].append(OWL.DatatypeProperty)
            g.add( (rel,ASKOMICS.attribute,Literal('true', datatype=XSD.boolean)) )
            g.add( (rel,RDF.type,OWL.DatatypeProperty) )

        else:
            Entities[uri]['relations_type'].append(OWL.ObjectProperty)
            g.add( (rel,RDF.type,OWL.ObjectProperty) )
## get type
for uri in Entities :
    for irel in range(len(Entities[uri]['relations'])):
        #print("# type attributes relations for "+Entities[uri]['relations'][irel])
        sparql.setQuery("""
            select distinct ?typeValue where {
                ?elt <""" + Entities[uri]['relations'][irel]+"""> ?value.
                ?value a ?typeValue .
            } limit 1
        """)
        sparql.setReturnFormat(JSON)
        results = sparql.query().convert()
        if len(results["results"]["bindings"])<=0:
            g.add( (Entities[uri]['relations'][irel],RDFS.range,XSD.string) )
        else:
            for result in results["results"]["bindings"]:
                rel = URIRef(result['typeValue']['value'])
                g.add( (Entities[uri]['relations'][irel],RDFS.range,rel) )

                Entities[uri]['relations_range'].append(result['typeValue']['value'])

##################" relations with Entities to build attributes #################"""

#print(str(Entities))

print g.serialize(format='turtle')
