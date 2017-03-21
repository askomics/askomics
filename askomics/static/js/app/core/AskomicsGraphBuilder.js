/*jshint esversion: 6 */
const classesMapping = {
  'AskomicsPositionableNode': AskomicsPositionableNode,
  'AskomicsNode': AskomicsNode,
  'GraphLink': GraphLink,
  'AskomicsLink': AskomicsLink,
  'AskomicsPositionableLink': AskomicsPositionableLink
};

/* constructeur de AskomicsGraphBuilder */
  class AskomicsGraphBuilder {
    constructor() {
      this.AskomicsGraphBuilderVersion = 1.2 ;
      this.reset();
    }

    reset() {
      /* ========================================= ATTRIBUTES ============================================= */
      this.SPARQLIDgeneration = {} ; /* { <ENT1> : 5, ... }  last index used to named variable */
      this.IDgeneration = 0;

      /* We keep information about instancied Node and Link to be able to rebuild graph */
      this._instanciedNodeGraph = [] ;
      this._instanciedLinkGraph = [] ;
    }

    /* get node */
    nodes(selectedOrderList,kindparam) {

      if ( selectedOrderList === undefined )
        return this._instanciedNodeGraph;

      if ( kindparam === undefined ) throw "AskomicsGraphBuilder::nodes -> Define kindparam when use selectedOrderList param";
      let nodeL = [];
      for (let i in selectedOrderList ) {
          for (let j in this._instanciedNodeGraph) {
            if ( selectedOrderList[i] == this._instanciedNodeGraph[j][kindparam]) {
              nodeL.push(this._instanciedNodeGraph[j]);
              break;
            }
          }
      }
      return nodeL;
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
        let output = "";
        for (let property in this.nodes()[i]) {
      //    console.log("prop:"+property);
      //    console.log(typeof(this.nodes()[i][property]));
          output += property + ': ' + JSON.stringify(this.nodes()[i][property])+'; ';
        }
        //console.log(output);
        nodes.push([this.nodes()[i].constructor.name,this.nodes()[i]]);
      }
      for (let i=0;i<this.links().length;i++) {
        links.push([this.links()[i].constructor.name,this.links()[i]]);
      }

      return JSON.stringify([this.AskomicsGraphBuilderVersion,nodes,links,this.SPARQLIDgeneration,this.IDgeneration],null,'\t');
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

        this._instanciedNodeGraph = [] ;
        this._instanciedLinkGraph = [] ;

        this.nodes().splice(0, this.nodes().length);
        this.links().splice(0, this.links().length);

        //setup nodes
        for (let i=0;i<nodes.length;i++) {
          let className = nodes[i][0];
          let jsonObj = nodes[i][1];
          let n = new classesMapping[className]({uri:"undefined"});
          n.setjson(jsonObj);
          this.nodes().push(n);
        }

        //setup links
        for (let i=0;i<links.length;i++) {
          let className = links[i][0];
          let jsonObj = links[i][1];
          let l = new classesMapping[className]({uri:"undefined"});
          l.setjson(jsonObj,this);
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
      if (!link) {
        throw new Error("Link is undefined.");
      }
      var t = AskomicsGraphBuilder.findElt(this._instanciedLinkGraph,link.id);
      var removeNode = null;
      //console.log(JSON.stringify(this._instanciedLinkGraph));

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
      let lab = new GraphNode({ uri:nodeOrLinkOrAttribute.uri } ).removePrefix();
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
      for (var n in this._instanciedNodeGraph) {
        if (this._instanciedNodeGraph[n].id == id ) return this._instanciedNodeGraph[n];
      }
      throw "GraphBuilder::getInstanciedNode Can not find instancied node:"+JSON.stringify(id);
    }

    getInstanciedLink(id) {
      for (var n in this._instanciedLinkGraph) {
        if (this._instanciedLinkGraph[n].id == id) return this._instanciedLinkGraph[n];
      }
      throw "GraphBuilder::getInstanciedLink Can not find instancied link:"+JSON.stringify(id);
    }

    setSuggestedNode(node,x,y) {
      let iNode = AskomicsObjectBuilder.instanceNode(node,x,y);
      iNode.id = this.getId();
      return iNode;
    }

    instanciateNode(node) {
      node.suggested = false;
      node.actif     = true ;
      node           = this.setSPARQLVariateId(node);
      this._instanciedNodeGraph.push(node);
      return node;
    }

    isInstanciatedNode(node) {

      for (var n in this._instanciedNodeGraph) {
        if (this._instanciedNodeGraph[n].id === node.id)
          return true;
      }
      return false;
    }

    instanciateLink(links) {
      for (var l in links ) {
        links[l].suggested = false;
        links[l] = this.setSPARQLVariateId(links[l]);
        this._instanciedLinkGraph.push(links[l]);
      }
    }

    synchronizeInstanciatedNodesAndLinks(nodes,links) {
      var removeElt = [];
      var present = false;
      for ( var idn in nodes ) {
        if ( nodes[idn].suggested ) continue ;
        present = false ;
        for (var n in this._instanciedNodeGraph){
            if (this._instanciedNodeGraph[n].id == nodes[idn].id) {
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
        for (var l in this._instanciedLinkGraph){
            if (this._instanciedLinkGraph[l].id == links[idl].id) {
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
      let variates        = [] ;
      let blockConstraint = [] ;

      /* copy arrays to avoid to removed nodes and links instancied */
      let dup_node_array = $.extend(true, [], this._instanciedNodeGraph);
      let dup_link_array = $.extend(true, [], this._instanciedLinkGraph);

      for (let idx=0;idx<this._instanciedNodeGraph.length;idx++) {
        let node = dup_node_array[idx];
        /* adding constraints about attributs about the current node */
        blockConstraint.push(node.buildConstraintsSPARQL());
        node.instanciateVariateSPARQL(variates);
      }

      for (let idx=0;idx<this._instanciedNodeGraph.length;idx++) {
        let node = dup_node_array[idx];
        /* find relation with this node and add it as a constraint  */
        for (let ilx=0;ilx<dup_link_array.length;ilx++) {

          if ( (dup_link_array[ilx].source.id == node.id) ||  (dup_link_array[ilx].target.id == node.id) ) {
            let blockConstraintByLink = [] ;

            blockConstraint.push(dup_link_array[ilx].buildConstraintsSPARQL());
            dup_link_array[ilx].instanciateVariateSPARQL(variates);

            //remove link to avoid to add two same constraint
            dup_link_array.splice(ilx,1);
          }
        }
      }

      return [variates,[blockConstraint,'']] ;
    }

    countNumberOfSolution(functBefore,functCount) {
      functBefore();
      let tab = this.buildConstraintsGraph();
      let data = {
        'variates'             : ['count(*)'],
        'constraintesRelations': tab[1],
        'constraintesFilters'  : tab[2],
        'removeGraph'          : __ihm.getAbstraction().listUnactivedGraph(),
        'limit'                : -1
      };
      let service = new RestServiceJs("sparqlquery");
      service.post(data,function(res) {
        functCount(res.values[0]["callret-0"]);
        console.log("COUNT = "+JSON.stringify(res));
      });
    }

  }
