/*jshint esversion: 6 */

/*
  CLASSE AskomicsUserAbstraction
  Manage Abstraction storing in the TPS.
*/
const prefix = {
 'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
 'xsd': 'http://www.w3.org/2001/XMLSchema#',
 'rdfs':'http://www.w3.org/2000/01/rdf-schema#',
 'owl': 'http://www.w3.org/2002/07/owl#'
 };

let instanceUserAbstraction ;

class AskomicsUserAbstraction {
   constructor() {
     /* Implement a Singleton */
     if ( instanceUserAbstraction !== undefined ) {
         return instanceUserAbstraction;
     }

      /* Ontology is save locally to avoid request with TPS  */
      /* --------------------------------------------------- */
      this.tripletSubjectRelationObject = [];
      this.entityInformationList = {}; /*   entityInformationList[uri1][rel] = uri2 ; */
      this.attributesEntityList = {};  /*   attributesEntityList[uri1] = [ att1, att2,... ] */

      /* uri ->W get information about ref, taxon, start, end */
      this.entityPositionableInformationList = {}; /* entityPositionableInformationList[uri1] = { taxon, ref, start, end } */
      this.attributesOrderDisplay = {} ;           /* manage a order list by URInode */

      instanceUserAbstraction = this;
      return instanceUserAbstraction;
    }

    getEntities() {
      return JSON.parse(JSON.stringify(Object.keys(this.entityInformationList))) ;
    }

    getAttributesEntity(uriEntity) {
      if ( uriEntity in this.attributesEntityList )
        return JSON.parse(JSON.stringify(this.attributesEntityList[uriEntity])) ;

      return [];
    }

    getPositionableEntities() {
      return JSON.parse(JSON.stringify(this.entityPositionableInformationList)) ;
    }

    /*
    load ontology
    see template SPARQL to know sparql variable
    */
    /* Request information in the model layer */
    //this.updateOntology();
    loadUserAbstraction() {
      var service = new RestServiceJs("userAbstraction");

      service.postsync({}, function(resultListTripletSubjectRelationObject ) {
      console.log("========================= ABSTRACTION =====================================================================");

      /* All relation are stored in tripletSubjectRelationObject */
      instanceUserAbstraction.tripletSubjectRelationObject = resultListTripletSubjectRelationObject.relations;
      /* == External Service can add external relation == */
      // TODO : Faire un systeme generique appelant tou les instance de service externe au lieu de mettre en dur le nom des services
      instanceUserAbstraction.tripletSubjectRelationObject = instanceUserAbstraction.tripletSubjectRelationObject.concat(GONode.getRemoteRelations());
      console.log("RELATIONS::"+JSON.stringify(instanceUserAbstraction.tripletSubjectRelationObject));


      instanceUserAbstraction.entityInformationList = {};
      instanceUserAbstraction.entityPositionableInformationList = {};
      instanceUserAbstraction.attributesEntityList = {};
      /* All information about an entity available in TPS are stored in entityInformationList */
      for (let entry in resultListTripletSubjectRelationObject.entities){
        console.log("ENTITY:"+JSON.stringify(resultListTripletSubjectRelationObject.entities[entry]));
        var uri = resultListTripletSubjectRelationObject.entities[entry].entity;
        var rel = resultListTripletSubjectRelationObject.entities[entry].property;
        var val = resultListTripletSubjectRelationObject.entities[entry].value;

        if ( ! (uri in instanceUserAbstraction.entityInformationList) ) {
            instanceUserAbstraction.entityInformationList[uri] = {};
        }
        instanceUserAbstraction.entityInformationList[uri][rel] = val;
      }
      console.log("entityInformationList:"+JSON.stringify(instanceUserAbstraction.entityInformationList));

	    for (let entry2 in resultListTripletSubjectRelationObject.attributes){
        console.log("ATTRIBUTE:"+JSON.stringify(resultListTripletSubjectRelationObject.attributes[entry2]));
        let uri2 = resultListTripletSubjectRelationObject.attributes[entry2].entity;
        let attribute = {};
        attribute.uri  = resultListTripletSubjectRelationObject.attributes[entry2].attribute;
        attribute.label = resultListTripletSubjectRelationObject.attributes[entry2].labelAttribute;
        attribute.type  = resultListTripletSubjectRelationObject.attributes[entry2].typeAttribute;

          if ( ! (uri2 in instanceUserAbstraction.attributesEntityList) ) {
              instanceUserAbstraction.attributesEntityList[uri2] = [];
          }

          instanceUserAbstraction.attributesEntityList[uri2].push(attribute);
        }

        for (var entry3 in resultListTripletSubjectRelationObject.categories){
          console.log("CATEGORY:"+JSON.stringify(resultListTripletSubjectRelationObject.categories[entry3]));
          var uri3 = resultListTripletSubjectRelationObject.categories[entry3].entity;
          let attribute = {};
          attribute.uri  = resultListTripletSubjectRelationObject.categories[entry3].category;
          attribute.label = resultListTripletSubjectRelationObject.categories[entry3].labelCategory;
          attribute.type  = resultListTripletSubjectRelationObject.categories[entry3].typeCategory;

          if ( ! (uri3 in instanceUserAbstraction.attributesEntityList) ) {
              instanceUserAbstraction.attributesEntityList[uri3] = [];
          }

          instanceUserAbstraction.attributesEntityList[uri3].push(attribute);
        }

        for (var entry4 in resultListTripletSubjectRelationObject.positionable){
          console.log('POSITIONABLE:'+JSON.stringify(resultListTripletSubjectRelationObject.positionable[entry4]));
          var uri4 = resultListTripletSubjectRelationObject.positionable[entry4].entity;
          if ( ! (uri4 in instanceUserAbstraction.entityPositionableInformationList) ) {
              instanceUserAbstraction.entityPositionableInformationList[uri4] = {};
          } else {
            throw new Error("URI:"+uri4+" have several taxon,ref, start, end labels... "+JSON.stringify(instanceUserAbstraction.entityPositionableInformationList[uri4]));
          }
        }
      });
    }

    /* Get value of an attribut with RDF format like rdfs:label */
    getAttrib(uriEntity,attrib) {
        if (!(uriEntity in this.entityInformationList)) {
          console.log(JSON.stringify(uriEntity) + " is not referenced in the user abstraction !");
          return "<"+uriEntity+">";
        }
        var attrib_longterm = attrib ;
        for (var p in prefix) {
          var i = attrib_longterm.search(p+":");
          if ( i != - 1) {
            attrib_longterm = attrib_longterm.replace(p+":",prefix[p]);
            break;
          }
        }

        if (!(attrib_longterm in this.entityInformationList[uriEntity])) {
          console.log(JSON.stringify(uriEntity) + '['+JSON.stringify(attrib)+']' + " is not referenced in the user abstraction !");

          return "<unknown>";
        }

        return this.entityInformationList[uriEntity][attrib_longterm];
    }

    /* build node from user abstraction infomation */
    buildBaseNode(uriEntity) {
      var node = {
        uri   : uriEntity,
        label : this.getAttrib(uriEntity,'rdfs:label')
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

      var objectsTarget = {} ;
      var subjectsTarget = {} ;

      for (var i in this.tripletSubjectRelationObject) {
        if ( this.tripletSubjectRelationObject[i].object == UriSelectedNode ) {
          if (! (this.tripletSubjectRelationObject[i].subject in subjectsTarget) ) {
            subjectsTarget[this.tripletSubjectRelationObject[i].subject] = [];
          }
          subjectsTarget[this.tripletSubjectRelationObject[i].subject].push(this.tripletSubjectRelationObject[i].relation);
        }
        if ( this.tripletSubjectRelationObject[i].subject == UriSelectedNode ) {
          if (! (this.tripletSubjectRelationObject[i].object in objectsTarget) ) {
            objectsTarget[this.tripletSubjectRelationObject[i].object] = [];
          }
          objectsTarget[this.tripletSubjectRelationObject[i].object].push(this.tripletSubjectRelationObject[i].relation);
        }
      }
      // TODO: Manage Doublons and remove it....

      return [objectsTarget, subjectsTarget];
    }

    /* return a list of attributes according a uri node */
    getAttributesWithURI(UriSelectedNode) {
      if ( UriSelectedNode in this.attributesEntityList )
        return this.attributesEntityList[UriSelectedNode];
      return [];
    }

    isPositionable(Uri) {
      return (Uri in this.entityPositionableInformationList);
    }

    isGoterm(Uri) {
      // TODO using prefix.cc to update entityInformationList
      return (Uri === "http://purl.org/obo/owl/GO#term");
    }

    /* Setting order attribute display */
    setOrderAttributesList(URINode,listAtt) {
      this.attributesOrderDisplay[URINode] = {};
      this.attributesOrderDisplay[URINode] = listAtt.slice();
    }

    getOrderAttributesList(URINode) {
      if ( URINode in this.attributesOrderDisplay ) {
        return this.attributesOrderDisplay[URINode];
      }
      /* by default */
      let v = [];
      v.push(URINode);
      for (let i in this.attributesEntityList[URINode] ) {
          v.push(this.attributesEntityList[URINode][i].uri);
      }
      return v;
    }
  }
