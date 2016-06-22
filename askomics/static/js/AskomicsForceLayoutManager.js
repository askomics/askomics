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

  var vis = d3.select("#svgdiv")
              .append("svg:svg")
              .attr("width", w)
              .attr("height", h)
              .attr("id", "svg")
              .attr("pointer-events", "all")
              .attr("viewBox", "0 0 " + w + " " + h)
              .attr("perserveAspectRatio", "xMinYMid")
              .append('svg:g');
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

  /* Definition of an event when CTRL key is actif to select several node */
  $(document).keydown(function (e) {
    if (e.keyCode == 17) {
          ctrlPressed = true ;
      }
  });

  $(document).keyup(function (e) {
      ctrlPressed = false ;
  });
/*
  AskomicsForceLayoutManager.prototype.setNodes = function (_nodes) {
    nodes=_nodes;
    force.nodes(_nodes);
  };

  AskomicsForceLayoutManager.prototype.setLinks = function (_links) {
    links=_links;
    force.links(_links);
  };
*/
  AskomicsForceLayoutManager.prototype.colorSelectdObject = function (prefix,id) {
    $(prefix+id).css("fill", "mediumvioletred");
  };

  AskomicsForceLayoutManager.prototype.start = function () {
    /* Get information about start point to bgin query */
    var startPoint = $('#startpoints').find(":selected").data("value");
    /* load abstraction */
    userAbstraction.loadUserAbstraction();
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
    this.insertSuggestions(startPoint);
    /* build graph */
    this.update();
    this.colorSelectdObject("#node_",startPoint.id);
  };

  AskomicsForceLayoutManager.prototype.startWithQuery = function (dump) {

    userAbstraction.loadUserAbstraction();
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
    this.insertSuggestions(lastn);
    this.update();
    this.colorSelectdObject("#node_",lastn.id);
  };

    AskomicsForceLayoutManager.prototype.updateInstanciateLinks = function(links) {
      for (var l of links) {
        var id = l.source.id + "-" + l.target.id + "-" + l.linkindex;
        $("#" + id).css("stroke-dasharray","");
        $("#" + id).css("opacity","1");
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


    /* Update the label of cercle when a node is instanciated */
    AskomicsForceLayoutManager.prototype.updateInstanciatedNode = function(node) {

      if ( ! node  )
        throw new Error("AskomicsForceLayoutManager.prototype.updateInstanciateNode : node is not defined !");

      // change label node with the SPARQL Variate Id
      $('#txt_'+node.id).html(graphBuilder.getLabelNode(node)+'<tspan font-size="7" baseline-shift="sub">'+graphBuilder.getLabelIndexNode(node)+"</tspan>");
      // canceled transparency
      $("#node_"+node.id).css("opacity", "1");
      //$("#node_"+node.id).css("fill", this.getColorInstanciatedNode(node));
    };

    /* Update the label of cercle when a node is instanciated */
    AskomicsForceLayoutManager.prototype.manageSelectedNodes = function(node) {

      if (! ctrlPressed) {
        $("[id*='node_']").each(function (index, value) {
          var n = {};
          n.uri = $(this).attr('uri') ;
          $(this).css("fill",forceLayoutManager.getColorInstanciatedNode(n));
        });

        /* if several node were selected or a diffente node were selected so select only the current node */
        if ( selectNodes.length > 1 || (selectNodes.length===0) || (selectNodes[0].id != node.id) ) {
          selectNodes = [] ;
          selectNodes.push(node);
          forceLayoutManager.colorSelectdObject("#node_",node.id);
        } else { /* deselection of node */
          selectNodes = [] ;
          $("#node_"+node.id).css("fill", forceLayoutManager.getColorInstanciatedNode(node));
        }

      } else {
        // deselection case
        for ( var n in selectNodes ){
          if (selectNodes[n].id == node.id) {
            // remove the current node from the selected node list !
             selectNodes.splice(n,1);
             $("#node_"+node.id).css("fill", forceLayoutManager.getColorInstanciatedNode(node));
             return;
          }
        }
        selectNodes.push(node);
        forceLayoutManager.colorSelectdObject("#node_",node.id);
      }
    };

    /* unselect all nodes */
    AskomicsForceLayoutManager.prototype.unSelectNodes = function() {
      selectNodes = [];
      $("[id*='node_']").each(function (index, value) {
        var n = {};
        n.uri = $(this).attr('uri') ;
        $(this).css("fill",forceLayoutManager.getColorInstanciatedNode(n));
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

    AskomicsForceLayoutManager.prototype.insertSuggestions = function (node) {
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
          /* creatin node */
          suggestedNode = userAbstraction.buildBaseNode(uri);
          /* specific attribute for suggested node */
          graphBuilder.setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);
          /* adding in the node list to create D3.js graph */
          nodes.push(suggestedNode);
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
          if ( ! (uri in suggestedList) ) {
            suggestedNode = userAbstraction.buildBaseNode(uri);
            graphBuilder.setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);
            nodes.push(suggestedNode);
            suggestedList[uri] = suggestedNode ;
            slt_node.nlink[suggestedList[uri].id] = 0;
            suggestedList[uri].nlink[slt_node.id] = 0;
          }

          for (var rel2 in subjectsTarget[uri]) {
            slt_node.nlink[suggestedList[uri].id]++;
            suggestedList[uri].nlink[slt_node.id]++;

            link = {
              suggested : true,
              positionable : false,
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

        for ( uri in positionableEntities ) {
          if ( uri == slt_node.uri ) continue ;
          console.log("add positionable suggestion:"+uri);
          console.log(JSON.stringify(positionableEntities[uri]));
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
            uri   : 'positionable:include',
            source: slt_node,
            target: suggestedList[uri],
            label: '<include>',
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

      if ( (node1.uri in positionableEntities) && (node2.uri in positionableEntities)) {
        console.log("add positionable suggestion between:"+node1.uri+" and "+node2.uri);
        console.log(JSON.stringify(positionableEntities[node1.uri]));
        console.log(JSON.stringify(positionableEntities[node2.uri]));

        node1.nlink[node2.id]++;
        node2.nlink[node1.id]++;

        link = {
          suggested : true,
          positionable : true,
          uri   : ':positionable:include',
          source: node1,
          target: node2,
          label: '<include>',
          linkindex: node1.nlink[node2.id],
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

    var link = vis.selectAll(".link")
                  .data(links, function (d) {
                      return d.source.id + "-" + d.target.id + "-" + d.linkindex ;
                  });
    /* nodes or links could be removed by other views */
    graphBuilder.synchronizeInstanciatedNodesAndLinks(nodes,links);

    vis.append("svg:defs").append("svg:marker")
                     .attr("id", "marker")
                     .attr("viewBox", "0 -5 10 10")
                     .attr("refX", 15)
                     .attr("refY", -1.5)
                     .attr("markerWidth", 6)
                     .attr("markerHeight", 6)
                     .attr("orient", "auto")
                     .append("path")
                     .attr("d", "M0,-5L10,0L0,5");


      link.enter().append("svg:path")
          .attr("id", function (d) { return d.source.id + "-" + d.target.id + "-" + d.linkindex ; })
          .attr("label", function (d) { return d.label ; })
          .attr("class", "link")
          .attr("marker-end", "url(#marker)")
          .style('stroke', function(d){return d.positionable?'darkgreen':'grey';})
          .style("stroke-dasharray",function(d) {return d.suggested?"2":"";})
          .style("opacity", function(d) {return d.suggested?"0.3":"1";})
          .style("stroke-width", "2")
          .on("mouseover", function(d) { this.style[2]="4";})//style("stroke", "#2A2A2A"); })
          .on('click', function(d) { // Mouse down on a link
              /* user want a new relation contraint betwwenn two node*/
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
                  /* remove old suggestion */
                  forceLayoutManager.removeSuggestions();
                  /* insert new suggestion */
                  forceLayoutManager.insertSuggestions(node);
                  /* update graph */
                  forceLayoutManager.update();
                }
                linksView.create(d);
              }
              /* update node view  */
              nodeView.hideAll();
              /* update right view with link view */
              attributesView.hideAll();
              /* update link view */
              linksView.hideAll();
              linksView.show(d);
          });
      /* append for each link a label to print relation property name */
      $('path').each(function (index, value) {
        vis.append("text")
                    .attr("style", "text-anchor:middle; font: 10px sans-serif;")
                    .attr("dy", "-5")
                    .append("textPath")
                    .attr("xlink:href","#"+$(this).attr('id'))
                    .attr("startOffset", "35%")
                    .text($(this).attr('label'));
      });



      var node = vis.selectAll("g.node")
                  .data(nodes, function (d) { return d.id; });

      var nodeEnter = node.enter().append("g")
                          .attr("class", "node")
                          .call(force.drag);

      //setup_node(nodeEnter,slt_elt,slt_data,prev_elt,prev_data);
      nodeEnter.append("svg:circle")
              .attr("r", configDisplay.rNode)
              .attr("id", function (d) { return "node_" + d.id; })
              .attr("uri", function (d) { return d.uri; })
              .attr("class", "nodeStrokeClass")
              .style("stroke", function(d){ return forceLayoutManager.getStrokeColorInstanciatedNode(d); })
              .style("fill", function (d) { return forceLayoutManager.getColorInstanciatedNode(d); })
              .style("opacity", function(d) {
                  return (d.suggested === true ? configDisplay.opacityNode : 1);
              })
              .on('click', function(d) {
                forceLayoutManager.manageSelectedNodes(d);
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
                attributesView.show(d);

                /* remove old suggestion */
                forceLayoutManager.removeSuggestions();
                /* insert new suggestion */
                forceLayoutManager.insertSuggestions(d);
                /* update graph */
                forceLayoutManager.update();
              });

      nodeEnter.append("svg:text")//.append("tspan")
              .attr("class", "textClass")
              .attr("x", 14)
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
      force.charge(-300)
          .linkDistance(175)
          .size([w, h])
          .start();
  };
};
