/*jshint esversion: 6 */
const classesMapping = {
  'GraphNode': GraphNode,
  'AskomicsPositionableNode': AskomicsPositionableNode,
  'AskomicsNode': AskomicsNode,
  'GraphLink': GraphLink,
  'AskomicsLink': AskomicsLink,
  'AskomicsPositionableLink': AskomicsPositionableLink
};

/* constructeur de AskomicsGraphBuilder */
  class AskomicsGraphBuilder {
    constructor() {
      this.AskomicsGraphBuilderVersion = 1.1 ;
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
      let nodes = [];
      let links = [];

      /* Save class name to rebuild the object when loading */
      for (let i=0;i<this.nodes().length;i++) {
        nodes.push([this.nodes()[i].constructor.name,this.nodes()[i]]);
      }
      for (let i=0;i<this.links().length;i++) {
        links.push([this.links()[i].constructor.name,this.links()[i]]);
      }
      return JSON.stringify([this.AskomicsGraphBuilderVersion,nodes,links,this.SPARQLIDgeneration,this.IDgeneration]);
    }

    /* create and return list of nodes and links to build a new grpah from a dump file */
    setNodesAndLinksFromState(dump) {
      try {
        let struct = JSON.parse(dump);

        let versionOfFile    = struct[0];
        //this._instanciedNodeGraph = struct[1];
        //this._instanciedLinkGraph = struct[2];
        let nodes = struct[1];
        let links = struct[2];
        this.SPARQLIDgeneration   = struct[3];
        this.IDgeneration         = struct[4];

        /* manage version */
        if ( versionOfFile != this.AskomicsGraphBuilderVersion ) {
          alert("Dump file are builded with the Askomics Graph Builder Version:"+versionOfFile+"\n"+". Current version is "+ AskomicsGraphBuilderVersion +".\nReload of dump are not guaranteed !");
        }

        this.nodes().splice(0, this.nodes().length);
        this.links().splice(0, this.links().length);

        //setup nodes
        for (let i=0;i<nodes.length;i++) {
          let className = nodes[i][0];
          let jsonObj = nodes[i][1];
          let n = new classesMapping[className](jsonObj);
          n.setjson(jsonObj);
          this.nodes().push(n);
        }
        //setup links
        for (let i=0;i<links.length;i++) {
          let className = links[i][0];
          let jsonObj = links[i][1];
          let l = new classesMapping[className]();
          l.setjson(jsonObj);
          this.links().push(l);
        }
        return [this.nodes(),this.links()];
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
      var t = AskomicsGraphBuilder.findElt(this._instanciedLinkGraph,link.id);
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
      t = AskomicsGraphBuilder.findElt(this._instanciedLinkGraph,link.id);
      if (t[0]>-1)
        this._instanciedLinkGraph.splice(t[0], 1);

        return removeNode;
    }

    /* create and return a new ID to instanciate a new SPARQL variate */
    setSPARQLVariateId(nodeOrLinkOrAttribute) {
      let lab = userAbstraction.removePrefix(nodeOrLinkOrAttribute.uri);
      lab = lab.replace(/[%!\"#$%&'\(\)\*\+,\.\/:;<=>\?\@\[\\\]\^`\{\|\}~]/g, '');
      if ( ! this.SPARQLIDgeneration[lab] ) {
        this.SPARQLIDgeneration[lab] = 0 ;
      }

      this.SPARQLIDgeneration[lab]++ ;
      nodeOrLinkOrAttribute.SPARQLid = lab+this.SPARQLIDgeneration[lab];
      return nodeOrLinkOrAttribute;
    }

    getId(node) {
      let id = this.IDgeneration;
      this.IDgeneration++;
      return id;
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
      node.id = this.getId();
      return node;
    }

    instanciateNode(node) {

      node.suggested = false;
      node.actif     = true ;
      node           = this.setSPARQLVariateId(node);
      node.label     += this.getLabelIndexNode(node) ;

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
        l = this.setSPARQLVariateId(l);
        this._instanciedLinkGraph.push(l);
      }
    }

    /*
      return the index name of the node to set up and update the graph
    */
    getLabelIndexNode(node) {
          var re = new RegExp(/(\d+)$/);
          var indiceEntity = node.SPARQLid.match(re);

          if ( indiceEntity && indiceEntity.length>0 )
            return indiceEntity[0];
          else
            return "";
      }

    /* Build attribute with id, sparId inside a node from a generic uri attribute */
    setAttributeOrCategoryForNode(AttOrCatArray,attributeForUri,node) {
      AttOrCatArray[attributeForUri.uri] = {} ;
      AttOrCatArray[attributeForUri.uri].uri = attributeForUri.uri ;
      AttOrCatArray[attributeForUri.uri].type = attributeForUri.type ;
      AttOrCatArray[attributeForUri.uri].label = attributeForUri.label ;

      AttOrCatArray[attributeForUri.uri] = this.setSPARQLVariateId(AttOrCatArray[attributeForUri.uri]);
      AttOrCatArray[attributeForUri.uri].id=this.getId();

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

    buildConstraintsGraph() {
      var variates = [] ;
      var constraintRelations = [] ;
      var filters = [];

      /* copy arrays to avoid to removed nodes and links instancied */
      var dup_node_array = $.extend(true, [], this._instanciedNodeGraph);
      var dup_link_array = $.extend(true, [], this._instanciedLinkGraph);

      //var ua = userAbstraction;
      for (let idx=0;idx<this._instanciedNodeGraph.length;idx++) {
        var node = dup_node_array[idx];
        /* find relation with this node and add it as a constraint  */
        for (let ilx=dup_link_array.length-1;ilx>=0;ilx--) {
          if ( (dup_link_array[ilx].source.id == node.id) ||  (dup_link_array[ilx].target.id == node.id) ) {

            dup_link_array[ilx].buildConstraintsSPARQL(constraintRelations);
            dup_link_array[ilx].buildFiltersSPARQL(filters);
            dup_link_array[ilx].instanciateVariateSPARQL(variates);

            //remove link to avoid to add two same constraint
            dup_link_array.splice(ilx,1);
          }
        }
        /* adding constraints about attributs about the current node */
        node.buildConstraintsSPARQL(constraintRelations);
        node.buildFiltersSPARQL(filters);
        node.instanciateVariateSPARQL(variates);
      }

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
      var list_id = [];
      var list_label = [];
      for (var v of this._instanciedNodeGraph) {
        if (v.SPARQLid == SPARQLid ) {
          for (var uriAtt in v.attributes) {
            if (v.attributes[uriAtt].actif) {
              list_id.push(v.attributes[uriAtt].SPARQLid);
              list_label.push(v.attributes[uriAtt].label);
              console.log('---> attr: '+JSON.stringify(v.attributes));
            }
          }
          for (var uriCat in v.categories) {
            if (v.categories[uriCat].actif) {
              list_id.push(v.categories[uriCat].SPARQLid);
              list_label.push(v.categories[uriCat].label);
              console.log('---> cat: '+JSON.stringify(v.categories));
            }
          }
          return {'id' : list_id, 'label': list_label};
        }
      }
    }

    setFilterAttributes(nodeId,SPARQLid,value,filter) {
      var tab = AskomicsGraphBuilder.findElt(this._instanciedNodeGraph,nodeId);
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
