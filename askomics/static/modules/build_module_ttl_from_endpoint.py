import random
import rdflib
import re
from rdflib import Graph, Literal, BNode, Namespace, RDF, URIRef
from rdflib.namespace import DC, FOAF, OWL, XSD, RDFS, RDF, DCTERMS, VOID

from SPARQLWrapper import SPARQLWrapper, JSON


#nameEnpoint="Dbpedia"
#endpoint="https://dbpedia.org/sparql"
#descriptionEnpoint="DBPEDIA"

nameEnpoint="BNF"
endpoint="http://data.bnf.fr/sparql"
descriptionEnpoint="Bibliotheque nationale de France"

#nameEnpoint="Uniprot"
#endpoint="http://sparql.uniprot.org/sparql"
#descriptionEnpoint="Linked Open Data platform for UniProt data"

#nameEnpoint="LinkedMDB"
#endpoint="http://data.linkedmdb.org/sparql"
#descriptionEnpoint="the first open semantic web database for movies"
# Limit number entity discovering

#nameEnpoint="GeoSPARQL"
#endpoint="http://www.lotico.com:3030/lotico/sparql"
#descriptionEnpoint="GeoSPARQL"

#nameEnpoint="WikiData"
#endpoint="https://query.wikidata.org/sparql"
#descriptionEnpoint="WikiData"


numEntityCutOff = 200

# upper this threshold the script build an ASKOMICS entities with theses relations
cutoffNbInstancesEntities = 20
# Sample of elemntt to find relation
samplesize = 1000
# to simulate a random
offset = random.randint(10,samplesize)

Entities = {}

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

def addEntity(graph,uri):
    if uri.n3() in Entities:
        return
    print("### "+uri+" ###")
    Entities[uri.n3()] = True
    sparql = SPARQLWrapper(endpoint)
    sparql.setQuery("""
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    select distinct ?label where {
      OPTIONAL { <"""+uri+"""> rdfs:label ?label. }
    } GROUP BY ?label
    """)
    sparql.setReturnFormat(JSON)
    results = sparql.query().convert()

    g.add( (classPartition,VOID['class'],uri) )
    g.add( (uri,ASKOMICS.entity,Literal('true', datatype=XSD.boolean)) )
    g.add( (uri,ASKOMICS.startPoint,Literal('true', datatype=XSD.boolean)) )

    for result in results["results"]["bindings"]:
        if 'label' in result and result['label']['value'] != "":
            g.add( (uri,RDFS.label,Literal(result['label']['value'])) )
        else:
            v = re.split("[/#]",str(uri))
            g.add( (uri,RDFS.label,Literal(v[len(v)-1])) )

    #attribute and relations
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

        v = re.split("[/#]",result['relation']['value'])

        g.add( (rel,RDFS.label,Literal(v[len(v)-1])) )
        g.add( (rel,RDFS.domain,uri) )
        isLiteral = False

        if result['isL']['value'].lower() == 'true' or result['isL']['value'].lower() == 'false' :
            isLiteral = (result['isL']['value'].lower() == 'true')
        else:
            isLiteral = bool(int(result['isL']['value']))

        if isLiteral:
            print("#    attribute:"+rel)
            g.add( (rel,ASKOMICS.attribute,Literal('true', datatype=XSD.boolean)) )
            g.add( (rel,RDF.type,OWL.DatatypeProperty) )
            g.add( (rel,RDFS.range,XSD.string) )
        else:
            print("#    relation:"+rel)
            g.add( (rel,RDF.type,OWL.ObjectProperty) )
            sparql2 = SPARQLWrapper(endpoint)
            sparql2.setQuery("""
                select distinct ?typeValue where {
                    ?elt <""" + rel +"""> ?value.
                    ?value a ?typeValue .
                } limit 1
            """)
            sparql2.setReturnFormat(JSON)
            results2 = sparql2.query().convert()

            for result2 in results2["results"]["bindings"]:
                relVal = URIRef(result2['typeValue']['value'])
                g.add( (rel,RDFS.range,relVal) )
                #.... recursivity ....
                addEntity(graph,relVal)

######Test
#addEntity(g,URIRef("http://www.geonames.org/ontology#Airport"))
#print g.serialize(format='turtle')
#sys.exit()

##################" entities #################"""
sparql = SPARQLWrapper(endpoint)
sparql.setQuery("""
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
select distinct ?typeElt (count(?elt) as ?co) where {
  ?elt a ?typeElt .
} GROUP BY ?typeElt ORDER BY DESC(?co) LIMIT """+str(numEntityCutOff)+"""
""")

sparql.setReturnFormat(JSON)
results = sparql.query().convert()

for result in results["results"]["bindings"]:
    if int(result['co']['value'])<cutoffNbInstancesEntities:
        continue

    uri = URIRef(result['typeElt']['value'])
    addEntity(g,uri)



print g.serialize(format='turtle')
