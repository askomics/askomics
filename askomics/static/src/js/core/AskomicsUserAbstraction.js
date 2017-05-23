/*jshint esversion: 6 */

/*
  CLASSE AskomicsUserAbstraction
  Manage Abstraction storing in the TPS.
*/

class AskomicsUserAbstraction {
    constructor() {
      this.prefix = {};
      this.prefix_error = {};
      /* Ontology is save locally to avoid request with TPS  */
      /* --------------------------------------------------- */
      this.tripletSubjectRelationObject = [];
      this.entityInformationList = {}; /*   entityInformationList[g][uri1][rel] = uri2 ; */
      this.attributesEntityList = {};  /*   attributesEntityList[g][uri1] = [ att1, att2,... ] */
      this.entitySubclassof = {}    ;  /*   entitySubclassof[uri] = [uri1,...]*/
      this.desactived_graph = {};
      /* uri ->W get information about ref, taxon, start, end */
      this.entityPositionableInformationList = {}; /* entityPositionableInformationList[uri1] = { taxon, ref, start, end } */
      this.attributesOrderDisplay = {} ;           /* manage a order list by URInode */
    }

    longRDF(litteral) {
      if ( litteral === "" || litteral === undefined ) return litteral ;
      let idx = litteral.lastIndexOf(":");
      let p = this.getPrefix(litteral.substring(0,idx));
      return p+litteral.substring(idx+1);
    }

    shortRDF(litteral) {
      if ( litteral === "" || litteral === undefined ) return litteral ;
      for (let p in this.prefix ) {
        let idx = litteral.indexOf(this.prefix[p]);
        if ( idx !== -1 ) {
          return p+":"+litteral.substring(idx+this.prefix[p].length);
        }
      }
      return litteral;
    }

    getEntities() {
      let listE = {} ;
      for (let g in this.entityInformationList ) {
        if ( this.isDesactivedGraph(g) ) continue;
        for (let e in this.entityInformationList[g]) {
          if (! (e in listE ) ) {
            listE[e]=0;
          }
        }
      }
      return JSON.parse(JSON.stringify(listE)) ;
    }

    getAttributesEntity(uriEntity) {
      let listAtt = {};
      for (let g in this.attributesEntityList ) {
        if ( this.isDesactivedGraph(g) ) continue;
        if ( uriEntity in this.attributesEntityList[g] ) {
          for (let att in this.attributesEntityList[g][uriEntity]) {
            let uriAtt = this.attributesEntityList[g][uriEntity][att].uri;
            if (!(uriAtt in listAtt )) {
              listAtt[uriAtt]=this.attributesEntityList[g][uriEntity][att];
            }
          }
        }
      }
      return JSON.parse(JSON.stringify(Object.values(listAtt)));
    }

    getPositionableEntities() {
      return JSON.parse(JSON.stringify(this.entityPositionableInformationList)) ;
    }

    getTypeAttribute(attributeForUritype) {

      if ( attributeForUritype.indexOf(this.getPrefix("xsd")) === -1 ) {
          return "category";
      }

      if (attributeForUritype === this.longRDF("xsd:decimal")) {
        return "decimal";
      }
      if (attributeForUritype === this.longRDF("xsd:string")) {
        return "string";
      }
      if (attributeForUritype === this.longRDF("xsd:boolean")) {
        return "string";
      }
      if (attributeForUritype === this.longRDF("xsd:nonNegativeInteger")) {
        return "decimal";
      }
      if (attributeForUritype === this.longRDF("xsd:integer")) {
        return "decimal";
      }
      if (attributeForUritype === this.longRDF("xsd:float")) {
        return "decimal";
      }
      if (attributeForUritype === this.longRDF("xsd:int")) {
        return "decimal";
      }
      if (attributeForUritype === this.longRDF("xsd:long")) {
        return "decimal";
      }
      if (attributeForUritype === this.longRDF("xsd:short")) {
        return "decimal";
      }
      if (attributeForUritype === this.longRDF("xsd:byte")) {
        return "decimal";
      }
      if (attributeForUritype === this.longRDF("xsd:language")) {
        return "string";
      }
      return attributeForUritype;
    }
    /*
    load ontology
    see template SPARQL to know sparql variable
    */
    /* Request information in the model layer */
    //this.updateOntology();
    loadUserAbstraction(urlService) {

      let data = { };

      if ( urlService !== undefined ) {
        data.service= urlService ;
      }
      var service = new RestServiceJs("userAbstraction");

      let instanceUserAbstraction = this;

      service.postsync(data,function(resultListTripletSubjectRelationObject ) {
      /* All relation are stored in tripletSubjectRelationObject */
      instanceUserAbstraction.tripletSubjectRelationObject = resultListTripletSubjectRelationObject.relations;
      /* == External Service can add external relation == */
      //console.log("RELATIONS::"+JSON.stringify(instanceUserAbstraction.tripletSubjectRelationObject));

      instanceUserAbstraction.entityInformationList = {};
      instanceUserAbstraction.entityPositionableInformationList = {};
      instanceUserAbstraction.attributesEntityList = {};
      instanceUserAbstraction.entitySubclassof = {} ;

      /* All information about an entity available in TPS are stored in entityInformationList */
      for (let entry in resultListTripletSubjectRelationObject.entities){
        //console.log("ENTITY:"+JSON.stringify(resultListTripletSubjectRelationObject.entities[entry]));
        let graph = resultListTripletSubjectRelationObject.entities[entry].g;
        let uri = resultListTripletSubjectRelationObject.entities[entry].entity;
        let rel = resultListTripletSubjectRelationObject.entities[entry].property;
        let val = resultListTripletSubjectRelationObject.entities[entry].value;

        if ( ! (graph in instanceUserAbstraction.entityInformationList) ) {
          instanceUserAbstraction.entityInformationList[graph] = {} ;
        }
        if ( ! (uri in instanceUserAbstraction.entityInformationList[graph]) ) {
          instanceUserAbstraction.entityInformationList[graph][uri] = {};
        }
        instanceUserAbstraction.entityInformationList[graph][uri][rel] = val;

      }
      //console.log("entityInformationList:"+JSON.stringify(instanceUserAbstraction.entityInformationList));

	    for (let entry2 in resultListTripletSubjectRelationObject.attributes){
        //console.log("ATTRIBUTE:"+JSON.stringify(resultListTripletSubjectRelationObject.attributes[entry2]));
        let graph = resultListTripletSubjectRelationObject.attributes[entry2].g;
        let uri2 = resultListTripletSubjectRelationObject.attributes[entry2].entity;
        let attribute = {};

        attribute.uri   = resultListTripletSubjectRelationObject.attributes[entry2].attribute;
        attribute.label = resultListTripletSubjectRelationObject.attributes[entry2].labelAttribute;
        attribute.type  = resultListTripletSubjectRelationObject.attributes[entry2].typeAttribute;
        attribute.basic_type  = instanceUserAbstraction.getTypeAttribute(resultListTripletSubjectRelationObject.attributes[entry2].typeAttribute);


        if ( ! (graph in instanceUserAbstraction.attributesEntityList) ) {
            instanceUserAbstraction.attributesEntityList[graph] = [];
        }

        if ( ! (uri2 in instanceUserAbstraction.attributesEntityList[graph]) ) {
            instanceUserAbstraction.attributesEntityList[graph][uri2] = [];
        }
        instanceUserAbstraction.attributesEntityList[graph][uri2].push(attribute);

      }

        for (let entry3 in resultListTripletSubjectRelationObject.categories){
          //console.log("CATEGORY:"+JSON.stringify(resultListTripletSubjectRelationObject.categories[entry3]));
          let graph = resultListTripletSubjectRelationObject.categories[entry3].g;
          let uri3 = resultListTripletSubjectRelationObject.categories[entry3].entity;
          let attribute = {};
          attribute.uri   = resultListTripletSubjectRelationObject.categories[entry3].category;
          attribute.label = resultListTripletSubjectRelationObject.categories[entry3].labelCategory;
          attribute.type  = resultListTripletSubjectRelationObject.categories[entry3].typeCategory;
          attribute.basic_type  = 'category';

          if ( ! (graph in instanceUserAbstraction.attributesEntityList) ) {
              instanceUserAbstraction.attributesEntityList[graph] = [];
          }

          if ( ! (uri3 in instanceUserAbstraction.attributesEntityList[graph]) ) {
              instanceUserAbstraction.attributesEntityList[graph][uri3] = [];
          }

          instanceUserAbstraction.attributesEntityList[graph][uri3].push(attribute);
        }

        for (let entry4 in resultListTripletSubjectRelationObject.positionable){
          //console.log('POSITIONABLE:'+JSON.stringify(resultListTripletSubjectRelationObject.positionable[entry4]));
          var uri4 = resultListTripletSubjectRelationObject.positionable[entry4].entity;
          if ( ! (uri4 in instanceUserAbstraction.entityPositionableInformationList) ) {
              instanceUserAbstraction.entityPositionableInformationList[uri4] = {};
          } else {
            throw new Error("URI:"+uri4+" have several taxon,ref, start, end labels... "+JSON.stringify(instanceUserAbstraction.entityPositionableInformationList[uri4]));
          }
        }
        for (let entry in resultListTripletSubjectRelationObject.subclassof){
          let duo = resultListTripletSubjectRelationObject.subclassof[entry] ;
          console.log(JSON.stringify(duo));
          if ( ! (duo.uri in instanceUserAbstraction.entitySubclassof) ) {
            instanceUserAbstraction.entitySubclassof[duo.uri] = [];
          }
          instanceUserAbstraction.entitySubclassof[duo.uri].push(duo.urisub);
        }
        console.log(JSON.stringify(instanceUserAbstraction.entitySubclassof));
        //console.log("=================== attributesEntityList =========================");
        //console.log(JSON.stringify(instanceUserAbstraction.attributesEntityList));
      });
    }

    getPrefix(ns) {
      let instanceUserAbstraction = this;

      if (ns in this.prefix_error) {
        console.log("erreur.........................");
        return ns;
      }

      if (! (ns in this.prefix)) {
        //get info in prefix.cc
        //
        $.ajax({
          async: false,
          type: 'GET',
          url: 'http://prefix.cc/'+ns.trim()+'.file.json',
          success: function( result_json ) {
            instanceUserAbstraction.prefix[ns] = result_json[ns];
          },
          error: function(req, status, ex) {
            instanceUserAbstraction.prefix_error[ns] = true ;
          },
          timeout:30
        });
      }

      if (ns in this.prefix_error) {
        return ns;
      }

      return this.prefix[ns];
    }

    getAttribEntity(uriEntity,attrib) {
      return this.getGenAttrib(this.entityInformationList,uriEntity,attrib);
    }

    /* Get value of an attribut with RDF format like rdfs:label */
    getGenAttrib(diction,uriEntity,attrib) {

      let nattrib = attrib ;

      for (let graph in diction) {
        if ( this.isDesactivedGraph(graph) ) continue;

        if (!(uriEntity in diction[graph])) {
          continue;
        }

        if (!(nattrib in diction[graph][uriEntity])) {
          continue;
        }
        return diction[graph][uriEntity][nattrib];
      }
      return "";
    }

    /* build node from user abstraction infomation */
    buildBaseNode(uriEntity) {
      var node = {
        uri   : uriEntity,
        label : this.getAttribEntity(uriEntity,this.longRDF('rdfs:label'))
      } ;
      return node;
    }


    /*
    Get
    - relations with UriSelectedNode as a subject or object
    - objects link with Subject UriSelectedNode
    - Subjects link with Subject UriSelectedNode
     */

    getRelationsObjectsAndSubjectsWithURI(UriSelectedNode) {

      let objectsTarget = {} ;
      let subjectsTarget = {} ;

      let lentities = this.getEntities();

      for (let i in this.tripletSubjectRelationObject) {
        if (this.isDesactivedGraph(this.tripletSubjectRelationObject[i].g) ) continue;

        if ( this.tripletSubjectRelationObject[i].object == UriSelectedNode ) {
          /* check if graph is not removed */
          if ( !(this.tripletSubjectRelationObject[i].subject in lentities) ) continue;

          if (! (this.tripletSubjectRelationObject[i].subject in subjectsTarget) ) {
            subjectsTarget[this.tripletSubjectRelationObject[i].subject] = {};
          }
          if ( ! (this.tripletSubjectRelationObject[i].relation in subjectsTarget[this.tripletSubjectRelationObject[i].subject] ) )
            {
              subjectsTarget[this.tripletSubjectRelationObject[i].subject][this.tripletSubjectRelationObject[i].relation]=0;
            }
        }
        if ( this.tripletSubjectRelationObject[i].subject == UriSelectedNode ) {
          /* check if graph is not removed */
          if ( !(this.tripletSubjectRelationObject[i].object in lentities) ) continue;

          if (! (this.tripletSubjectRelationObject[i].object in objectsTarget) ) {
            objectsTarget[this.tripletSubjectRelationObject[i].object] = {};
          }

          if ( ! (this.tripletSubjectRelationObject[i].relation in objectsTarget[this.tripletSubjectRelationObject[i].object] ) )
            {
              objectsTarget[this.tripletSubjectRelationObject[i].object][this.tripletSubjectRelationObject[i].relation]=0;
            }
        }
      }
      for ( let i in objectsTarget ) {
        objectsTarget[i] = Object.keys(objectsTarget[i]);
      }
      for ( let i in subjectsTarget ) {
        subjectsTarget[i] = Object.keys(subjectsTarget[i]);
      }

      return [objectsTarget, subjectsTarget];
    }

    /* return a list of attributes according a uri node */
    getAttributesWithURI(UriSelectedNode) {
      let listAtt = {}; /* list attributes find for the entity*/
      let listGraphByUri = {}; /* list of graph where attributes are defined */
      for (let g in this.attributesEntityList ) {
        if ( this.isDesactivedGraph(g) ) continue;
        if ( UriSelectedNode in this.attributesEntityList[g] )
          for (let att in this.attributesEntityList[g][UriSelectedNode])  {
            let uriAtt =this.attributesEntityList[g][UriSelectedNode][att].uri;
            if ( ! (uriAtt in listAtt) ) {
              listAtt[uriAtt] = this.attributesEntityList[g][UriSelectedNode][att];
              listGraphByUri[uriAtt] = [];
            }
            listGraphByUri[uriAtt].push(g);
          }
      }
      return [Object.values(listAtt),listGraphByUri];
    }

    isPositionable(Uri) {
      return (Uri in this.entityPositionableInformationList);
    }

    /* Setting order attribute display */
    setOrderAttributesList(URINode,listAtt) {
      this.attributesOrderDisplay[URINode] = listAtt.slice();
    }

    getOrderAttributesList(URINode) {
      if ( URINode in this.attributesOrderDisplay ) {
        return this.attributesOrderDisplay[URINode];
      }
      /* by default */
      let v = {};
      //v[URINode] = { 'uri': URINode , 'basic_type' : 'string' , 'actif' : false };
      for (let g in this.attributesEntityList ) {
        if ( this.isDesactivedGraph(g) ) continue;
        if ( URINode in this.attributesEntityList[g] ) {
          for (let att in this.attributesEntityList[g][URINode]) {
            let uriAtt = this.attributesEntityList[g][URINode][att].uri;
            if ( ! (uriAtt in v) ) {
              v[uriAtt] = this.attributesEntityList[g][URINode][att];
            }
          }
        }
      }
      return [{ 'uri': URINode , 'basic_type' : 'string' , 'actif' : false }].concat(Object.values(v));

    }

    unactiveGraph(graph) {
      this.desactived_graph[graph] = 0;
    }
    activeGraph(graph) {
      delete this.desactived_graph[graph];
    }
    isDesactivedGraph(graph) {
      return (graph in this.desactived_graph);
    }

    listUnactivedGraph() {
      return JSON.parse(JSON.stringify(Object.keys(this.desactived_graph)));
    }

    listGraphAvailable() {
      let listG = {} ;
      for (let g in this.entityInformationList) {
        if (! (g in listG ) ) listG[g] = 0;
      }
      for (let g in this.attributesEntityList) {
        if (! (g in listG ) ) listG[g] = 0;
      }
      return JSON.parse(JSON.stringify(listG));
    }

    getSubclassof(uri) {
      if (uri in this.entitySubclassof ) return this.entitySubclassof[uri];
      return [];
    }
  }
