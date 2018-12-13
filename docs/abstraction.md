# Abstraction
## Definition
What we called abstraction is the askomics ontology, this is what describe the data.
It is quite small and defines what is a bubble and what is a link the the graphical interface.
Its prefix is "askomics:".
* entity : what will be bubble, usually a owl:Class
* startPoint : an entity that could start an askomics query. What will be displayed in the first query page.
* attribute : what will be links between bubbles or bubble and value.
* category : what will be choice list, used in some attribute value.

## Turtle Example
Here i show you the minimal information to provide as an abstraction.
### prefixes
```
@prefix xsd:      <http://www.w3.org/2001/XMLSchema#>
@prefix owl:      <http://www.w3.org/2002/07/owl#> .
@prefix rdfs:     <http://www.w3.org/2000/01/rdf-schema#> .
@prefix askomics: <askomics_is_good#> .
@base <scrap#> .
```
### entity
```
# entity (startpoint to have a start, can be avoid in standard entity)
<People>
            askomics:entity "true"^^xsd:boolean ;
            rdfs:label "People"^^xsd:string ;
            askomics:startPoint "true"^^xsd:boolean ;
.
```
### \<entity> --relation--> value
```
# attribute DatatypeProperty
<First_name>
            askomics:attribute "true"^^xsd:boolean ;
            rdf:type    owl:DatatypeProperty ;
            rdfs:label  "First_name"^^xsd:string ;
            rdfs:domain <People> ;
            rdfs:range  xsd:string ;
.
```
### \<entity> --relation--> category=short list
```
# attribute DatatypeProperty
<Sex>
        askomics:attribute "true"^^xsd:boolean ;
        rdf:type    owl:DatatypeProperty ;
        rdfs:label  "Sex"^^xsd:string ;
        rdfs:domain <People> ;
        rdfs:range  <SexCategory> ;
.
<SexCategory>
        askomics:category <M>, <F> ;
.
<M>
    rdfs:label "M"^^xsd:string ;
.
<F>
    rdfs:label "F"^^xsd:string ;
.

```
### \<entity> --relation--> \<entity>
```
# attribute ObjectProperty
<PlayWith>
        askomics:attribute "true"^^xsd:boolean ;
        rdf:type    owl:ObjectProperty ;
        rdfs:label  "play with"^^xsd:string ;
        rdfs:domain <People> ;
        rdfs:range  <People> ;
.
```

full file in [people_mini.abstract.ttl](./people_mini.abstract.ttl)

## Python Management Code
As seen abose, we have 2 kinds of class, "entity" and "attribute"/relation.
To manage them (~get turtle strings), we use the 2 classes ```AbstractedEntity__``` and ```AbstractedRelation__``` in libaskomics/integration.

cf __python doc__ to have details.
### basics uses
```python
ttl  += AbstractedEntity__( uri, label, startpoint=True ).get_turtle()
ttl  += AbstractedRelation__( uri, rdf_type, domain, range_, label ).get_turtle()
```
