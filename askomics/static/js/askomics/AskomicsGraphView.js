/*jshint esversion: 6 */

/*
  Manage The creation, update and deletaion inside the Panel Graph view
*/



var AskomicsGraphView = function () {

  var colorPalette = ["yellowgreen","teal","paleturquoise","peru","tomato","steelblue","lightskyblue","lightcoral"];
  var idxColorPalette = 0 ;
  /* Color associate with Uri */
  var colorUriList = {} ;

  var ctrlPressed = false ;
  var selectNodes = []    ;

  /* Definition of an event when CTRL key is actif to select several node */
  $(document).keydown(function (e) {
    if (e.keyCode == 17) {
      ctrlPressed = true ;
    }
  });

  $(document).keyup(function (e) {
    ctrlPressed = false ;
  });


  AskomicsGraphView.prototype.updateInstanciateLinks = function(links) {
    for (var l of links) {
      var id = l.source.id + "-" + l.target.id + "-" + l.linkindex;
      $("#" + id).css("stroke-dasharray","");
      $("#" + id).css("opacity","1");
    }
  };

  AskomicsGraphView.prototype.getColorInstanciateNode = function(node) {
    if ( ! node  ) {
      throw new Error("AskomicsGraphView.prototype.getColorInstanciateNode node is not defined!");
    }

    if (! ('uri' in node)) {
      throw new Error("AskomicsGraphView.prototype.getColorInstanciateNode node has not uri !:"+JSON.stringify(node));
    }

    if ( node.uri in colorUriList ) {
      return colorUriList[node.uri];
    }


    colorUriList[node.uri] = colorPalette[idxColorPalette++];
    if (idxColorPalette >= colorPalette.length) idxColorPalette = 0;
    return colorUriList[node.uri];
  };

  /* Update the label of cercle when a node is instanciated */
  AskomicsGraphView.prototype.updateInstanciateNode = function(node) {

    if ( ! node  )
      throw new Error("AskomicsGraphView.prototype.updateInstanciateNode : node is not defined !");
    console.log("NEW LABEL:"+JSON.stringify(node));

    // change label node with the SPARQL Variate Id
    $('#txt_'+node.id).html(graphBuilder.getLabelNode(node)+'<tspan font-size="7" baseline-shift="sub">'+graphBuilder.getLabelIndexNode(node)+"</tspan>");
    // canceled transparency
    $("#node_"+node.id).css("opacity", "1");
    //$("#node_"+node.id).css("fill", this.getColorInstanciateNode(node));
  };

  /* Update the label of cercle when a node is instanciated */
  AskomicsGraphView.prototype.manageSelectedNodes = function(node) {
    var agv = this ;

    if (! ctrlPressed) {
      $("[id*='node_']").each(function (index, value) {
        var n = {};
        n.uri = $(this).attr('uri') ;
        $(this).css("fill",agv.getColorInstanciateNode(n));
      });

      selectNodes = [] ;
    } else {
      // deselection case
      for ( var n in selectNodes ){
        if (selectNodes[n].id == node.id) {
          // remove the current node from the selected node list !
           selectNodes.splice(n,1);
           $("#node_"+node.id).css("fill", agv.getColorInstanciateNode(node));
           return;
        }
      }

    }
    selectNodes.push(node);
    $("#node_"+node.id).css("fill", "mediumvioletred");
  };

  AskomicsGraphView.prototype.insertSuggestions = function (node, nodeList, linkList) {
    if (selectNodes.length === 0 ) {
      this.insertSuggestionsWithNewNode(node, nodeList, linkList);
    } else if (selectNodes.length === 1 ) {
      this.insertSuggestionsWithNewNode(selectNodes[0], nodeList, linkList);
    } else if (selectNodes.length === 2) {
      this.insertSuggestionsWithTwoNodesInstancied(selectNodes[0],selectNodes[1],linkList);
    }
  };

  AskomicsGraphView.prototype.insertSuggestionsWithNewNode = function (slt_node, nodeList, linkList) {
      console.log("URI="+slt_node.uri);
      /* get All suggested node and relation associated to get orientation of arc */
      tab = userAbstraction.getRelationsObjectsAndSubjectsWithURI(slt_node.uri);
      objectsTarget = tab[0];  /* All triplets which slt_node URI are the subject */
      subjectsTarget = tab[1]; /* All triplets which slt_node URI are the object */
      var link = {} ;

      var suggestedList = {} ;

      for (var uri in objectsTarget ) {
        /* creatin node */
        suggestedNode = userAbstraction.buildBaseNode(uri);
        /* specific attribute for suggested node */
        graphBuilder.setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);
        /* adding in the node list to create D3.js graph */
        nodeList.push(suggestedNode);
        /* We create a unique instance and add all possible relation between selected node and this suggested node */
        suggestedList[uri] = suggestedNode ;
        slt_node.nlink[suggestedList[uri].id] = 0;
        suggestedList[uri].nlink[slt_node.id] = 0;

        for (var rel in objectsTarget[uri]) {
          /* increment the number of link between the two nodes */
          slt_node.nlink[suggestedList[uri].id]++;
          suggestedList[uri].nlink[slt_node.id]++;

          link = {
            suggested : true,
            uri   : objectsTarget[uri][rel],
            source: slt_node,
            target: suggestedList[uri],
            label: userAbstraction.removePrefix(objectsTarget[uri][rel]),
            linkindex: slt_node.nlink[suggestedList[uri].id],
          };

          link.source.weight++;
          linkList.push(link);
        }
      }

      for (uri in subjectsTarget ) {
        if ( ! (uri in suggestedList) ) {
          suggestedNode = userAbstraction.buildBaseNode(uri);
          graphBuilder.setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);
          nodeList.push(suggestedNode);
          suggestedList[uri] = suggestedNode ;
          slt_node.nlink[suggestedList[uri].id] = 0;
          suggestedList[uri].nlink[slt_node.id] = 0;
        }

        for (var rel2 in subjectsTarget[uri]) {
          slt_node.nlink[suggestedList[uri].id]++;
          suggestedList[uri].nlink[slt_node.id]++;

          link = {
            suggested : true,
            uri   : subjectsTarget[uri][rel2],
            source: suggestedList[uri],
            target: slt_node,
            label: userAbstraction.removePrefix(subjectsTarget[uri][rel2]),
            linkindex: slt_node.nlink[suggestedList[uri].id],
          };
          link.source.weight++;
          linkList.push(link);
        }
      }
      console.log("LINKS LENGTH="+linkList.length);
      // add neighbours of a node to the graph as propositions.
  } ;

  AskomicsGraphView.prototype.relationInstancied = function (subj, obj,relation,linkList) {
    console.log(subj.name);
    console.log(obj.name);
    console.log("relation:"+relation);
    for ( var rel of linkList ) {
      if ( rel.source == subj && rel.target == obj && rel.uri == relation ) return true;
    }
    return false;
  };

  AskomicsGraphView.prototype.insertSuggestionsWithTwoNodesInstancied = function (node1, node2,linkList) {
    console.log(" === insertSuggestionsWithTwoNodesInstancied === ");
    /* get All suggested node and relation associated to get orientation of arc */
    tab = userAbstraction.getRelationsObjectsAndSubjectsWithURI(node1.uri);
    objectsTarget = tab[0];  /* All triplets which slt_node URI are the subject */
    subjectsTarget = tab[1]; /* All triplets which slt_node URI are the object */

    for (var rel in objectsTarget[node2.uri]) {
      if ( this.relationInstancied(node1,node2,objectsTarget[node2.uri][rel],linkList) ) continue ;
      /* increment the number of link between the two nodes */
      if ( ! (node2.id in node1.nlink) ) {
        node1.nlink[node2.id] = 0;
        node2.nlink[node1.id] = 0;
      }
      node1.nlink[node2.id]++;
      node2.nlink[node1.id]++;

      link = {
        suggested : true,
        uri   : objectsTarget[node2.uri][rel],
        source: node1,
        target: node2,
        label: userAbstraction.removePrefix(objectsTarget[node2.uri][rel]),
        linkindex: node1.nlink[node2.id],
      };
      link.source.weight++;
      linkList.push(link);
    }

    for (var rel2 in subjectsTarget[node2.uri]) {
      if ( this.relationInstancied(node2,node1,subjectsTarget[node2.uri][rel2],linkList) ) continue ;

      if ( ! (node2.id in node1.nlink) ) {
        node1.nlink[node2.id] = 0;
        node2.nlink[node1.id] = 0;
      }

      node1.nlink[node2.id]++;
      node2.nlink[node1.id]++;

      link = {
        suggested : true,
        uri   : subjectsTarget[node2.uri][rel2],
        source: node2,
        target: node1,
        label: userAbstraction.removePrefix(subjectsTarget[node2.uri][rel2]),
        linkindex: node1.nlink[node2.id],
      };
      link.source.weight++;
      linkList.push(link);
    }
  };

  /* Remove all nodes and links suggestion */
  AskomicsGraphView.prototype.removeSuggestions = function(nodeList,linkList) {

    var removeL = [];
    for (var idx in linkList) {
      l = linkList[idx];
      if ( l.suggested ) {
        removeL.push(idx);
        l.source.nlink[l.target.id]--; // decrease the number of link
        l.target.nlink[l.source.id]--; // decrease the number of link
        if ( l.source.nlink[l.target.id] <= 0 )
          delete l.source.nlink[l.target.id];
        if ( l.target.nlink[l.source.id] <= 0 )
          delete l.source.nlink[l.target.id];
      }
    }
    for (var j=removeL.length-1;j>=0;j--) {
      linkList.splice(removeL[j],1);
    }
    var removeN = [];
    // remove suggested node
    for (var node in nodeList) {
      if ( nodeList[node].suggested ) {
        removeN.push(node);
      }
    }
    for (var n2=removeN.length-1;n2>=0;n2--){
      idxn = removeN[n2];
      nodeList.splice(idxn,1);
    }
  } ;
};
