/*jshint esversion: 6 */

/* constructeur de AskomicsGraphBuilder */
  var AskomicsGraphBuilder = function () {
    /* ========================================= ATTRIBUTES ============================================= */
    var SPARQLIDgeneration = {} ; /* { <ENT1> : 5, ... }  last index used to named variable */
    var IGgeneration = 0;

    /* We keep information about instancied Node and Link to be able to rebuild graph */
    var _instanciedNodeGraph = [] ;
    var _instanciedLinkGraph = [] ;

    AskomicsGraphBuilder.prototype.addInstanciedElt = function(node) {
      _instanciedNodeGraph.push(node);
    };

    AskomicsGraphBuilder.prototype.addInstanciedLink = function(link) {
      _instanciedLinkGraph.push(link);
    };

    AskomicsGraphBuilder.prototype.findElt = function(_array,id)  {
      var elt  ;
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
      console.log("---------- removeInstanciedNode ---------------- ID:"+node.id);
      if ( _instanciedNodeGraph[0].length <= 0 ) return ;
      if ( _instanciedNodeGraph[0].id == node.id ) {
        console.log("Impossible to remove the first node !");
        return ;
      }

      /* search link associated with this node and a node with a id > (newest than idNode)*/
      var linkIndexToDelete = [];
      for (var i in _instanciedLinkGraph ) {
        var t1 = _instanciedLinkGraph[i].source.id == node.id,
            t2 = _instanciedLinkGraph[i].target.id == node.id;
        if (t1 || t2 ) {
          // find a link associated with node.id
          var currentNode = t1?_instanciedLinkGraph[i].source:_instanciedLinkGraph[i].target;
          var targetNode = t1?_instanciedLinkGraph[i].target:_instanciedLinkGraph[i].source;

          /* the second node is newest than node.id, we have to remove it ! */
          if ( targetNode.id > currentNode.id ) {
            // removing node
            this.removeInstanciedNode(targetNode);
          }
          // removing link
          linkIndexToDelete.push(i);
          if ( currentNode.id in targetNode.nlink )
            delete targetNode.nlink[currentNode.id];
          if ( targetNode.id in currentNode.nlink )
            delete currentNode.nlink[targetNode.id];
        }
      }

      /* remove links */
      for (var l=linkIndexToDelete.length-1;l>=0;l--) {
        _instanciedLinkGraph.splice(linkIndexToDelete[l], 1);
      }

      /* remove the node */
      for (var n in _instanciedNodeGraph) {

        if ( _instanciedNodeGraph[n].id == node.id ) {
          _instanciedNodeGraph.splice(n, 1);
          return;
        }
      }
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


    /* TODO : find a best solution to unactive a node without matching on sparql variable ID */
    AskomicsGraphBuilder.prototype.switchActiveNode = function(node) {
          node.actif = !node.actif ;
    };

    AskomicsGraphBuilder.prototype.setSuggestedNode = function(node,x,y) {
      node.suggested = true;
      node.actif = false ;
      node.x = x;
      node.y = y;
      this.setId(node);
      node.name = node.label;
      node.weight = 0;
      node.nlink = {}; // number of relation with a node.
      node.attributes = {} ;
      node.categories = {} ;
      node.filters = {} ;
      return node;
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

    AskomicsGraphBuilder.prototype.buildConstraintsGraph = function() {
      var variates = [] ;
      var constraintRelations = [] ;
      var filters = [];

      var dup_node_array = $.extend(true, [], _instanciedNodeGraph);
      var dup_link_array = $.extend(true, [], _instanciedLinkGraph);
      var ua = userAbstraction;

      for (idx=dup_node_array.length-1;idx>=0;idx--) {
        var node = dup_node_array[idx];
        /* add node inside */
        constraintRelations.push(["?"+'URI'+node.SPARQLid,'rdf:type',ua.URI(node.uri)]);
        constraintRelations.push(["?"+'URI'+node.SPARQLid,'rdfs:label',"?"+node.SPARQLid]);
        /* find relation with this node and add it as a constraint  */
        for (ilx=dup_link_array.length-1;ilx>=0;ilx--) {
          if ( (dup_link_array[ilx].source.id == node.id) ||  (dup_link_array[ilx].target.id == node.id) ) {
            constraintRelations.push(["?"+'URI'+dup_link_array[ilx].source.SPARQLid,ua.URI(dup_link_array[ilx].uri),"?"+'URI'+dup_link_array[ilx].target.SPARQLid]);
            dup_link_array.splice(ilx,1);
          }
        }
        /* adding variable node name */
        if (node.actif) {
          variates.push("?"+node.SPARQLid);
        }
        /* adding constraints about attributs about the current node */
        for (var uri in node.attributes) {
            constraintRelations.push(["?"+'URI'+node.SPARQLid,ua.URI(uri),"?"+node.attributes[uri].SPARQLid]);
            constraintRelations.push([ua.URI(uri),'rdfs:domain',ua.URI(node.uri)]);
            constraintRelations.push([ua.URI(uri),'rdfs:range',ua.URI(node.attributes[uri].type)]);
            constraintRelations.push([ua.URI(uri),'rdf:type',ua.URI('owl:DatatypeProperty')]);
          if ( node.actif && node.attributes[uri].actif) {
            variates.push("?"+node.attributes[uri].SPARQLid);
          }
        }
        for (uri in node.categories) {
            constraintRelations.push(["?"+'URI'+node.SPARQLid,ua.URI(uri),"?EntCat"+node.categories[uri].SPARQLid]);
            constraintRelations.push(["?EntCat"+node.categories[uri].SPARQLid,'rdfs:label',"?"+node.categories[uri].SPARQLid]);
            //variates.push("?"+"EntCat"+node.categories[uri].SPARQLid);
          if ( node.actif && node.categories[uri].actif) {
            variates.push("?"+node.categories[uri].SPARQLid);
          }
        }

        for (var f in node.filters) {
          console.log(f);
          console.log(node.filters[f]);
          filters.push(node.filters[f]);
        }
        /* remove the node from the buffer list */
        dup_node_array.splice(idx,1);
      }
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
      if ($.trim(value) === "") {
        delete tab[1].filters[SPARQLid];
      } else {
        tab[1].filters[SPARQLid] = filter;
      }
    };
  };
