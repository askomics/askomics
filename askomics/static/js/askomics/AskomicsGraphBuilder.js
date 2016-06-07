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
    AskomicsGraphBuilder.prototype.removeInstanciedNode = function(idNode) {

      /* search link associated with this node and a node with a id > (newest than idNode)*/
      var linkIndexToDelete = [];
      for (var i in _instanciedLinkGraph ) {
        var t1 = _instanciedLinkGraph[i].source.id == idNode,
            t2 = _instanciedLinkGraph[i].target.id == idNode;
        if (t1 || t2 ) {
          // find a link associated with idNode
          var currentNode = t1?_instanciedLinkGraph[i].source:_instanciedLinkGraph[i].target;
          var targetNode = t1?_instanciedLinkGraph[i].target:_instanciedLinkGraph[i].source;

          /* the second node is newest than idNode, we have to remove it ! */
          if ( targetNode.id > currentNode.id ) {
            // removing node
            this.removeInstanciedNode(targetNode.id);
            // removing link
            linkIndexToDelete.push(i);
            if ( t2.id in t1.nlink )
              delete t1.nlink[t2.id];
            if ( t1.id in t2.nlink )
              delete t2.nlink[t1.id];
          }
        }
      }
      /* remove links */
      for (var l=linkIndexToDelete.length-1;l>=0;l--) {
        _instanciedLinkGraph.splice(linkIndexToDelete[l], 1);
      }
      /* remove the node */
      for (var n in _instanciedNodeGraph) {
        if ( _instanciedNodeGraph[n].id == idNode )
          _instanciedNodeGraph.splice(n, 1);
          return;
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
          this.removeInstanciedNode(linkNode.source.id);
        } else {
          this.removeInstanciedNode(linkNode.target.id);
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

    AskomicsGraphBuilder.prototype.setIdNode = function(node) {
      node.id = IGgeneration;
      IGgeneration++;
      return node;
    };

    AskomicsGraphBuilder.prototype.setStartpoint = function(node) {
      this.setIdNode(node);
      node.weight = 0;
      node.nlink = {}; // number of relation with a node
      this.instanciateNode(node);
      return node;
    };

    AskomicsGraphBuilder.prototype.setSuggestedNode = function(node,x,y) {
      node.suggested = true;
      node.x = x;
      node.y = y;
      this.setIdNode(node);
      node.name = node.label;
      node.weight = 0;
      node.nlink = {}; // number of relation with a node.
      return node;
    };

    AskomicsGraphBuilder.prototype.instanciateNode = function(node) {
      node.suggested = false;
      this.setSPARQLVariateId(node);
      node.name = node.SPARQLid;
      _instanciedNodeGraph.push(node);
    };

    AskomicsGraphBuilder.prototype.isInstanciateNode = function(node) {

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
    /* Attach contrainte and variate to the node */
   AskomicsGraphBuilder.prototype.setConstrainteWithAttribute = function(node,uriAtt,valueAtt) {
     if ( ! ( attributes in node)) {
       node.attributes = {} ;
     }

     node.attributes[uriAtt] = valueAtt ;
     console.log("NODE:"+json.strinigify(node));
    };
  };
