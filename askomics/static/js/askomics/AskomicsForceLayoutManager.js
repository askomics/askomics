/*jshint esversion: 6 */

/*
*/
var AskomicsForceLayoutManager = function () {

  var w = $("#svgdiv").width();
  var h = 350 ;

  var vis = d3.select("#svgdiv")
              .append("svg:svg")
              .attr("width", w)
              .attr("height", h)
              .attr("id", "svg")
              .attr("pointer-events", "all")
              .attr("viewBox", "0 0 " + w + " " + h)
              .attr("perserveAspectRatio", "xMinYMid")
              .append('svg:g');

  var force = d3.layout.force();

  var nodes = force.nodes(),
      links = force.links();

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

  AskomicsForceLayoutManager.prototype.start = function () {
    /* Get information about start point to bgin query */
    var startPoint = $('#startpoints').find(":selected").data("value");
    /* load abstraction */
    userAbstraction.loadUserAbstraction();
    /* Setting up an ID for the first variate */
    graphBuilder.setStartpoint(startPoint);
    /* first node */
    nodes.push(startPoint);
    attributesView.create(startPoint);
    /* update right view with attribute view */
    attributesView.show(startPoint);
    nodeView.show(startPoint);
    /* insert new suggestion with startpoints */
    this.insertSuggestions(startPoint);
    /* build graph */
    this.update();
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

    /* Update the label of cercle when a node is instanciated */
    AskomicsForceLayoutManager.prototype.updateInstanciatedNode = function(node) {

      if ( ! node  )
        throw new Error("AskomicsForceLayoutManager.prototype.updateInstanciateNode : node is not defined !");
      console.log("NEW LABEL:"+JSON.stringify(node));

      // change label node with the SPARQL Variate Id
      $('#txt_'+node.id).html(graphBuilder.getLabelNode(node)+'<tspan font-size="7" baseline-shift="sub">'+graphBuilder.getLabelIndexNode(node)+"</tspan>");
      // canceled transparency
      $("#node_"+node.id).css("opacity", "1");
      //$("#node_"+node.id).css("fill", this.getColorInstanciatedNode(node));
    };

    /* Update the label of cercle when a node is instanciated */
    AskomicsForceLayoutManager.prototype.manageSelectedNodes = function(node) {
      var agv = this ;

      if (! ctrlPressed) {
        $("[id*='node_']").each(function (index, value) {
          var n = {};
          n.uri = $(this).attr('uri') ;
          $(this).css("fill",agv.getColorInstanciatedNode(n));
        });

        selectNodes = [] ;
      } else {
        // deselection case
        for ( var n in selectNodes ){
          if (selectNodes[n].id == node.id) {
            // remove the current node from the selected node list !
             selectNodes.splice(n,1);
             $("#node_"+node.id).css("fill", agv.getColorInstanciatedNode(node));
             return;
          }
        }

      }
      selectNodes.push(node);
      $("#node_"+node.id).css("fill", "mediumvioletred");
    };

    AskomicsForceLayoutManager.prototype.insertSuggestions = function (node) {
      console.log("==== SUGGESTIONS ===");
      if (selectNodes.length === 0 ) {
        this.insertSuggestionsWithNewNode(node);
      } else if (selectNodes.length === 1 ) {
        this.insertSuggestionsWithNewNode(selectNodes[0]);
      } else if (selectNodes.length === 2) {
        this.insertSuggestionsWithTwoNodesInstancied(selectNodes[0],selectNodes[1]);
      }
    };

    AskomicsForceLayoutManager.prototype.insertSuggestionsWithNewNode = function (slt_node) {
        console.log("URI="+slt_node.uri);
        /* get All suggested node and relation associated to get orientation of arc */
        tab = userAbstraction.getRelationsObjectsAndSubjectsWithURI(slt_node.uri);
        console.log("SUGGESTION:"+JSON.stringify(tab));
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
              uri   : objectsTarget[uri][rel],
              source: slt_node,
              target: suggestedList[uri],
              label: userAbstraction.removePrefix(objectsTarget[uri][rel]),
              linkindex: slt_node.nlink[suggestedList[uri].id],
            };

            link.source.weight++;
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
              uri   : subjectsTarget[uri][rel2],
              source: suggestedList[uri],
              target: slt_node,
              label: userAbstraction.removePrefix(subjectsTarget[uri][rel2]),
              linkindex: slt_node.nlink[suggestedList[uri].id],
            };
            link.source.weight++;
            links.push(link);
          }
        }
        console.log("LINKS LENGTH="+links.length);
        // add neighbours of a node to the graph as propositions.
    } ;

    AskomicsForceLayoutManager.prototype.relationInstancied = function (subj, obj,relation,links) {
      console.log(subj.name);
      console.log(obj.name);
      console.log("relation:"+relation);
      for ( var rel of links ) {
        if ( rel.source == subj && rel.target == obj && rel.uri == relation ) return true;
      }
      return false;
    };

    AskomicsForceLayoutManager.prototype.insertSuggestionsWithTwoNodesInstancied = function (node1, node2) {
      console.log(" === insertSuggestionsWithTwoNodesInstancied === ");
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
          uri   : objectsTarget[node2.uri][rel],
          source: node1,
          target: node2,
          label: userAbstraction.removePrefix(objectsTarget[node2.uri][rel]),
          linkindex: node1.nlink[node2.id],
        };
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
          uri   : subjectsTarget[node2.uri][rel2],
          source: node2,
          target: node1,
          label: userAbstraction.removePrefix(subjectsTarget[node2.uri][rel2]),
          linkindex: node1.nlink[node2.id],
        };
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
    } ;


  AskomicsForceLayoutManager.prototype.update = function () {
    var agv = this ;
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
          .style("stroke-dasharray","2")
          .style("opacity", "0.3") /* default */
          .on('mousedown', function(d) { // Mouse down on a link
              /* user want a new relation contraint betwwenn two node*/
              console.log("Link mouse down");
              if ( d.suggested ) {
                ll = [d];
                graphBuilder.instanciateLink(ll);
                agv.updateInstanciateLinks(ll);
                if ( d.source.suggested || d.target.suggested  ) {
                  var node = d.source.suggested?d.source:d.target;
                  graphBuilder.instanciateNode(node);
                  agv.updateInstanciatedNode(node);
                  nodeView.create(node);
                  attributesView.create(node);
                  /* remove old suggestion */
                  agv.removeSuggestions();
                  /* insert new suggestion */
                  agv.insertSuggestions(node);
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
          })
          .on('mouseup', function(d) {
              // Mouse up on a link
          })
          .on('mouseover', function(d) {
              // Mouse over on a link

              //d3.select(this).style("stroke-width", 1.5);
          })
          .on('mouseout', function(d) {
              // Mouse out on a link
              //d3.select(this).style("stroke-width", 1);
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
              .attr("r", 12)
              .attr("id", function (d) { return "node_" + d.id; })
              .attr("uri", function (d) { return d.uri; })
              .attr("class", "nodeStrokeClass")
              .style("fill", function (d) { return agv.getColorInstanciatedNode(d); })
              .style("opacity", function(d) {
                  return (d.suggested === true ? 0.6 : 1);
              })
              .on('mousedown', function(d) {
                  // Mouse down on a link
                  document.body.style.cursor = 'crosshair';
                  // Colorize the selected node
                  agv.manageSelectedNodes(d);
              })
              .on('mouseup', function(d) {
                console.log("mouse up NODE");
                  // Mouse up on a link
                  document.body.style.cursor = 'default';
                  // nothing todo for intance
                  if (! graphBuilder.isInstanciatedNode(d)) {
                    // When selected a node is not considered suggested anymore.
                    graphBuilder.instanciateNode(d);
                    agv.updateInstanciatedNode(d);
                    var ll = linksView.selectListLinksUser(links,d);
                    graphBuilder.instanciateLink(ll);
                    agv.updateInstanciateLinks(ll);
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
                  agv.removeSuggestions();
                  /* insert new suggestion */
                  agv.insertSuggestions(d);
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
            /* Manage a line if weigth = 1 */
            if ( nlinks <= 1 ) {
              return "M" + d.source.x + "," + d.source.y + "L" +d.target.x + "," + d.target.y  ;
            } else {
              /* sinon calcul d une courbure */
              var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);

              // if there are multiple links between these two nodes, we need generate different dr for each path
              dr = dr/(1 + (1/nlinks) * (d.linkindex - 1));

              // generate svg path
              return "M" + d.source.x + "," + d.source.y +
                     "A" + dr + "," + dr + " 0 0 1," + d.target.x + "," + d.target.y +
                     "A" + dr + "," + dr + " 0 0 0," + d.source.x + "," + d.source.y;
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
          .size([w, h])
          .start();
  };
};
