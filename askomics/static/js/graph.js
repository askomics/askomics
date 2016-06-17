/*jshint esversion: 6 */

var expanded = [];

function myGraph() {
    // d3.js graph

    // set up the D3 visualisation in the specified element
    var w = $("#svgdiv").width(),
    h = 350;

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

    // Add and remove elements on the graph object
    this.addNode = function (node) {
        nodes.push(node);
        update();
    };

    this.removeNode = function (id) {
        if (!findNode(id)) return;
        removeNodeR(id,0, true);

        var p = findParentId(id);
        if (p === null)
            window.location.reload();

        $("#node_" + id).css("opacity", 0.6).hide();
        $("#txt_" + id).hide();
        $("#" + p + "-" + id).css("stroke-dasharray", "5,3").css("opacity", "0.3").hide();


        $("#nodeName").text("");
        $("#showNode").hide();
        $("#deleteNode").hide();
        update();
    };

    var removeNodeR = function (id, count, first) {
        var n = findNode(id);
        if (n === null) return;

        var i = count;
        while (i < links.length) {
            if (links[i].parent_id == n.id) {
                removeNodeR(links[i].child_id, i + 1, false);
                links.splice(i, 1);
            } else i++;
        }

        if (!first) nodes.splice(findNodeIndex(id), 1);

        var index = expanded.indexOf(id);
        if (index > -1) {
            delFromQuery(id);
            expanded.splice(index, 1);


            var tabAttr = $("#" + id + " :input");
            if (tabAttr) {
                $.each(tabAttr, function(i, input) {

                    delFromQuery($(input).attr("id"));
                });
                $("#" + id).remove();
            }
        }
    };

    var findNode = function (id) {
        for (var i in nodes) {
            if (nodes[i].id === id) return nodes[i];
        }
        return null;
    };

    var findNodeIndex = function (id) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id == id) {
                return i;
            }
        }
        return null;
    };

    var findParentId = function (id) {
        for (var l of links) {
            if (l.child_id == id) return l.parent_id;
        }
        return null;
    };

    var deselection = function(id, elt) {
        $("#nodeName").text("");
        $("#" + id).hide();

        if ($(elt).is("circle")) {
            hideSuggestions(id);
            d3.select(elt).style("fill", "royalblue");
        } else if ($(elt).is("line")) {
            d3.select(elt).style("stroke", "#2E2E2E");
        }

        $("#showNode").hide();
        $("#deleteNode").hide();
    };

    var update = function () {

        var link = vis.selectAll(".link")
                    .data(links, function (d) {
                        return d.source.id + "-" + d.target.id + "-" + d.linkindex ;
                    });

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
            .style("stroke-dasharray","1,5")
            .style("opacity", "0.3") /* default */
            .on('mousedown', function(d) {
                // Mouse down on a link
                var uri = d.uri;
                if (uri === "") return;
                if (d.relation_label) return;
                if (this.style[0] === "stroke-dasharray") return;

                d.relation_label = $(this).attr("id");
                d.id = uri.slice( uri.indexOf("#") + 1, uri.length);
                d.id += $("#svgdiv").data().last_counter;

                var service = new RestServiceJs("link");
                var model = {
                    'uri': uri,
                    'last_new_counter':$("#svgdiv").data().last_new_counter
                  };

                service.post(model, function(attr) {
                    if (slt_data)
                        $("#" + slt_data.id).hide();

                    d.specified_by.relation = attr.relation;
                    //detailsOf(uri, d.relation_label, attr.attributes, d.id, d);
                });
            })
            .on('mouseup', function(d) {
                // Mouse up on a link
                if (d.uri === "") return;
                if (this.style[0] === "stroke-dasharray") return;
                if (this === slt_elt) {
                    deselection(d.id,this);
                    swapSelection(null, null);
                    return;
                }

                swapSelection(this,d);

                // Deselect previous element
                if (prev_data) {
                    deselection(prev_data.id,prev_elt);
                }

                d3.select(slt_elt).style("stroke", "mediumvioletred");
                /*
                if ($("#" + slt_data.id).length) {
                    $("#nodeName").append(graphView.formatLabelEntity(d.relation_label));
                    $("#" + slt_data.id).show();
                }*/
            })
            .on('mouseover', function(d) {
                // Mouse over on a link
                if (d.uri === "") return;
                if (this.style[0] == "stroke-dasharray") return;

                d3.select(this).style("stroke-width", 4);
            })
            .on('mouseout', function(d) {
                // Mouse out on a link
                if (d.uri === "") return;
                d3.select(this).style("stroke-width", 2);
            });

        /* append for each link a label to print relation property name */
        $('path').each(function (index, value) {
          // No label to print
          if ($(this).attr('label') === undefined )
            return ;

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
                .style("fill", function (d) { return graphView.getColorInstanciateNode(d); })
                .style("opacity", function(d) {
                    return (d.suggested === true ? 0.6 : 1);
                })
                .on('mousedown', function(d) {
                    // Mouse down on a link
                    document.body.style.cursor = 'crosshair';
                    // Colorize the selected node
                    graphView.manageSelectedNodes(d);

                    // Change eye if the selected node will be displayed
                    if (isDisplayed(d.id)) {
                        $("#showNode").removeClass('glyphicon-eye-close');
                        $("#showNode").addClass('glyphicon-eye-open');
                    } else {
                        $("#showNode").removeClass('glyphicon-eye-open');
                        $("#showNode").addClass('glyphicon-eye-close');
                    }
                })
                .on('mouseup', function(d) {
                    // Mouse up on a link
                    document.body.style.cursor = 'default';
                    // nothing todo for intance
                    if (! graphBuilder.isInstanciateNode(d)) {
                      // When selected a node is not considered suggested anymore.
                      graphBuilder.instanciateNode(d);
                      graphView.updateInstanciateNode(d);
                      attributesView.createView(d);
                      linksView.selectListLinksUser(links,d);
                      /* fix the first link associted with the new instanciate node TODO: propose an interface to select the link */
                      for (var l of links) {
                          if ( l.suggested ) {
                            if (l.source.id == d.id || l.target.id == d.id ) {
                              graphBuilder.instanciateLink(l);
                              graphView.solidifyLink(l);
                              break ; //only the link finded....
                            }
                          }
                      }
                    }
                    /* update right view with attribute view */
                    attributesView.hideAllView();
                    attributesView.showView(d);
                    nodeView.set(d);
                    /* remove old suggestion */
                    graphView.removeSuggestions(nodes, links);
                    /* insert new suggestion */
                    graphView.insertSuggestions(d, nodes, links);
                    /* update graph */
                    update();
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

/*
            link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });
*/
                /*
            link.append("svg:title")
               .text(function(d, i) {
                  return d.label;
               });*/
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

    update();
}
