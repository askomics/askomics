/*jshint esversion: 6 */

/* constructeur de AskomicsGraphBuilder */
  var AskomicsGraphBuilder = function () {
    var AskomicsGraphBuilderVersion = 1.0           ;
    /* ========================================= ATTRIBUTES ============================================= */
    var SPARQLIDgeneration = {} ; /* { <ENT1> : 5, ... }  last index used to named variable */
    var IGgeneration = 0;

    /* We keep information about instancied Node and Link to be able to rebuild graph */
    var _instanciedNodeGraph = [] ;
    var _instanciedLinkGraph = [] ;

    AskomicsGraphBuilder.prototype.nodes = function() {
      return _instanciedNodeGraph;
    };

    AskomicsGraphBuilder.prototype.links = function() {
      return _instanciedLinkGraph;
    };
    /* create a dump to store data structure and finally the query */
    AskomicsGraphBuilder.prototype.getInternalState = function() {
      return JSON.stringify([AskomicsGraphBuilderVersion,_instanciedNodeGraph,_instanciedLinkGraph,SPARQLIDgeneration,IGgeneration]);
    };

    /* create and return list of nodes and links to build a new grpah from a dump file */
    AskomicsGraphBuilder.prototype.setNodesAndLinksFromState = function(dump) {
      try {
        var struct = JSON.parse(dump);
        
        var versionOfFile    = struct[0];
        _instanciedNodeGraph = struct[1];
        _instanciedLinkGraph = struct[2];
        SPARQLIDgeneration   = struct[3];
        IGgeneration         = struct[4];

        /* manage version */
        if ( versionOfFile !== AskomicsGraphBuilderVersion ) {
          alert("Dump file are builded with the Askomics Graph Builder Version:"+versionOfFile+"\n"+". Current version is "+ AskomicsGraphBuilderVersion +".\nReload of dump are not guaranteed !");
        }
        /* source and target don't have the good reference....we fix it*/
        for (var link of _instanciedLinkGraph) {
            t = this.findElt(_instanciedNodeGraph,link.source.id);
            if ( ! t ) {
              throw Error("Can not find node with ID:"+link.source.id);
            }

            link.source = t[1];
            t = this.findElt(_instanciedNodeGraph,link.target.id);
            if ( ! t ) {
              throw Error("Can not find node with ID:"+link.target.id);
            }
            link.target = t[1];
        }
        return [_instanciedNodeGraph,_instanciedLinkGraph];
      } catch (ex) {
        console.error(ex);
      }
      return [[],[]];
    };

    AskomicsGraphBuilder.prototype.addInstanciedElt = function(node) {
      _instanciedNodeGraph.push(node);
    };

    AskomicsGraphBuilder.prototype.addInstanciedLink = function(link) {
      _instanciedLinkGraph.push(link);
    };

    AskomicsGraphBuilder.prototype.findElt = function(_array,id)  {
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
    };
    /*
      remove a node and all node newest (and link) associated
    */
    AskomicsGraphBuilder.prototype.removeInstanciedNode = function(node) {
      if ( _instanciedNodeGraph[0].length <= 0 || _instanciedNodeGraph[0].id == node.id ) {
        return [];
      }

      /* the method return list of links */
      var listLinkRemoved = [];

      /* search link associated with this node and a node with a id > (newest than idNode)*/
      var linkIndexToDelete = [];
      var i=0;
      while (i < _instanciedLinkGraph.length ) {
        var link = _instanciedLinkGraph[i++];

        var t1 = link.source.id == node.id,
            t2 = link.target.id == node.id;

        if (t1 || t2 ) {
          // find a link associated with node.id
          var currentNode = t1?link.source:link.target;
          var targetNode = t1?link.target:link.source;

          /* the second node is newest than node.id, we have to remove it ! */
          if ( targetNode.id > currentNode.id ) { // && targetNode in _instanciedNodeGraph ) {
            // removing node
            listLinkRemoved = listLinkRemoved.concat(this.removeInstanciedNode(targetNode));
            i=0;
            continue; /* !!!!! reinit the loop because _instanciedLinkGraph have change !!!!!!!!!! */
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
        for (var j=0;j<_instanciedLinkGraph.length;j++) {
          if ( _instanciedLinkGraph[j].id == linkIndexToDelete[l] ) {
            listLinkRemoved.push(_instanciedLinkGraph[j]);
            _instanciedLinkGraph.splice(j, 1);
          }
        }
      }

      /* remove the node */
      for (var n in _instanciedNodeGraph) {
        if ( _instanciedNodeGraph[n].id == node.id ) {
          _instanciedNodeGraph.splice(n, 1);
        //  console.log("222:"+JSON.stringify(listLinkRemoved));
          return listLinkRemoved;
        }
      }
      return listLinkRemoved;
    };
    AskomicsGraphBuilder.prototype.removeInstanciedLink = function(idLink) {
      // finding link
      var t = findElt(_instanciedLinkGraph,idLink);

      var indexLinkNode = t[0];
      var linkNode = t[1] ;

      if ( indexLinkNode === -1 ) {
        throw new Error("AskomicsGraphBuilder.prototype.removeInstanciedLink id link unknown:"+idLink);
      }

      linkNode.source.id.nlink[linkNode.target.id]--;
      linkNode.target.id.nlink[linkNode.source.id]--;
      /* if no link between node then remove the newest node */
      if ( linkNode.source.id.nlink[linkNode.target.id] <= 0 ) {
        // keep the oldest node !
        if ( linkNode.source.id > linkNode.target.id ) {
          this.removeInstanciedNode(linkNode.source);
        } else {
          this.removeInstanciedNode(linkNode.target);
        }
      }
      //removing the link
      t = findElt(_instanciedLinkGraph,idLink);
      if (t[0]>-1)
        _instanciedLinkGraph.splice(t[0], 1);
    };

    /* create and return a new ID to instanciate a new SPARQL variate */
    AskomicsGraphBuilder.prototype.setSPARQLVariateId = function(nodeOrLinkOrAttribute) {
      lab = nodeOrLinkOrAttribute.label;
      if ( ! SPARQLIDgeneration[lab] ) {
        SPARQLIDgeneration[lab] = 0 ;
      }

      SPARQLIDgeneration[lab]++ ;
      nodeOrLinkOrAttribute.SPARQLid = lab+SPARQLIDgeneration[lab];
      return nodeOrLinkOrAttribute;
    };

    AskomicsGraphBuilder.prototype.setId = function(node) {
      node.id = IGgeneration;
      IGgeneration++;
      return node;
    };

    AskomicsGraphBuilder.prototype.setStartpoint = function(node) {
      this.setSuggestedNode(node,0,0);
      this.instanciateNode(node);
      return node;
    };


    AskomicsGraphBuilder.prototype.getInstanciedNodeFromSparqlId = function(sparlId) {
      for (var n of _instanciedNodeGraph) {
        if (n.SPARQLid === sparlId ) return n;
      }
      throw new Error("AskomicsGraphBuilder.prototype.getInstanciedNodeFromSparqlId : could not find Instanciate Node with SparqlId:"+sparlId);
    };

    AskomicsGraphBuilder.prototype.getInstanciedLinkFromSparqlId = function(sparqlId) {
      for (var n of _instanciedLinkGraph) {
        if (n.label === sparqlId) return n;
      }
      throw new Error("AskomicsGraphBuilder.prototype.getInstanciedLinkFromSparqlId : could not find Instanciate Link with SparqlId:"+sparlId);
    };


    /* TODO : find a best solution to unactive a node without matching on sparql variable ID */
    AskomicsGraphBuilder.prototype.switchActiveNode = function(node) {
          node.actif = !node.actif ;
    };

    AskomicsGraphBuilder.prototype.setSuggestedNode = function(node,x,y) {
      node.suggested    = true;
      node.positionable = userAbstraction.isPositionable(node.uri);
      node.actif = false ;
      /* if this future node have the same coordinate with the previous node , the graphe move too much ! */
      var sc = 30;
      var scaleX = Math.random()<0.5?-1:1;
      var scaleY = Math.random()<0.5?-1:1;
      node.x = x+scaleX*sc;
      node.y = y+scaleY*sc;
      this.setId(node);
      node.name = node.label;
      node.weight = 0;
      node.nlink = {}; // number of relation with a node.
      node.attributes = {} ;
      node.categories = {} ;
      node.filters = {} ;/* filters of attributes key:sparqlid*/
      node.values = {} ; /* values of attributes key:sparqlid*/
      return node;
    };

    AskomicsGraphBuilder.prototype.setPositionable = function(node) {
      node.positionable = true;
    };

    AskomicsGraphBuilder.prototype.instanciateNode = function(node) {
      node.suggested = false;
      node.actif = true ;
      this.setSPARQLVariateId(node);
      node.name = node.SPARQLid;
      _instanciedNodeGraph.push(node);
    };

    AskomicsGraphBuilder.prototype.isInstanciatedNode = function(node) {

      for (var n of _instanciedNodeGraph) {
        if (n.id === node.id)
          return true;
      }
      return false;
    };

    AskomicsGraphBuilder.prototype.instanciateLink = function(links) {
      for (var l of links ) {
        l.suggested = false;
        this.setSPARQLVariateId(l);
        _instanciedLinkGraph.push(l);
      }
    };

    /*
      return the name of the node without index  to set up and update the graph
    */
    AskomicsGraphBuilder.prototype.getLabelNode = function(node) {
        var re = new RegExp(/(\d+)$/);
        var labelEntity = node.name.replace(re,"");

        return labelEntity;
      };

    /*
      return the index name of the node to set up and update the graph
    */
    AskomicsGraphBuilder.prototype.getLabelIndexNode = function(node) {
          var re = new RegExp(/(\d+)$/);
          var indiceEntity = node.name.match(re);

          if ( indiceEntity && indiceEntity.length>0 )
            return indiceEntity[0];
          else
            return "";
      };

    /* Build attribute with id, sparId inside a node from a generic uri attribute */
    AskomicsGraphBuilder.prototype.setAttributeOrCategoryForNode = function(AttOrCatArray,attributeForUri,node) {
      AttOrCatArray[attributeForUri.uri] = {} ;
      AttOrCatArray[attributeForUri.uri].type = attributeForUri.type ;
      AttOrCatArray[attributeForUri.uri].label = attributeForUri.label ;

      this.setSPARQLVariateId(AttOrCatArray[attributeForUri.uri]);
      this.setId(AttOrCatArray[attributeForUri.uri]);

      /* by default all attributes is ask */
      AttOrCatArray[attributeForUri.uri].actif = false ;
      return AttOrCatArray[attributeForUri.uri];
    };

    AskomicsGraphBuilder.prototype.buildAttributeOrCategoryForNode = function(attributeForUri,node) {
      if (attributeForUri.type.indexOf("http://www.w3.org/2001/XMLSchema#") < 0) {
        return this.setAttributeOrCategoryForNode(node.categories,attributeForUri,node);
      }else {
        return this.setAttributeOrCategoryForNode(node.attributes,attributeForUri,node);
      }
    };

    AskomicsGraphBuilder.prototype.getAttributeOrCategoryForNode = function(attributeForUri,node) {
      if (attributeForUri.uri in node.categories ) {
        return node.categories[attributeForUri.uri];
      } else if (attributeForUri.uri in node.attributes) {
        return node.attributes[attributeForUri.uri];
      }
      return null;
    };

    AskomicsGraphBuilder.prototype.switchActiveAttribute = function(uriId,nodeId) {
      for (var node of _instanciedNodeGraph ) {
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
    };

    AskomicsGraphBuilder.prototype.synchronizeInstanciatedNodesAndLinks = function(nodes,links) {
      var removeElt = [];
      var present = false;
      for ( var idn in nodes ) {
        if ( nodes[idn].suggested ) continue ;
        present = false ;
        for (var n of _instanciedNodeGraph){
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
        for (var l of _instanciedLinkGraph){
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
    };

    AskomicsGraphBuilder.prototype.buildConstraintsGraphForCategory = function(nodeAttribute,attributeId) {
      var variates = [] ;
      var constraintRelations = [] ;
      var filters = [];
      var isOptional = false ; /* request too long with optional */

      var ua = userAbstraction;

      for (idx=_instanciedNodeGraph.length-1;idx>=0;idx--) {
        var node = _instanciedNodeGraph[idx];
        if (nodeAttribute.id != node.id ) continue ;
        /* add node inside */
        constraintRelations.push(["?"+'URI'+node.SPARQLid,'rdf:type',ua.URI(node.uri)]);
        constraintRelations.push(["?"+'URI'+node.SPARQLid,'rdfs:label',"?"+node.SPARQLid]);

        /* for instance we don't filter category with attributes node but could be (very long request)*/
        if ( nodeAttribute.id != node.id ) continue;

        for (var uri in node.categories) {
            if ( node.categories[uri].id != attributeId ) continue;
            constraintRelations.push(["?"+'URI'+node.SPARQLid,ua.URI(uri),"?EntCat"+node.categories[uri].SPARQLid,isOptional]);
            constraintRelations.push(["?EntCat"+node.categories[uri].SPARQLid,'rdfs:label',"?"+node.categories[uri].SPARQLid,isOptional]);
            variates.push("?"+node.categories[uri].SPARQLid);
            return [variates,constraintRelations,filters] ;
        }
      }
      return [variates,constraintRelations,filters] ;
    };

    AskomicsGraphBuilder.prototype.buildPositionableConstraintsGraph = function(infos,source,target,constraintRelations,filters) {

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
    };

    AskomicsGraphBuilder.prototype.buildConstraintsGraph = function() {
      var variates = [] ;
      var constraintRelations = [] ;
      var filters = [];

      var constraintRelationsPositionable = [];
      var filtersPositionable = [];

      var isOptional = false ; /* request too long with optional */

      /* copy arrays to avoid to removed nodes and links instancied */
      var dup_node_array = $.extend(true, [], _instanciedNodeGraph);
      var dup_link_array = $.extend(true, [], _instanciedLinkGraph);

      var ua = userAbstraction;
      /* TODO: better if loop is inversed ?*/
      for (idx=0;idx<_instanciedNodeGraph.length;idx++) {
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
    };

    AskomicsGraphBuilder.prototype.nodesDisplaying = function() {
      var list = [];
      for (var v of _instanciedNodeGraph) {
        if (v.actif)
          list.push(v.SPARQLid);
      }
      return list ;
    };

    AskomicsGraphBuilder.prototype.attributesDisplaying = function(SPARQLid) {
      var list = [];
      for (var v of _instanciedNodeGraph) {
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
    };

    AskomicsGraphBuilder.prototype.setFilterAttributes= function(nodeId,SPARQLid,value,filter) {
      var tab = this.findElt(_instanciedNodeGraph,nodeId);
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
    };

  };
