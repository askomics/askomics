/*jshint esversion: 6 */

/* constructeur de AskomicsGraphBuilder */
  class AskomicsGraphBuilder {
    constructor() {
      this.AskomicsGraphBuilderVersion = 1.0           ;
      /* ========================================= ATTRIBUTES ============================================= */
      this.SPARQLIDgeneration = {} ; /* { <ENT1> : 5, ... }  last index used to named variable */
      this.IDgeneration = 0;

      /* We keep information about instancied Node and Link to be able to rebuild graph */
      this._instanciedNodeGraph = [] ;
      this._instanciedLinkGraph = [] ;
    }

    nodes() {
      return this._instanciedNodeGraph;
    }

    links() {
      return this._instanciedLinkGraph;
    }
    /* create a dump to store data structure and finally the query */
    getInternalState() {
      return JSON.stringify([this.AskomicsGraphBuilderVersion,this._instanciedNodeGraph,this._instanciedLinkGraph,this.SPARQLIDgeneration,this.IDgeneration]);
    }

    /* create and return list of nodes and links to build a new grpah from a dump file */
    setNodesAndLinksFromState(dump) {
      try {
        let struct = JSON.parse(dump);

        let versionOfFile    = struct[0];
        this._instanciedNodeGraph = struct[1];
        this._instanciedLinkGraph = struct[2];
        this.SPARQLIDgeneration   = struct[3];
        this.IDgeneration         = struct[4];

        /* manage version */
        if ( versionOfFile !== AskomicsGraphBuilderVersion ) {
          alert("Dump file are builded with the Askomics Graph Builder Version:"+versionOfFile+"\n"+". Current version is "+ AskomicsGraphBuilderVersion +".\nReload of dump are not guaranteed !");
        }
        /* source and target don't have the good reference....we fix it*/
        for (var link of this._instanciedLinkGraph) {
            t = findElt(this._instanciedNodeGraph,link.source.id);
            if ( ! t ) {
              throw Error("Can not find node with ID:"+link.source.id);
            }

            link.source = t[1];
            t = findElt(this._instanciedNodeGraph,link.target.id);
            if ( ! t ) {
              throw Error("Can not find node with ID:"+link.target.id);
            }
            link.target = t[1];
        }
        return [this._instanciedNodeGraph,this._instanciedLinkGraph];
      } catch (ex) {
        console.error(ex);
      }
      return [[],[]];
    }

    addInstanciedElt(node) {
      this._instanciedNodeGraph.push(node);
    }

    addInstanciedLink(link) {
      this._instanciedLinkGraph.push(link);
    }

    static findElt(_array,id)  {
      var elt  = null ;
      var indexElt = -1;
      for (var i in _array ) {
        if (_array[i].id == id ) {
          elt = _array[i] ;
          indexElt = i;
          break;
        }
      }
      return [indexElt,elt];
    }
    /*
      remove a node and all node newest (and link) associated
    */
    removeInstanciedNode(node) {
      if ( this._instanciedNodeGraph[0].length <= 0 || this._instanciedNodeGraph[0].id == node.id ) {
        return [];
      }

      /* the method return list of links */
      var listLinkRemoved = [];

      /* search link associated with this node and a node with a id > (newest than idNode)*/
      var linkIndexToDelete = [];
      var i=0;
      while (i < this._instanciedLinkGraph.length ) {
        var link = this._instanciedLinkGraph[i++];

        var t1 = link.source.id == node.id,
            t2 = link.target.id == node.id;

        if (t1 || t2 ) {
          // find a link associated with node.id
          var currentNode = t1?link.source:link.target;
          var targetNode = t1?link.target:link.source;

          /* the second node is newest than node.id, we have to remove it ! */
          if ( targetNode.id > currentNode.id ) { // && targetNode in this._instanciedNodeGraph ) {
            // removing node
            listLinkRemoved = listLinkRemoved.concat(this.removeInstanciedNode(targetNode));
            i=0;
            continue; /* !!!!! reinit the loop because this._instanciedLinkGraph have change !!!!!!!!!! */
            //console.log("111:"+JSON.stringify(listLinkRemoved));
          }

          // removing link
          linkIndexToDelete.push(link.id);
          if ( currentNode.id in targetNode.nlink )
            delete targetNode.nlink[currentNode.id];
          if ( targetNode.id in currentNode.nlink )
            delete currentNode.nlink[targetNode.id];
        }
      }

      /* remove links */
      for (var l=linkIndexToDelete.length-1;l>=0;l--) {
        for (var j=0;j<this._instanciedLinkGraph.length;j++) {
          if ( this._instanciedLinkGraph[j].id == linkIndexToDelete[l] ) {
            listLinkRemoved.push(this._instanciedLinkGraph[j]);
            this._instanciedLinkGraph.splice(j, 1);
          }
        }
      }

      /* remove the node */
      for (var n in this._instanciedNodeGraph) {
        if ( this._instanciedNodeGraph[n].id == node.id ) {
          this._instanciedNodeGraph.splice(n, 1);
        //  console.log("222:"+JSON.stringify(listLinkRemoved));
          return listLinkRemoved;
        }
      }
      return listLinkRemoved;
    }

    removeInstanciedLink(link) {
      // finding link
      var t = findElt(this._instanciedLinkGraph,link.id);
      var removeNode = null;
      console.log(JSON.stringify(this._instanciedLinkGraph));

      var indexLinkNode = t[0];
      var linkNode = t[1] ;

      if ( indexLinkNode == -1 ) {
        throw new Error("AskomicsGraphBuilder.prototype.removeInstanciedLink id link unknown:"+link.id);
      }

      linkNode.source.nlink[linkNode.target.id]--;
      linkNode.target.nlink[linkNode.source.id]--;
      /* if no link between node then remove the newest node */
      if ( linkNode.source.nlink[linkNode.target.id] <= 0 ) {
        // keep the oldest node !
        if ( linkNode.source.id > linkNode.target.id ) {
          this.removeInstanciedNode(linkNode.source);
          removeNode = linkNode.source;
        } else {
          this.removeInstanciedNode(linkNode.target);
          removeNode = linkNode.target;
        }
      }
      //removing the link
      t = findElt(this._instanciedLinkGraph,link.id);
      if (t[0]>-1)
        this._instanciedLinkGraph.splice(t[0], 1);

        return removeNode;
    }

    /* create and return a new ID to instanciate a new SPARQL variate */
    setSPARQLVariateId(nodeOrLinkOrAttribute) {
      let lab = nodeOrLinkOrAttribute.label;
      if ( ! this.SPARQLIDgeneration[lab] ) {
        this.SPARQLIDgeneration[lab] = 0 ;
      }

      this.SPARQLIDgeneration[lab]++ ;
      nodeOrLinkOrAttribute.SPARQLid = lab+this.SPARQLIDgeneration[lab];
      return nodeOrLinkOrAttribute;
    }

    setId(node) {
      node.id = this.IDgeneration;
      this.IDgeneration++;
      return node;
    }

    setStartpoint(node) {
      node = this.setSuggestedNode(node,0,0);
      node = this.instanciateNode(node);
      return node;
    }


    getInstanciedNode(id) {
      for (var n of this._instanciedNodeGraph) {
        if (n.id == id ) return n;
      }
      return null;
    }

    getInstanciedLink(id) {
      for (var n of this._instanciedLinkGraph) {
        if (n.id == id) return n;
      }
      return null;
    }


    /* TODO : find a best solution to unactive a node without matching on sparql variable ID */
    switchActiveNode(node) {
          node.actif = !node.actif ;
    }

    setSuggestedNode(node,x,y) {
      // TODO: Create a builder node inside userAbstraction
      if ( userAbstraction.isPositionable(node.uri) ) {
        node = new AskomicsPositionableNode(node,x,y);
      } else {
        node = new AskomicsNode(node,x,y);
      }
      node = this.setId(node);
      return node;
    }

    instanciateNode(node) {
      node.suggested = false;
      node.actif = true ;
      this.setSPARQLVariateId(node);
      node.label = node.SPARQLid;
      this._instanciedNodeGraph.push(node);
      return node;
    }

    isInstanciatedNode(node) {

      for (var n of this._instanciedNodeGraph) {
        if (n.id === node.id)
          return true;
      }
      return false;
    }

    instanciateLink(links) {
      for (var l of links ) {
        l.suggested = false;
        this.setSPARQLVariateId(l);
        this._instanciedLinkGraph.push(l);
      }
    }

    /*
      return the name of the node without index  to set up and update the graph
    */
    getLabelNode(node) {
        var re = new RegExp(/(\d+)$/);
        var labelEntity = node.label.replace(re,"");

        return labelEntity;
      }

    /*
      return the index name of the node to set up and update the graph
    */
    getLabelIndexNode(node) {
          var re = new RegExp(/(\d+)$/);
          var indiceEntity = node.label.match(re);

          if ( indiceEntity && indiceEntity.length>0 )
            return indiceEntity[0];
          else
            return "";
      }

    /* Build attribute with id, sparId inside a node from a generic uri attribute */
    setAttributeOrCategoryForNode(AttOrCatArray,attributeForUri,node) {
      AttOrCatArray[attributeForUri.uri] = {} ;
      AttOrCatArray[attributeForUri.uri].type = attributeForUri.type ;
      AttOrCatArray[attributeForUri.uri].label = attributeForUri.label ;

      this.setSPARQLVariateId(AttOrCatArray[attributeForUri.uri]);
      this.setId(AttOrCatArray[attributeForUri.uri]);

      /* by default all attributes is ask */
      AttOrCatArray[attributeForUri.uri].actif = false ;
      return AttOrCatArray[attributeForUri.uri];
    }

    buildAttributeOrCategoryForNode(attributeForUri,node) {
      if (attributeForUri.type.indexOf("http://www.w3.org/2001/XMLSchema#") < 0) {
        return this.setAttributeOrCategoryForNode(node.categories,attributeForUri,node);
      }else {
        return this.setAttributeOrCategoryForNode(node.attributes,attributeForUri,node);
      }
    }

    getAttributeOrCategoryForNode(attributeForUri,node) {
      console.log(node.categories);
      if (attributeForUri.uri in node.categories ) {
        return node.categories[attributeForUri.uri];
      } else if (attributeForUri.uri in node.attributes) {
        return node.attributes[attributeForUri.uri];
      }
      return null;
    }

    switchActiveAttribute(uriId,nodeId) {
      for (var node of this._instanciedNodeGraph ) {
        if (node.id == nodeId ) {
          var a;
          for (a in node.attributes ) {
            if ( node.attributes[a].id == uriId ) {
              node.attributes[a].actif = !node.attributes[a].actif ;
              return ;
            }
          }
          for (a in node.categories ) {
            if ( node.categories[a].id == uriId ) {
              node.categories[a].actif = !node.categories[a].actif ;
              return ;
            }
          }
        }
      }
    }

    synchronizeInstanciatedNodesAndLinks(nodes,links) {
      var removeElt = [];
      var present = false;
      for ( var idn in nodes ) {
        if ( nodes[idn].suggested ) continue ;
        present = false ;
        for (var n of this._instanciedNodeGraph){
            if (n.id == nodes[idn].id) {
              present = true;
              break;
            }
        }
        if ( present ) continue ;
        removeElt.push(idn);

      }
      for ( var i = removeElt.length-1;i>=0;i--) {
        nodes.splice(removeElt[i],1);
      }

      removeElt = [];
      for ( var idl in links ) {
        if ( links[idl].suggested ) continue ;
        present = false ;
        for (var l of this._instanciedLinkGraph){
            if (l.id == links[idl].id) {
              present = true;
              break;
            }
        }
        if ( present ) continue ;
        removeElt.push(idl);

      }
      for ( var j = removeElt.length-1;j>=0;j--) {
        links.splice(removeElt[j],1);
      }
    }

    buildConstraintsGraphForCategory(nodeAttribute,attributeId) {
      let variates = [] ;
      let constraintRelations = [] ;
      let filters = [];
      let isOptional = false ; /* request too long with optional */

      let ua = userAbstraction;

      for (let idx=this._instanciedNodeGraph.length-1;idx>=0;idx--) {
        var node = this._instanciedNodeGraph[idx];
        if (nodeAttribute.id != node.id ) continue ;
        /* add node inside */
        constraintRelations.push(["?"+'URI'+node.SPARQLid,'rdf:type',ua.URI(node.uri)]);
        constraintRelations.push(["?"+'URI'+node.SPARQLid,'rdfs:label',"?"+node.SPARQLid]);

        /* for instance we don't filter category with attributes node but could be (very long request)*/
        if ( nodeAttribute.id != node.id ) continue;

        for (let uri in node.categories) {
            if ( node.categories[uri].id != attributeId ) continue;
            constraintRelations.push(["?"+'URI'+node.SPARQLid,ua.URI(uri),"?EntCat"+node.categories[uri].SPARQLid,isOptional]);
            constraintRelations.push(["?EntCat"+node.categories[uri].SPARQLid,'rdfs:label',"?"+node.categories[uri].SPARQLid,isOptional]);
            variates.push("?"+node.categories[uri].SPARQLid);
            return [variates,constraintRelations,filters] ;
        }
      }
      return [variates,constraintRelations,filters] ;
    }

    buildPositionableConstraintsGraph(infos,source,target,constraintRelations,filters) {

      var node = source ;
      var secondNode = target ;
      var ua = userAbstraction;

      var info = ua.getPositionableEntities();
      console.log("---- info positionable ----");
      console.log(JSON.stringify(info));

      taxonNodeId = node.categories[info[node.uri].taxon].SPARQLid;
      refNodeId = node.categories[info[node.uri].ref].SPARQLid;
      startNodeId = node.attributes[info[node.uri].start].SPARQLid;
      endNodeId = node.attributes[info[node.uri].end].SPARQLid;

      taxonSecNodeId = secondNode.categories[info[secondNode.uri].taxon].SPARQLid;
      refSecNodeId = secondNode.categories[info[secondNode.uri].ref].SPARQLid;
      startSecNodeId = secondNode.attributes[info[secondNode.uri].start].SPARQLid;
      endSecNodeId = secondNode.attributes[info[secondNode.uri].end].SPARQLid;


      constraintRelations.push([ua.URI(node.uri),'displaySetting:position_taxon',"?"+"id_taxon_"+node.SPARQLid]);
      constraintRelations.push([ua.URI(node.uri),'displaySetting:position_reference',"?"+"id_ref_"+node.SPARQLid]);
      constraintRelations.push([ua.URI(node.uri),'displaySetting:position_start',"?"+"id_start_"+node.SPARQLid]);
      constraintRelations.push([ua.URI(node.uri),'displaySetting:position_end',"?"+"id_end_"+node.SPARQLid]);

      constraintRelations.push([ua.URI(secondNode.uri),'displaySetting:position_taxon',"?"+"id_taxon_"+secondNode.SPARQLid]);
      constraintRelations.push([ua.URI(secondNode.uri),'displaySetting:position_reference',"?"+"id_ref_"+secondNode.SPARQLid]);
      constraintRelations.push([ua.URI(secondNode.uri),'displaySetting:position_start',"?"+"id_start_"+secondNode.SPARQLid]);
      constraintRelations.push([ua.URI(secondNode.uri),'displaySetting:position_end',"?"+"id_end_"+secondNode.SPARQLid]);

      /* constrainte to target the same ref/taxon */

      constraintRelations.push(["?"+'URI'+node.SPARQLid,"?"+"id_taxon_"+node.SPARQLid,"?"+taxonNodeId]);
      constraintRelations.push(["?"+'URI'+node.SPARQLid,"?"+"id_ref_"+node.SPARQLid,"?"+refNodeId]);

      constraintRelations.push(["?"+'URI'+secondNode.SPARQLid,"?"+"id_taxon_"+secondNode.SPARQLid,"?"+taxonSecNodeId]);
      constraintRelations.push(["?"+'URI'+secondNode.SPARQLid,"?"+"id_ref_"+secondNode.SPARQLid,"?"+refSecNodeId]);

      /* manage start and end variates */
      constraintRelations.push(["?"+'URI'+node.SPARQLid,"?"+"id_start_"+node.SPARQLid,"?"+startNodeId]);
      constraintRelations.push(["?"+'URI'+node.SPARQLid,"?"+"id_end_"+node.SPARQLid,"?"+endNodeId]);

      constraintRelations.push(["?"+'URI'+secondNode.SPARQLid,"?"+"id_start_"+secondNode.SPARQLid,"?"+startSecNodeId]);
      constraintRelations.push(["?"+'URI'+secondNode.SPARQLid,"?"+"id_end_"+secondNode.SPARQLid,"?"+endSecNodeId]);

      if (infos.strict) {
        equalsign = '';
      }else{
        equalsign = '=';
      }

      if (infos.same_ref) {
        filters.push('FILTER(' + "?"+refNodeId + "=" + "?"+refSecNodeId +')');
      }

      if (infos.same_tax) {
        filters.push('FILTER(' + "?"+taxonNodeId + "=" + "?"+taxonSecNodeId +')');
      }

      switch(infos.type) {
        case 'included' :
            filters.push('FILTER((?'+startSecNodeId+' >'+equalsign+' ?'+startNodeId+') && (?'+endSecNodeId+' <'+equalsign+' ?'+endNodeId+'))');
            break;
        case 'excluded':
            filters.push('FILTER(?'+endNodeId+' <'+equalsign+' ?'+startSecNodeId+' || ?'+startNodeId+' >'+equalsign+' ?'+endSecNodeId+')');
            break;

        case 'overlap':
            filters.push('FILTER(((?'+endSecNodeId+' >'+equalsign+' ?'+startNodeId+') && (?'+startSecNodeId+' <'+equalsign+' ?'+endNodeId+')) || ((?'+startSecNodeId+' <'+equalsign+' ?'+endNodeId+') && (?'+endSecNodeId+' >'+equalsign+' ?'+startNodeId+')))');
            break;

        case 'near':
          alert('sorry, near query is not implemanted yet !');
          hideModal();
          exit();
            break;

        default:
          throw new Error("AskomicsGraphBuilder.prototype.buildPositionableConstraintsGraph: unkown type :"+JSON.stringify(type));
      }
    }

    buildConstraintsGraph() {
      var variates = [] ;
      var constraintRelations = [] ;
      var filters = [];

      var constraintRelationsPositionable = [];
      var filtersPositionable = [];

      var isOptional = false ; /* request too long with optional */

      /* copy arrays to avoid to removed nodes and links instancied */
      var dup_node_array = $.extend(true, [], this._instanciedNodeGraph);
      var dup_link_array = $.extend(true, [], this._instanciedLinkGraph);

      var ua = userAbstraction;
      /* TODO: better if loop is inversed ?*/
      for (idx=0;idx<this._instanciedNodeGraph.length;idx++) {
        var node = dup_node_array[idx];

        /* add node inside */
        constraintRelations.push(["?"+'URI'+node.SPARQLid,'rdf:type',ua.URI(node.uri)]);
        constraintRelations.push(["?"+'URI'+node.SPARQLid,'rdfs:label',"?"+node.SPARQLid]);

        /* find relation with this node and add it as a constraint  */
        for (ilx=dup_link_array.length-1;ilx>=0;ilx--) {
          if ( (dup_link_array[ilx].source.id == node.id) ||  (dup_link_array[ilx].target.id == node.id) ) {
            if ( dup_link_array[ilx].positionable ) {

              var nodeSource = dup_link_array[ilx].source;
              var nodeTarget = dup_link_array[ilx].target ;
              var posInfos = {};
              posInfos.type = dup_link_array[ilx].type;
              posInfos.same_tax = dup_link_array[ilx].sameTax;
              posInfos.same_ref = dup_link_array[ilx].sameRef;
              posInfos.strict = dup_link_array[ilx].strict;

              this.buildPositionableConstraintsGraph(posInfos,nodeTarget,nodeSource,constraintRelationsPositionable,filtersPositionable);
            } else {
              constraintRelations.push(["?"+'URI'+dup_link_array[ilx].source.SPARQLid,ua.URI(dup_link_array[ilx].uri),"?"+'URI'+dup_link_array[ilx].target.SPARQLid]);
            }
            //remove link to avoid to add two same constraint
            dup_link_array.splice(ilx,1);
          }
        }


        /* adding variable node name if asked by the user */
        if (node.actif) {
          variates.push("?"+node.SPARQLid);
        }
        var SparqlId;
        var isFiltered;
        /* adding constraints about attributs about the current node */

        // add the filters on entity name
        if (node.SPARQLid in node.filters) {
          filters.push(node.filters[node.SPARQLid]);
        }

        for (var uri in node.attributes) {
            SparqlId = node.attributes[uri].SPARQLid;
            isFiltered =  SparqlId in node.filters;
            if ( isFiltered || node.attributes[uri].actif ) {
              constraintRelations.push(["?"+'URI'+node.SPARQLid,ua.URI(uri),"?"+node.attributes[uri].SPARQLid,isOptional]);
              constraintRelations.push([ua.URI(uri),'rdfs:domain',ua.URI(node.uri),isOptional]);
              constraintRelations.push([ua.URI(uri),'rdfs:range',ua.URI(node.attributes[uri].type),isOptional]);
              constraintRelations.push([ua.URI(uri),'rdf:type',ua.URI('owl:DatatypeProperty'),isOptional]);
              if ( node.actif && node.attributes[uri].actif) {
                variates.push("?"+node.attributes[uri].SPARQLid);
              }
              if ( isFiltered ) {
                filters.push(node.filters[SparqlId]);
              }
            }
        }
        for (uri in node.categories) {
          SparqlId = node.categories[uri].SPARQLid;
          isFiltered = SparqlId in node.filters;
          if ( isFiltered || node.categories[uri].actif ) {
            constraintRelations.push(["?"+'URI'+node.SPARQLid,ua.URI(uri),"?"+node.categories[uri].SPARQLid,isOptional]);

            //variates.push("?"+"EntCat"+node.categories[uri].SPARQLid);
            if ( node.actif && node.categories[uri].actif) {
              variates.push("?"+node.categories[uri].SPARQLid);
            }
            if ( isFiltered ) {
              filters.push(node.filters[SparqlId]);
            }
          }
        }
      }
      /* Add positionalme constraint and filter in last */
      for (i=0;i<constraintRelationsPositionable.length;i++) {
        constraintRelations.push(constraintRelationsPositionable[i]);
      }
      console.log("------------");
      for (i=0;i<filtersPositionable.length;i++) {
        console.log(filtersPositionable[i]);
        filters.push(filtersPositionable[i]);
      }
      console.log("------------");
      return [variates,constraintRelations,filters] ;
    }


   nodesDisplaying() {
      var list = [];
      for (var v of this._instanciedNodeGraph) {
        if (v.actif)
          list.push(v.SPARQLid);
      }
      return list ;
    }

    attributesDisplaying(SPARQLid) {
      var list = [];
      for (var v of this._instanciedNodeGraph) {
        if (v.SPARQLid == SPARQLid ) {
          for (var uriAtt in v.attributes) {
            if (v.attributes[uriAtt].actif) {
              list.push(v.attributes[uriAtt].SPARQLid);
            }
          }
          for (var uriCat in v.categories) {
            if (v.categories[uriCat].actif) {
              list.push(v.categories[uriCat].SPARQLid);
            }
          }
          return list;
        }
      }
    }

    setFilterAttributes(nodeId,SPARQLid,value,filter) {
      var tab = findElt(this._instanciedNodeGraph,nodeId);
      var node = tab[1];
      if (! node ) {
        throw Error("AskomicsGraphBuilder.prototype.setFilterAttributes don't find node id:"+nodeId);
      }
      if ($.trim(value) === "") { // case if user don't wan anymore a filter
        delete node.filters[SPARQLid];
        delete node.values[SPARQLid];
      } else {
        if (filter!=="") {
          node.filters[SPARQLid] = filter;
        }
        node.values[SPARQLid] = value; /* save value to restore it when the views need it*/
      }
    }

  }
