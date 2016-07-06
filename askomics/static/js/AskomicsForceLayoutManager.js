/*jshint esversion: 6 */

/*
*/
var AskomicsForceLayoutManager = function () {

  var w = $("#svgdiv").width();
  var h = 350 ;
  var configDisplay = {
    rNode        : 12,
    opacityNode  : "0.5"
  };

  /* filter to hide and show proposition node and links */
  var _hideProposedUriNode    = [] ;
  var _hideProposedUriLink    = [] ;

  AskomicsForceLayoutManager.prototype.getArrayForProposedUri = function(type) {
    if ( type == "node" ) {
      return _hideProposedUriNode;
    }
    if ( type == "link" ) {
      return _hideProposedUriLink;
    }
    throw new Error("AskomicsForceLayoutManager.prototype.getArrayForProposedUri Devel error => type !=node and link :"+type+" uri:"+uri);
  };

  AskomicsForceLayoutManager.prototype.offProposedUri = function(type,uri) {

    tab = this.getArrayForProposedUri(type);

    for (var uriI of tab) {
      if (uriI == uri) return;
    }
    tab.push(uri);
  };

  AskomicsForceLayoutManager.prototype.onProposedUri = function(type,uri) {

    tab = this.getArrayForProposedUri(type);

    for (var i in tab) {
      if (tab[i] == uri ) {
        tab.splice(i,1);
        return;
      }
    }
  };

  AskomicsForceLayoutManager.prototype.isProposedUri = function(type,uri) {

    tab = this.getArrayForProposedUri(type);

    for (var i in tab) {
      if (tab[i] == uri ) {
        return false;
      }
    }
    return true;
  };

  AskomicsForceLayoutManager.prototype.fullsizeGraph = function() {
    $('#viewDetails').hide();
    $('#results').hide();
    $('#graph').attr('class', 'col-md-12');
    $("#svg").attr('height', 700);
    $("#svg").attr('width', $("#svgdiv").width());

    //change icon
    $('#icon-resize-graph').attr('class', 'glyphicon glyphicon-resize-small');
    $('#icon-resize-graph').attr('value', 'full');
  };

  AskomicsForceLayoutManager.prototype.normalsizeGraph = function() {
    $('#viewDetails').show();
    $('#results').show();
    $('#graph').attr('class', 'col-md-6');
    $("#svg").attr('height', 350);
    $("#svg").attr('width', $("#svgdiv").width());

    //change icon
    $('#icon-resize-graph').attr('class', 'glyphicon glyphicon-resize-full');
    $('#icon-resize-graph').attr('value', 'small');
  };

  AskomicsForceLayoutManager.prototype.fullsizeRightview = function() {
    $('#graph').hide();
    $('#results').hide();
    $('#viewDetails').attr('class', 'col-md-12');
    $('.div-details').attr('class', 'div-details-max');

    //change icon
    $('#icon-resize-attr').attr('class', 'glyphicon glyphicon-resize-small');
    $('#icon-resize-attr').attr('value', 'full');
  };

  AskomicsForceLayoutManager.prototype.normalsizeRightview = function() {
    $('#graph').show();
    $('#results').show();
    $('#viewDetails').attr('class', 'col-md-6');
    $('.div-details-max').attr('class', 'div-details');

    //change icon
    $('#icon-resize-attr').attr('class', 'glyphicon glyphicon-resize-full');
    $('#icon-resize-attr').attr('value', 'small');
  };

  $('#full-screen-graph').click(function() {
    if ($('#icon-resize-graph').attr('value') == 'small') {
      forceLayoutManager.fullsizeGraph();
      return;
    }

    if ($('#icon-resize-graph').attr('value') == 'full') {
      forceLayoutManager.normalsizeGraph();
      return;
    }
  });

  $('#full-screen-attr').click(function() {
    if ($('#icon-resize-attr').attr('value') == 'small') {
      forceLayoutManager.fullsizeRightview();
      return;
    }

    if ($('#icon-resize-attr').attr('value') == 'full') {
      forceLayoutManager.normalsizeRightview();
      return;
    }
  });

  var vis = d3.select("#svgdiv")
              .append("svg:svg")
              .attr("width", w)
              .attr("height", h)
              .attr("id", "svg")
              .attr("pointer-events", "all")
              .attr("viewBox", "0 0 " + w + " " + h)
              .attr("perserveAspectRatio", "xMinYMid")
              .append('svg:g');
            //  .call(d3.behavior.zoom().on("zoom", console.log("redraw")));
/*
              .on("mouseover", function() { focus.style("display", null); })
              .on("mouseout", function() { focus.style("display", "none"); })
              .on("mousemove", mousemove);
*/
  var force = d3.layout.force();

  var nodes = force.nodes();
  var links = force.links();

  var colorPalette = ["yellowgreen","teal","paleturquoise","peru","tomato","steelblue","lightskyblue","lightcoral"];
  var idxColorPalette = 0 ;
      /* Color associate with Uri */
  var colorUriList = {} ;

  var ctrlPressed = false ;
  var selectNodes = []    ;
  var selectLink  = ''    ;

  /* Definition of an event when CTRL key is actif to select several node */
  $(document).keydown(function (e) {
    if (e.keyCode == 17) {
          ctrlPressed = true ;
      }
  });

  $(document).keyup(function (e) {
      ctrlPressed = false ;
  });

  AskomicsForceLayoutManager.prototype.colorSelectdObject = function (prefix,id) {
    $(prefix+id).css("stroke", "firebrick");
  };

  AskomicsForceLayoutManager.prototype.start = function () {
    /* Get information about start point to bgin query */
    var startPoint = $('#startpoints').find(":selected").data("value");
    /* load abstraction */
    userAbstraction.loadUserAbstraction();
    /* initialize menus */
    menuView.start();
    menuFile.start();
    /* Setting up an ID for the first variate */
    graphBuilder.setStartpoint(startPoint);
    /* first node */
    nodes.push(startPoint);
    this.manageSelectedNodes(startPoint);

    attributesView.create(startPoint);
    /* update right view with attribute view */
    attributesView.show(startPoint);
    nodeView.show(startPoint);
    /* insert new suggestion with startpoints */
    this.insertSuggestions();
    /* build graph */
    this.update();
    this.colorSelectdObject("#node_",startPoint.id);
  };

  AskomicsForceLayoutManager.prototype.startWithQuery = function (dump) {

    d3.select("g").selectAll("*").remove();
    userAbstraction.loadUserAbstraction();
    /* initialize menus */
    menuView.start();
    menuFile.start();

    nodes.splice(0, nodes.length);
    links.splice(0, links.length);

    t = graphBuilder.setNodesAndLinksFromState(dump);
    lnodes = t[0];
    llinks = t[1];

    if ( lnodes.length <=0 ) return ; /* nothing to do */

    for (var n of lnodes) {
      nodes.push(n);
      //graphBuilder.nodes().push(n);
      nodeView.create(n);
      attributesView.create(n);
    }
    attributesView.hideAll();

    for (var l of llinks) {
      links.push(l);
      linksView.create(l);
    }

    linksView.hideAll();
    /* select the last node */
    var lastn = graphBuilder.nodes()[graphBuilder.nodes().length-1];
    this.unSelectNodes();
    this.manageSelectedNodes(lastn);
    /* update right view with attribute view */
    attributesView.show(lastn);
    nodeView.show(lastn);
    /* insert new suggestion with startpoints */
    this.insertSuggestions();
    this.update();
    this.colorSelectdObject("#node_",lastn.id);
  };

    AskomicsForceLayoutManager.prototype.updateInstanciateLinks = function(links) {
      console.log('updateInstanciateLinks size:'+links.length);
      for (var l of links) {
        var id = l.id;
        console.log(JSON.stringify(l));
        $("#" + id).css("stroke-dasharray","");
        $("#" + id).css("opacity","1");
        $('#label-'+id).css('opacity', "1");
      }
    };

    AskomicsForceLayoutManager.prototype.getColorInstanciatedNode = function(node) {
      if ( ! node  ) {
        throw new Error("AskomicsForceLayoutManager.prototype.getColorInstanciatedNode node is not defined!");
      }

      if (! ('uri' in node)) {
        throw new Error("AskomicsForceLayoutManager.prototype.getColorInstanciatedNode node has not uri !:"+JSON.stringify(node));
      }

      if ( node.uri in colorUriList ) {
        return colorUriList[node.uri];
      }


      colorUriList[node.uri] = colorPalette[idxColorPalette++];
      if (idxColorPalette >= colorPalette.length) idxColorPalette = 0;
      return colorUriList[node.uri];
    };
    /* //not used anymore
    AskomicsForceLayoutManager.prototype.getStrokeColorInstanciatedNode = function(node) {
      if ( ! node  ) {
        throw new Error("AskomicsForceLayoutManager.prototype.getStrokeColorInstanciatedNode node is not defined!");
      }

      if (node.positionable) {
        return 'darkgreen';
      } else {
        return 'dimgrey';
      }
    };
    */

    /* Update the label of cercle when a node is instanciated */
    AskomicsForceLayoutManager.prototype.updateInstanciatedNode = function(node) {

      if ( ! node  )
        throw new Error("AskomicsForceLayoutManager.prototype.updateInstanciateNode : node is not defined !");

      // change label node with the SPARQL Variate Id
      $('#txt_'+node.id).html(graphBuilder.getLabelNode(node)+'<tspan font-size="7" baseline-shift="sub">'+graphBuilder.getLabelIndexNode(node)+"</tspan>");
      // canceled transparency
      $("#node_"+node.id).css("opacity", "1");
      $('#txt_'+node.id).css("opacity","1");
    };

    /* Update the label of cercle when a node is instanciated */
    AskomicsForceLayoutManager.prototype.manageSelectedNodes = function(node) {

      if (! ctrlPressed) {
        $("[id*='node_']").each(function (index, value) {
          $(this).css("stroke", "grey");
        });

        /* if several node were selected or a diffente node were selected so select only the current node */
        if ( selectNodes.length > 1 || (selectNodes.length===0) || (selectNodes[0].id != node.id) ) {
          selectNodes = [] ;
          selectNodes.push(node);
          forceLayoutManager.colorSelectdObject("#node_",node.id);
        } else { /* deselection of node */
          selectNodes = [] ;
          console.log('---> deselection');
          $("#node_"+node.id).css("stroke", "grey");
        }

      } else {
        // deselection case
        for ( var n in selectNodes ){
          if (selectNodes[n].id == node.id) {
            // remove the current node from the selected node list !
             selectNodes.splice(n,1);
             $("#node_"+node.id).css("stroke", "grey");
             return;
          }
        }
        selectNodes.push(node);
        forceLayoutManager.colorSelectdObject("#node_",node.id);
      }

      if (selectNodes.length == 0) {
        //no node selected: hide rightview
        attributesView.hideAll();
        //linksView.hideAll();
      };
    };

    /* unselect all nodes */
    AskomicsForceLayoutManager.prototype.unSelectNodes = function() {
      selectNodes = [];
      $("[id*='node_']").each(function (index, value) {
        $(this).css("stroke", "grey");
      });
    };

    AskomicsForceLayoutManager.prototype.selectLink = function(link) {
      $("#"+link.id).css("stroke", "firebrick");
      $('#end-marker-'+link.id).css("stroke", "firebrick");
      $('#end-marker-'+link.id).css("fill", "firebrick");
      $('#start-marker-'+link.id).css("stroke", "firebrick");
      $('#start-marker-'+link.id).css("fill", "firebrick");
      selectLink = link;
    };

    AskomicsForceLayoutManager.prototype.unSelectLinks = function() {
      $(".link").each(function (index) {
        $(this).css("stroke", "grey");
        selectLink = '';
      });
      $(".arrow").each(function (index) {
        $(this).css("stroke", "grey");
        $(this).css("fill", "grey");
        selectLink = '';
      });
    };

    AskomicsForceLayoutManager.prototype.nodeIsSelected = function(node) {
      if (selectNodes.length > 1) {
        for (var i of selectNodes) {
          if ( node.id == i.id ) return true;
        }
      }
      return false;
    };

    AskomicsForceLayoutManager.prototype.insertSuggestions = function () {
      if (selectNodes.length === 0 ) {
        return ;
      } else if (selectNodes.length === 1 ) {
        this.insertSuggestionsWithNewNode(selectNodes[0]);
      } else if (selectNodes.length === 2) {
        this.insertSuggestionsWithTwoNodesInstancied(selectNodes[0],selectNodes[1]);
      }
    };

    AskomicsForceLayoutManager.prototype.insertSuggestionsWithNewNode = function (slt_node) {
        /* get All suggested node and relation associated to get orientation of arc */
        tab = userAbstraction.getRelationsObjectsAndSubjectsWithURI(slt_node.uri);
        objectsTarget = tab[0];  /* All triplets which slt_node URI are the subject */
        subjectsTarget = tab[1]; /* All triplets which slt_node URI are the object */
        var link = {} ;

        var suggestedList = {} ;

        for (var uri in objectsTarget ) {
          /* Filter if node are not desired by the user */
          if (! forceLayoutManager.isProposedUri("node",uri)) continue ;
          /* creatin node */
          suggestedNode = userAbstraction.buildBaseNode(uri);
          /* specific attribute for suggested node */
          graphBuilder.setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);

          for (var rel in objectsTarget[uri]) {
            /* Filter if link are not desired by the user */
            if (! forceLayoutManager.isProposedUri("link",objectsTarget[uri][rel])) continue ;

            /* adding in the node list to create D3.js graph */
            if ( ! (suggestedNode.id in slt_node.nlink) ) {
              /* We create a unique instance and add all possible relation between selected node and this suggested node */
              suggestedList[uri] = suggestedNode ;
              slt_node.nlink[suggestedList[uri].id] = 0;
              suggestedList[uri].nlink[slt_node.id] = 0;
              nodes.push(suggestedNode);
            }
            /* increment the number of link between the two nodes */
            slt_node.nlink[suggestedList[uri].id]++;
            suggestedList[uri].nlink[slt_node.id]++;

            link = {
              suggested : true,
              positionable : false,
              uri   : objectsTarget[uri][rel],
              source: slt_node,
              target: suggestedList[uri],
              label: userAbstraction.removePrefix(objectsTarget[uri][rel]),
              linkindex: slt_node.nlink[suggestedList[uri].id],
            };

            link.source.weight++;
            graphBuilder.setId(link);
            links.push(link);
          }
        }

        for (uri in subjectsTarget ) {
          /* Filter if node are not desired by the user */
          if (! forceLayoutManager.isProposedUri("node",uri)) continue ;

          if ( ! (uri in suggestedList) ) {
            suggestedNode = userAbstraction.buildBaseNode(uri);
            graphBuilder.setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);
          }

          for (var rel2 in subjectsTarget[uri]) {
            /* Filter if link are not desired by the user */
            if (! forceLayoutManager.isProposedUri("link",subjectsTarget[uri][rel2])) continue ;

            /* adding in the node list to create D3.js graph */
            if ( ! (suggestedNode.id in slt_node.nlink) ) {
              suggestedList[uri] = suggestedNode ;
              slt_node.nlink[suggestedList[uri].id] = 0;
              suggestedList[uri].nlink[slt_node.id] = 0;
              nodes.push(suggestedNode);
            }

            slt_node.nlink[suggestedList[uri].id]++;
            suggestedList[uri].nlink[slt_node.id]++;

            link = {
              suggested : true,
              positionable : false,
              type : '',       // using with positionable object
              sameTax: false,  // using with positionable object
              sameRef: false,  // using with positionable object
              strict: false,   // using with positionable object
              uri   : subjectsTarget[uri][rel2],
              source: suggestedList[uri],
              target: slt_node,
              label: userAbstraction.removePrefix(subjectsTarget[uri][rel2]),
              linkindex: slt_node.nlink[suggestedList[uri].id],
            };
            graphBuilder.setId(link);
            link.source.weight++;
            links.push(link);
          }
        }
        // add neighbours of a node to the graph as propositions.

        // Manage positionnable entities
        positionableEntities = userAbstraction.getPositionableEntities();

        for (uri in positionableEntities) {
          // if selected node is not a positionable node, donc create a positionable
          // link with an other positionable node
          if (! (slt_node.uri in positionableEntities)) continue;
          /* Filter if node are not desired by the user */
          if (! forceLayoutManager.isProposedUri("node",uri)) continue ;
          /* Filter if link are not desired by the user */
          if (! forceLayoutManager.isProposedUri("link","positionable")) continue ;

          /* uncomment if we don't want a positionable relation between the same node  */
          //if ( uri == slt_node.uri ) continue ;

          if ( ! (uri in suggestedList) ) {
            /* creatin node */
            suggestedNode = userAbstraction.buildBaseNode(uri);
            /* specific attribute for suggested node */
            graphBuilder.setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);
            /* adding in the node list to create D3.js graph */
            nodes.push(suggestedNode);
            suggestedList[uri] = suggestedNode ;

            slt_node.nlink[suggestedList[uri].id]=0;
            suggestedList[uri].nlink[slt_node.id]=0;
          }

          slt_node.nlink[suggestedList[uri].id]++;
          suggestedList[uri].nlink[slt_node.id]++;

          link = {
            suggested : true,
            positionable : true,
            uri   : 'positionable',
            type : 'included',
            sameTax: true,
            sameRef: true,
            strict: true,
            source: suggestedList[uri],
            target: slt_node,
            label: 'included in',
            linkindex: slt_node.nlink[suggestedList[uri].id],
          };
          graphBuilder.setId(link);
          link.source.weight++;
          links.push(link);
        }

    } ;

    AskomicsForceLayoutManager.prototype.relationInstancied = function (subj, obj,relation,links) {
      for ( var rel of links ) {
        if ( rel.source == subj && rel.target == obj && rel.uri == relation ) return true;
      }
      return false;
    };

    AskomicsForceLayoutManager.prototype.insertSuggestionsWithTwoNodesInstancied = function (node1, node2) {

      /* get All suggested node and relation associated to get orientation of arc */
      tab = userAbstraction.getRelationsObjectsAndSubjectsWithURI(node1.uri);
      objectsTarget = tab[0];  /* All triplets which slt_node URI are the subject */
      subjectsTarget = tab[1]; /* All triplets which slt_node URI are the object */

      for (var rel in objectsTarget[node2.uri]) {
        /* Filter if link are not desired by the user */
        if (! forceLayoutManager.isProposedUri("link",objectsTarget[node2.uri][rel])) continue ;

        if ( this.relationInstancied(node1,node2,objectsTarget[node2.uri][rel],links) ) continue ;
        /* increment the number of link between the two nodes */
        if ( ! (node2.id in node1.nlink) ) {
          node1.nlink[node2.id] = 0;
          node2.nlink[node1.id] = 0;
        }
        node1.nlink[node2.id]++;
        node2.nlink[node1.id]++;

        link = {
          suggested : true,
          positionable : false,
          uri   : objectsTarget[node2.uri][rel],
          source: node1,
          target: node2,
          label: userAbstraction.removePrefix(objectsTarget[node2.uri][rel]),
          linkindex: node1.nlink[node2.id],
        };
        graphBuilder.setId(link);
        link.source.weight++;
        links.push(link);
      }

      for (var rel2 in subjectsTarget[node2.uri]) {
        /* Filter if link are not desired by the user */
        if (! forceLayoutManager.isProposedUri("link",subjectsTarget[node2.uri][rel2])) continue ;

        if ( this.relationInstancied(node2,node1,subjectsTarget[node2.uri][rel2],links) ) continue ;

        if ( ! (node2.id in node1.nlink) ) {
          node1.nlink[node2.id] = 0;
          node2.nlink[node1.id] = 0;
        }

        node1.nlink[node2.id]++;
        node2.nlink[node1.id]++;

        link = {
          suggested : true,
          positionable : false,
          uri   : subjectsTarget[node2.uri][rel2],
          source: node2,
          target: node1,
          label: userAbstraction.removePrefix(subjectsTarget[node2.uri][rel2]),
          linkindex: node1.nlink[node2.id],
        };
        graphBuilder.setId(link);
        link.source.weight++;
        links.push(link);
      }
      // Manage positionnable entities
      positionableEntities = userAbstraction.getPositionableEntities();

      if ( forceLayoutManager.isProposedUri("link","positionable") &&
           (node1.uri in positionableEntities) && (node2.uri in positionableEntities)) {

        node1.nlink[node2.id]++;
        node2.nlink[node1.id]++;

        link = {
            suggested : true,
            positionable : true,
            uri   : 'positionable',
            type : 'included',
            sameTax: true,
            sameRef: true,
            strict: true,
            source: node2,
            target: node1,
            label: 'included in',
            linkindex: node2.nlink[node1.id],
          };
        graphBuilder.setId(link);
        link.source.weight++;
        links.push(link);
      }
    };

    /* Remove all nodes and links suggestion */
    AskomicsForceLayoutManager.prototype.removeSuggestions = function() {

      var removeL = [];
      for (var idx in links) {
        l = links[idx];
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
        links.splice(removeL[j],1);
      }
      var removeN = [];
      // remove suggested node
      for (var node in nodes) {
        if ( nodes[node].suggested ) {
          removeN.push(node);
        }
      }
      for (var n2=removeN.length-1;n2>=0;n2--){
        idxn = removeN[n2];
        nodes.splice(idxn,1);
      }
    } ;              /* user want a new relation contraint betwwenn two node*/


  AskomicsForceLayoutManager.prototype.update = function () {
    console.log('---> update graph!');

    var link = vis.selectAll(".link")
                  .data(links, function (d) {
                      return d.id ;
                  });

    var arrow = vis.selectAll(".arrow")
                   .data(links, function (d) {
                      return d.id ;
                   });

    // Link labels
    link.enter().append("text")
                .attr("style", "text-anchor:middle; font: 10px sans-serif; cursor: pointer;")
                .attr("dy", "-5")
                .attr('id', function(d) {return 'label-'+d.id;})
                .style("opacity", function(d) {return d.suggested?"0.3":"1";})
                .append("textPath")
                .attr("xlink:href",function(d) {return "#"+d.id;})
                .attr("startOffset", "35%")
                .attr('fill', function(d){ return d.positionable?'darkgreen':'grey'})
                .text(function(d){return d.label;})
                .on('click', function(d) { // Mouse down on a link label

                  if (d != selectLink) { //if link is not selected
                    /* user want a new relation contraint betwwenn two node*/

                    //deselect all nodes and links
                    forceLayoutManager.unSelectNodes();
                    forceLayoutManager.unSelectLinks();

                    //select link
                    forceLayoutManager.selectLink(d);

                    if ( d.suggested ) {
                      ll = [d];
                      graphBuilder.instanciateLink(ll);
                      forceLayoutManager.updateInstanciateLinks(ll);
                      if ( d.source.suggested || d.target.suggested  ) {
                        var node = d.source.suggested?d.source:d.target;
                        graphBuilder.instanciateNode(node);
                        forceLayoutManager.updateInstanciatedNode(node);
                        nodeView.create(node);
                        attributesView.create(node);
                        // remove old suggestion
                        forceLayoutManager.removeSuggestions();
                        if (selectNodes.length <= 1) {
                          forceLayoutManager.unSelectNodes();
                        } else {
                          // insert new suggestion
                          forceLayoutManager.insertSuggestions();
                        }
                      }
                      linksView.create(d);
                    }else{
                      forceLayoutManager.removeSuggestions();
                    }
                    /* update node view  */
                    nodeView.hideAll();
                    /* update right view with link view */
                    attributesView.hideAll();
                    /* update link view */
                    linksView.hideAll();
                    linksView.show(d);
                    forceLayoutManager.update();
                  }else{
                    forceLayoutManager.unSelectNodes();
                    forceLayoutManager.unSelectLinks();
                    forceLayoutManager.update();
                    attributesView.hideAll();
                    linksView.hideAll();
                  }
              });

    /* nodes or links could be removed by other views */
    graphBuilder.synchronizeInstanciatedNodesAndLinks(nodes,links);

    // Arrows
    arrow.enter().append("svg:defs").append("svg:marker")
                     .attr("id", function(d) {return 'end-marker-'+d.id;})
                     .attr('link_id', function(d) {return d.id;})
                     .attr("class", "arrow")
                     .style('stroke', 'grey')
                     .style('fill', 'grey')
                     .attr("viewBox", "0 -5 10 10")
                     .attr("refX", 15)
                     .attr("refY", 0)
                     .attr("markerWidth", 6)
                     .attr("markerHeight", 6)
                     .attr("orient", "auto")
                     .append("path")
                     .attr("d", "M0,-5L10,0L0,5");

    // Second arrows
    arrow.enter().append("svg:defs").append("svg:marker")
                     .attr("id", function(d) {return 'start-marker-'+d.id;})
                     .attr('link_id', function(d) {return d.id;})
                     .attr("class", "arrow")
                     .style('stroke', 'grey')
                     .style('fill', 'grey')
                     .attr("viewBox", "0 -5 10 10")
                     .attr("refX", -5)
                     .attr("refY", 0)
                     .attr("markerWidth", 6)
                     .attr("markerHeight", 6)
                     .attr("orient", "auto")
                     .append("path")
                     .attr("d", "M0,0L10,-5L10,5Z");

      // Links
      link.enter().append("svg:path")
          .attr("id", function (d) { return d.id ; })
          .attr('idlink', function(d) {return d.id;})
          .attr("label", function (d) { return d.label ; })
          .attr("class", "link")
          .attr("marker-end", function(d) {return "url(#end-marker-"+d.id+")";})
          .attr("marker-start", function(d) {return d.type == 'overlap'?"url(#start-marker-"+d.id+")":"";})
          .style('stroke', 'grey')
          .style("stroke-dasharray",function(d) {return d.suggested?"2":"";})
          .style("opacity", function(d) {return d.suggested?"0.3":"1";})
          .style("stroke-width", "2")
          .on("mouseover", function(d) { this.style[2]="4";});

      var node = vis.selectAll("g.node")
                  .data(nodes, function (d) { return d.id; });

      var nodeEnter = node.enter().append("g")
                          .attr("class", "node")
                          .call(force.drag);

      //setup_node(nodeEnter,slt_elt,slt_data,prev_elt,prev_data);
      nodeEnter.append("svg:circle")
              .attr("style", "cursor: pointer;")
              .attr("r", configDisplay.rNode)
              .attr("id", function (d) { return "node_" + d.id; })
              .attr("uri", function (d) { return d.uri; })
              .attr("class", "nodeStrokeClass")
              .style('stroke', 'grey')
              .style("fill", function (d) { return forceLayoutManager.getColorInstanciatedNode(d); })
              .style("opacity", function(d) {
                  return (d.suggested === true ? configDisplay.opacityNode : 1);
              })
              .on('click', function(d) {
                forceLayoutManager.manageSelectedNodes(d);
                forceLayoutManager.unSelectLinks();
              // Mouse up on a link
              //document.body.style.cursor = 'default';
                // nothing todo for intance
                if (! graphBuilder.isInstanciatedNode(d)) {
                  // When selected a node is not considered suggested anymore.
                  graphBuilder.instanciateNode(d);
                  forceLayoutManager.updateInstanciatedNode(d);
                  var listOfLinksInstancied = linksView.selectListLinksUser(links,d);
                  graphBuilder.instanciateLink(listOfLinksInstancied);
                  forceLayoutManager.updateInstanciateLinks(listOfLinksInstancied);
                  for (var ll of listOfLinksInstancied ) {
                    linksView.create(ll);
                  }
                  nodeView.create(d);
                  attributesView.create(d);
                }

                linksView.hideAll();

                /* update node view  */
                nodeView.hideAll();
                nodeView.show(d);

                /* update right view with attribute view */
                attributesView.hideAll();

                // show attribute view only if node is not selected
                if (!$.inArray(d, selectNodes)) {
                  attributesView.show(d);
                };

                /* remove old suggestion */
                forceLayoutManager.removeSuggestions();
                /* insert new suggestion */
                forceLayoutManager.insertSuggestions();
                /* update graph */
                forceLayoutManager.update();
              });

      nodeEnter.append("svg:text")//.append("tspan")
              .attr("class", "textClass")
              .attr("x", 14)
              .attr('fill', function(d){return d.positionable?'darkgreen':'black'})
              .style('stroke', function(d){return d.positionable?'darkgreen':'black'})
              .style("opacity", function(d) {
                  return (d.suggested === true ? configDisplay.opacityNode : 1);
              })
              .attr("y", ".31em")
              .attr("id", function (d) {
                  return "txt_" + d.id;
              })
              .text(function (d) {
                  return graphBuilder.getLabelNode(d);
                }).append("tspan")
                  .attr("font-size","7")
                  .attr("baseline-shift","sub")
                .text(function (d) {
                    return graphBuilder.getLabelIndexNode(d);
                  });

      link.exit().remove();
      node.exit().remove();

      force.on("tick", function () {
          node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

          link.attr("d", function(d) {
            var nlinks = d.source.nlink[d.target.id]; // same as d.target.nlink[d.source.id]

            /* diminution of arc to improve display of links */
            var penteX = d.target.x-d.source.x;
            var penteY = d.target.y-d.source.y;
            /* arrondi a une decimale */
            penteX = Math.round(penteX*10)/10;
            penteY = Math.round(penteY*10)/10;

            var XT=0,YT=0,XS=0,YS=0;
            var dim = configDisplay.rNode/3.0;
            if ( penteX >0 && penteY>0) {
              XT = -dim ;
              YT = -dim ;
              XS = dim  ;
              YS = dim  ;
            } else if
            ( penteX >0 && penteY<0) {
              XT = -dim ;
              YT = dim ;
              XS = dim  ;
              YS = - dim  ;
            } else if ( penteX <0 && penteY>0) {
              XT = dim ;
              YT = -dim ;
              XS = -dim  ;
              YS = dim  ;
            } else if ( penteX <0 && penteY<0) {
              XT = dim ;
              YT = dim ;
              XS = -dim  ;
              YS = -dim  ;
            }
            Xsource = d.source.x + XS;
            Ysource = d.source.y + YS;
            Xtarget = d.target.x + XT;
            Ytarget = d.target.y + YT;
            /* Manage a line if weigth = 1 */
            if ( nlinks <= 1 ) {
              return "M" + Xsource + "," + Ysource + "L" + Xtarget + "," + Ytarget  ;
            } else {
              /* sinon calcul d une courbure */
              var dx = Xtarget - Xsource,
                dy = Ytarget - Ysource,
                dr = Math.sqrt(dx * dx + dy * dy);

              // if there are multiple links between these two nodes, we need generate different dr for each path
              dr = dr/(1 + (1/nlinks) * (d.linkindex - 1));

              // generate svg path
              return "M" + Xsource + "," + Ysource +
                     "A" + dr + "," + dr + " 0 0 1," + Xtarget + "," + Ytarget +
                     "A" + dr + "," + dr + " 0 0 0," + Xsource + "," + Ysource;
            }
          });

      });

      // Ensure the nodes are in front and the links on the back
      $(".nodeStrokeClass").each(function( index ) {
          var gnode = this.parentNode;
          gnode.parentNode.appendChild(gnode);
      });


      // Restart the force layout.
      force.charge(-700)
          .linkDistance(175)
          .friction(0.7)
          //.alpha(1)
          .size([w, h])
          .start();
  };
};
