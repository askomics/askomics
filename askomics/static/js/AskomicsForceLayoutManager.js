/*jshint esversion: 6 */

class AskomicsForceLayoutManager {

  constructor() {
    this.w = $("#svgdiv").width();
    this.h = 350 ;
    this.charge   = -700 ;
    this.distance = 175 ;
    this.friction = 0.7 ;


    let currentFL = this;
    $('#full-screen-graph').click(function() {
      if ($('#icon-resize-graph').attr('value') == 'small') {
        currentFL.fullsizeGraph();
        return;
      }

      if ($('#icon-resize-graph').attr('value') == 'full') {
        currentFL.normalsizeGraph();
        return;
      }
    });

    $('#full-screen-attr').click(function() {
      if ($('#icon-resize-attr').attr('value') == 'small') {
        currentFL.fullsizeRightview();
        return;
      }

      if ($('#icon-resize-attr').attr('value') == 'full') {
        currentFL.normalsizeRightview();
        return;
      }
    });

    /* filter to hide and show proposition node and links */
    this._hideProposedUriNode    = [] ;
    this._hideProposedUriLink    = [] ;

    this.vis = d3.select("#svgdiv")
                .append("svg:svg")
                .attr("width", this.w)
                .attr("height", this.h)
                .attr("id", "svg")
                .attr("pointer-events", "all")
                .attr("viewBox", "0 0 " + this.w + " " + this.h)
                .attr("perserveAspectRatio", "xMinYMid")
                .append('svg:g');
              //  .call(d3.behavior.zoom().on("zoom", console.log("redraw")));
  /*
                .on("mouseover", function() { focus.style("display", null); })
                .on("mouseout", function() { focus.style("display", "none"); })
                .on("mousemove", mousemove);
  */
    this.force = d3.layout.force();

    this.nodes = this.force.nodes();
    this.links = this.force.links();

    this.ctrlPressed = false ;
    this.selectNodes = []    ;
    this.selectLink  = ''    ;

    /* Definition of an event when CTRL key is actif to select several node */
    $(document).keydown(function (e) {
      if (e.keyCode == 17) {
            currentFL.ctrlPressed = true ;
        }
    });

    $(document).keyup(function (e) {
        currentFL.ctrlPressed = false ;
    });

  }

  getArrayForProposedUri(type) {
    if ( type == "node" ) {
      return this._hideProposedUriNode;
    }
    if ( type == "link" ) {
      return this._hideProposedUriLink;
    }
    throw "AskomicsForceLayoutManager::getArrayForProposedUri Devel error => type !=node and link :"+type+" uri:"+uri;
  }

  offProposedUri(type,uri) {

    let tab = this.getArrayForProposedUri(type);

    for (var uriI of tab) {
      if (uriI == uri) return;
    }
    tab.push(uri);
  }

  onProposedUri(type,uri) {
    let tab = this.getArrayForProposedUri(type);

    for (var i in tab) {
      if (tab[i] == uri ) {
        tab.splice(i,1);
        return;
      }
    }
  }

  isProposedUri(type,uri) {
    let tab = this.getArrayForProposedUri(type);

    for (var i in tab) {
      if (tab[i] == uri ) {
        return false;
      }
    }
    return true;
  }

  fullsizeGraph() {
    $('#viewDetails').hide();
    $('#results').hide();
    $('#graph').attr('class', 'col-md-12');
    $("#svg").attr('height', 700);
    $("#svg").attr('width', $("#svgdiv").width());

    //change icon
    $('#icon-resize-graph').attr('class', 'glyphicon glyphicon-resize-small');
    $('#icon-resize-graph').attr('value', 'full');
  }

  normalsizeGraph() {
    $('#viewDetails').show();
    $('#results').show();
    $('#graph').attr('class', 'col-md-6');
    $("#svg").attr('height', 350);
    $("#svg").attr('width', $("#svgdiv").width());

    //change icon
    $('#icon-resize-graph').attr('class', 'glyphicon glyphicon-resize-full');
    $('#icon-resize-graph').attr('value', 'small');
  }

  fullsizeRightview() {
    $('#graph').hide();
    $('#results').hide();
    $('#viewDetails').attr('class', 'col-md-12');
    $('.div-details').attr('class', 'div-details-max');

    //change icon
    $('#icon-resize-attr').attr('class', 'glyphicon glyphicon-resize-small');
    $('#icon-resize-attr').attr('value', 'full');
  }

  normalsizeRightview() {
    $('#graph').show();
    $('#results').show();
    $('#viewDetails').attr('class', 'col-md-6');
    $('.div-details-max').attr('class', 'div-details');

    //change icon
    $('#icon-resize-attr').attr('class', 'glyphicon glyphicon-resize-full');
    $('#icon-resize-attr').attr('value', 'small');
  }

  bunbindFullscreenButtons() {
    $('#full-screen-graph').unbind();
    $('#full-screen-attr').unbind();
  }


  colorSelectdObject(prefix,id) {
    $(prefix+id).css("stroke", "firebrick");
  }

  start() {
    /* Get information about start point to bgin query */
    let startPoint = $('#startpoints').find(":selected").data("value");

    //startPoint = userAbstraction.buildBaseNode(startPoint.uri);
    /* load abstraction */
    userAbstraction.loadUserAbstraction();
    /* initialize menus */
    menuView.start();
    menuFile.start();

    startPoint = userAbstraction.buildBaseNode(startPoint.uri);
    /* Setting up an ID for the first variate */
    startPoint = graphBuilder.setStartpoint(startPoint);

    /* first node */
    this.nodes.push(startPoint);
    this.manageSelectedNodes(startPoint);


    startPoint.getPanelView().create();
    /* update right view with attribute view */
    startPoint.getPanelView().show();
    /* insert new suggestion with startpoints */
    this.insertSuggestions();
    /* build graph */
    this.update();
    this.colorSelectdObject("#node_",startPoint.id);

  }

  startWithQuery(dump) {
    d3.select("g").selectAll("*").remove();
    userAbstraction.loadUserAbstraction();
    /* initialize menus */
    menuView.start();
    menuFile.start();

    this.nodes.splice(0, this.nodes.length);
    this.links.splice(0, this.links.length);
    let t = graphBuilder.setNodesAndLinksFromState(dump);
    let lnodes = t[0];
    let llinks = t[1];

    if ( lnodes.length <=0 ) return ; /* nothing to do */

    for (var n of lnodes) {
      this.nodes.push(n);
      n.getPanelView().create();
    }
    AskomicsObjectView.hideAll();

    for (var l of llinks) {
      this.links.push(l);
      l.getPanelView().create(l);
    }

    AskomicsObjectView.hideAll();

    /* select the last node */
    var lastn = graphBuilder.nodes()[graphBuilder.nodes().length-1];
    this.unSelectNodes();
    this.manageSelectedNodes(lastn);
    /* update right view with attribute view */
    lastn.getPanelView().show();
    /* insert new suggestion with startpoints */
    this.insertSuggestions();
    this.update();
    this.colorSelectdObject("#node_",lastn.id);
  }

  updateInstanciateLinks(links) {
      for (var l of links) {
        let id = l.id;
        $("#" + id).css("stroke-dasharray","");
        $("#" + id).css("opacity","1");
        $('#label-'+id).css('opacity', "1");
      }
    }

    /* Update the label of cercle when a node is instanciated */
    updateInstanciatedNode(node) {

      if ( ! node  )
        throw new Error("AskomicsForceLayoutManager::updateInstanciateNode : node is not defined !");

      // change label node with the SPARQL Variate Id
      $('#txt_'+node.id).html(node.label+node.getLabelIndexHtml());
      // canceled transparency
      $("#node_"+node.id).css("opacity", "1");
      $('#txt_'+node.id).css("opacity","1");
    }

    /* Update the label of cercle when a node is instanciated */
    manageSelectedNodes(node) {

      if (! this.ctrlPressed) {
        $("[id*='node_']").each(function (index, value) {
          $(this).css("stroke", "grey");
        });

        /* if several node were selected or a diffente node were selected so select only the current node */
        if ( this.selectNodes.length > 1 || (this.selectNodes.length===0) || (this.selectNodes[0].id != node.id) ) {
          this.selectNodes = [] ;
          this.selectNodes.push(node);
          this.colorSelectdObject("#node_",node.id);
        } else { /* deselection of node */
          this.selectNodes = [] ;
          console.log('---> deselection');
          $("#node_"+node.id).css("stroke", "grey");
        }

      } else {
        // deselection case
        for ( let n in this.selectNodes ){
          if (this.selectNodes[n].id == node.id) {
            // remove the current node from the selected node list !
             this.selectNodes.splice(n,1);
             $("#node_"+node.id).css("stroke", "grey");
             return;
          }
        }
        this.selectNodes.push(node);
        this.colorSelectdObject("#node_",node.id);
      }

      if (this.selectNodes.length === 0) {
        //no node selected: hide rightview
        AskomicsObjectView.hideAll();
        //linksView.hideAll();
      }
    }

    /* unselect all nodes */
    unSelectNodes() {
      this.selectNodes = [];
      $("[id*='node_']").each(function (index, value) {
        $(this).css("stroke", "grey");
      });
    }

    setSelectLink(link) {
      $("#"+link.id).css("stroke", "firebrick");
      $('#end-marker-'+link.id).css("stroke", "firebrick");
      $('#end-marker-'+link.id).css("fill", "firebrick");
      $('#start-marker-'+link.id).css("stroke", "firebrick");
      $('#start-marker-'+link.id).css("fill", "firebrick");
      this.selectLink = link;
    }

    unSelectLink() {
      $(".link").each(function (index) {
        $(this).css("stroke", "grey");
        this.selectLink = '';
      });
      $(".arrow").each(function (index) {
        $(this).css("stroke", "grey");
        $(this).css("fill", "grey");
        this.selectLink = '';
      });
    }

    nodeIsSelected(node) {
      if (this.selectNodes.length > 1) {
        for (var i of this.selectNodes) {
          if ( node.id == i.id ) return true;
        }
      }
      return false;
    }

    insertSuggestions() {
      if (this.selectNodes.length === 0 ) {
        return ;
      } else if (this.selectNodes.length === 1 ) {
        this.insertSuggestionsWithNewNode(this.selectNodes[0]);
      } else if (this.selectNodes.length === 2) {
        this.insertSuggestionsWithTwoNodesInstancied(this.selectNodes[0],this.selectNodes[1]);
      }
    }

    insertSuggestionsWithNewNode(slt_node) {
        /* get All suggested node and relation associated to get orientation of arc */
        let tab = userAbstraction.getRelationsObjectsAndSubjectsWithURI(slt_node.uri);
        let objectsTarget = tab[0];  /* All triplets which slt_node URI are the subject */
        let subjectsTarget = tab[1]; /* All triplets which slt_node URI are the object */

        var suggestedList = {} ;
        let link;

        for (var uri in objectsTarget ) {
          /* Filter if node are not desired by the user */
          if (! this.isProposedUri("node",uri)) continue ;
          /* creatin node */
          let suggestedNode = userAbstraction.buildBaseNode(uri);
          /* specific attribute for suggested node */
          suggestedNode = graphBuilder.setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);

          for (var rel in objectsTarget[uri]) {
            /* Filter if link are not desired by the user */
            if (! this.isProposedUri("link",objectsTarget[uri][rel])) continue ;

            /* adding in the node list to create D3.js graph */
            if ( ! (suggestedNode.id in slt_node.nlink) ) {
              /* We create a unique instance and add all possible relation between selected node and this suggested node */
              suggestedList[uri] = suggestedNode ;
              this.nodes.push(suggestedNode);
            }
            /* increment the number of link between the two nodes */
            let linkbase     = {} ;
            linkbase.uri     = objectsTarget[uri][rel] ;
            let source   = slt_node ;
            let target   = suggestedList[uri];

            //link = new AskomicsLink(linkbase,source,target);
            link = AskomicsObjectBuilder.instanceLink(linkbase,source,target);
            link.id = graphBuilder.getId();
            this.links.push(link);
          }
        }

        for (uri in subjectsTarget ) {
          /* Filter if node are not desired by the user */
          if (! this.isProposedUri("node",uri)) continue ;
          let suggestedNode;
          if ( ! (uri in suggestedList) ) {
            suggestedNode = userAbstraction.buildBaseNode(uri);
            suggestedNode = graphBuilder.setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);
          } else {
            suggestedNode = suggestedList[uri];
          }

          for (var rel2 in subjectsTarget[uri]) {
            /* Filter if link are not desired by the user */
            if (! this.isProposedUri("link",subjectsTarget[uri][rel2])) continue ;

            /* adding in the node list to create D3.js graph */
            if ( ! (suggestedNode.id in slt_node.nlink) ) {
              suggestedList[uri] = suggestedNode ;
              this.nodes.push(suggestedNode);
            }

            let linkbase     = {} ;
            linkbase.uri     = subjectsTarget[uri][rel2] ;
            let source   = suggestedList[uri] ;
            let target   = slt_node;
            //link = new AskomicsLink(linkbase,source,target);
            link = AskomicsObjectBuilder.instanceLink(linkbase,source,target);
            link.id = graphBuilder.getId();
            this.links.push(link);
          }
        }
        // add neighbours of a node to the graph as propositions.

        // Manage positionnable entities
        let positionableEntities = userAbstraction.getPositionableEntities();

        for (uri in positionableEntities) {
          // if selected node is not a positionable node, donc create a positionable
          // link with an other positionable node
          if (! (slt_node.uri in positionableEntities)) continue;
          /* Filter if node are not desired by the user */
          if (! this.isProposedUri("node",uri)) continue ;
          /* Filter if link are not desired by the user */
          if (! this.isProposedUri("link","positionable")) continue ;

          /* uncomment if we don't want a positionable relation between the same node  */
          //if ( uri == slt_node.uri ) continue ;
          let suggestedNode;
          if ( ! (uri in suggestedList) ) {
            /* creatin node */
            suggestedNode = userAbstraction.buildBaseNode(uri);
            /* specific attribute for suggested node */
            suggestedNode = graphBuilder.setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);
            /* adding in the node list to create D3.js graph */
            this.nodes.push(suggestedNode);
            suggestedList[uri] = suggestedNode ;

          }

          let linkbase     = {} ;
          linkbase.uri     = 'positionable' ;
          let source   = suggestedList[uri] ;
          let target   = slt_node;
          link = new AskomicsPositionableLink(linkbase,source,target);
          link.id = graphBuilder.getId();
          this.links.push(link);
        }

    }

    relationInstancied(subj, obj,relation,links) {
      for ( var rel of links ) {
        if ( rel.source == subj && rel.target == obj && rel.uri == relation ) return true;
      }
      return false;
    }

    insertSuggestionsWithTwoNodesInstancied(node1, node2) {

      /* get All suggested node and relation associated to get orientation of arc */
      let tab = userAbstraction.getRelationsObjectsAndSubjectsWithURI(node1.uri);
      let objectsTarget = tab[0];  /* All triplets which slt_node URI are the subject */
      let subjectsTarget = tab[1]; /* All triplets which slt_node URI are the object */

      for (var rel in objectsTarget[node2.uri]) {
        /* Filter if link are not desired by the user */
        if (! this.isProposedUri("link",objectsTarget[node2.uri][rel])) continue ;

        if ( this.relationInstancied(node1,node2,objectsTarget[node2.uri][rel],this.links) ) continue ;

        let linkbase     = {} ;
        linkbase.uri     = objectsTarget[node2.uri][rel];
        let source   = node1;
        let target   = node2;
        //let link = new AskomicsLink(linkbase,source,target);
        let link = AskomicsObjectBuilder.instanceLink(linkbase,source,target);
        link.id = graphBuilder.getId();
        this.links.push(link);
      }

      for (let rel in subjectsTarget[node2.uri]) {
        /* Filter if link are not desired by the user */
        if (! this.isProposedUri("link",subjectsTarget[node2.uri][rel])) continue ;

        if ( this.relationInstancied(node2,node1,subjectsTarget[node2.uri][rel],this.links) ) continue ;

        let linkbase     = {} ;
        linkbase.uri     = subjectsTarget[node2.uri][rel];
        let source   = node2;
        let target   = node1;
        //let link = new AskomicsLink(linkbase,source,target);
        let link = AskomicsObjectBuilder.instanceLink(linkbase,source,target);
        link.id = graphBuilder.getId();
        this.links.push(link);
      }
      // Manage positionnable entities
      let positionableEntities = userAbstraction.getPositionableEntities();

      if ( this.isProposedUri("link","positionable") &&
           (node1.uri in positionableEntities) && (node2.uri in positionableEntities)) {

        let linkbase     = {} ;
        linkbase.uri     = 'positionable' ;
        let source   = node2 ;
        let target   = node1;
        let link = new AskomicsPositionableLink(linkbase,source,target);
        link.id = graphBuilder.getId();
        this.links.push(link);
      }
    }

    /* Remove all nodes and links suggestion */
    removeSuggestions() {

      let removeL = [];
      for (var idx in this.links) {
        let l = this.links[idx];
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
        this.links.splice(removeL[j],1);
      }
      var removeN = [];
      // remove suggested node
      for (var node in this.nodes) {
        if ( this.nodes[node].suggested ) {
          removeN.push(node);
        }
      }
      for (var n2=removeN.length-1;n2>=0;n2--){
        let idxn = removeN[n2];
        this.nodes.splice(idxn,1);
      }
    }              /* user want a new relation contraint betwwenn two node*/

    // take a string and return an entity with a sub index
    selectListLinksUser(links,node) {
      /* fix the first link associted with the new instanciate node TODO: propose an interface to select the link */
      for (let il in links) {
        let l = links[il];
        if ( l.suggested && (l.source.id == node.id || l.target.id == node.id) ) {
          return [links[il]];
        }
      }
    }

  update () {
    console.log('---> update graph!');

    var link = this.vis.selectAll(".link")
                  .data(this.links, function (d) {
                      return d.id ;
                  });

    var arrow = this.vis.selectAll(".arrow")
                   .data(this.links, function (d) {
                      return d.id ;
                   });
    let currentFL = this;
    // Link labels
    link.enter().append("text")
                .attr("style", "text-anchor:middle; font: 10px sans-serif; cursor: pointer;")
                .attr("dy", "-5")
                .attr('id', function(d) {return 'label-'+d.id;})
                .style("opacity", function(d) {return d.getTextOpacity();})
                .append("textPath")
                .attr("xlink:href",function(d) {return "#"+d.id;})
                .attr("startOffset", "35%")
                .attr('fill', function(d){ return d.getTextFillColor();})
                .text(function(d){return d.label;})
                .on('click', function(d) { // Mouse down on a link label

                  if (d != currentFL.selectLink) { //if link is not selected
                    /* user want a new relation contraint betwwenn two node*/

                    //deselect all nodes and links
                    currentFL.unSelectNodes();
                    currentFL.unSelectLink();

                    //select link
                    currentFL.setSelectLink(d);

                    if ( d.suggested ) {
                      let ll = [d];
                      graphBuilder.instanciateLink(ll);
                      currentFL.updateInstanciateLinks(ll);
                      if ( d.source.suggested || d.target.suggested  ) {
                        var node = d.source.suggested?d.source:d.target;
                        graphBuilder.instanciateNode(node);
                        currentFL.updateInstanciatedNode(node);
                        node.getPanelView().create();
                        // remove old suggestion
                        currentFL.removeSuggestions();
                        if (currentFL.selectNodes.length <= 1) {
                          currentFL.unSelectNodes();
                        } else {
                          // insert new suggestion
                          currentFL.insertSuggestions();
                        }
                      }
                      //linksView.create(d);
                      d.getPanelView().create();
                    }else{
                      currentFL.removeSuggestions();
                    }
                    /* update link view */
                    d.getPanelView().show();

                    currentFL.update();
                  }else{
                    currentFL.unSelectNodes();
                    currentFL.unSelectLink();
                    currentFL.update();
                    AskomicsObjectView.hideAll();
                  }
              });

    /* nodes or links could be removed by other views */
    graphBuilder.synchronizeInstanciatedNodesAndLinks(this.nodes,this.links);

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
          .style("stroke-width", "2");
        //  .on("mouseover", function(d) { this.style[2]="4";}); /* "TypeError: 2 is read-only" occurs in browser */

      var node = this.vis.selectAll("g.node")
                  .data(this.nodes, function (d) { return d.id; });

      var nodeEnter = node.enter().append("g")
                          .attr("class", "node")
                          .call(this.force.drag);

      //setup_node(nodeEnter,slt_elt,slt_data,prev_elt,prev_data);
      nodeEnter.append("svg:circle")
              .attr("style", "cursor: pointer;")
              .attr("r", function (d)       { return d.getRNode(); })
              .attr("id", function (d)      { return "node_" + d.id; })
              .attr("uri", function (d)     { return d.uri; })
              .attr("class", "nodeStrokeClass")
              .style('stroke', function (d) { return d.getNodeStrokeColor(); })
              .style("fill", function (d)   { return d.getColorInstanciatedNode(); })
              .style("opacity", function(d) { return d.getOpacity();})
              .on('click', function(d) {
                currentFL.manageSelectedNodes(d);
                currentFL.unSelectLink();
              // Mouse up on a link
              //document.body.style.cursor = 'default';
                // nothing todo for intance
                if (! graphBuilder.isInstanciatedNode(d)) {
                  // When selected a node is not considered suggested anymore.
                  graphBuilder.instanciateNode(d);
                  currentFL.updateInstanciatedNode(d);
                  var listOfLinksInstancied = currentFL.selectListLinksUser(currentFL.links,d);
                  graphBuilder.instanciateLink(listOfLinksInstancied);
                  currentFL.updateInstanciateLinks(listOfLinksInstancied);
                  for (var ll of listOfLinksInstancied ) {
                    ll.getPanelView().create();
                  }
                  d.getPanelView().create();
                }
                // show attribute view only if node is not selected
                if (!$.inArray(d, currentFL.selectNodes)) {
                  d.getPanelView().show();
                }

                /* remove old suggestion */
                currentFL.removeSuggestions();
                /* insert new suggestion */
                currentFL.insertSuggestions();
                /* update graph */
                currentFL.update();
              });

      nodeEnter.append("svg:text")//.append("tspan")
              .attr("class", "textClass")
              .attr("x", 14)
              .attr('fill', function(d){return d.getTextFillColor();})
              .style('stroke', function(d){return d.getTextStrokeColor();})
              .style("opacity", function(d) { return d.getOpacity();})
              .attr("y", ".31em")
              .attr("id", function (d) {
                  return "txt_" + d.id;
              })
              .text(function (d) { return d.label; })
                  .append("tspan")
                   .attr("font-size","7")
                   .attr("baseline-shift","sub")
                   .text(function (d) {
                     return d.getLabelIndex();
                    });

      link.exit().remove();
      node.exit().remove();

      this.force.on("tick", function () {
          node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

          link.attr("d", function(d) {
            let nlinks = d.source.nlink[d.target.id]; // same as d.target.nlink[d.source.id]

            /* diminution of arc to improve display of links */
            let penteX = d.target.x-d.source.x;
            let penteY = d.target.y-d.source.y;
            /* arrondi a une decimale */
            penteX = Math.round(penteX*10)/10;
            penteY = Math.round(penteY*10)/10;

            let XT=0,YT=0,XS=0,YS=0;
            let dim = d.source.getRNode()/3.0;
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
            let Xsource = d.source.x + XS;
            let Ysource = d.source.y + YS;
            let Xtarget = d.target.x + XT;
            let Ytarget = d.target.y + YT;
            /* Manage a line if weigth = 1 */
            if ( nlinks <= 1 ) {
              return "M" + Xsource + "," + Ysource + "L" + Xtarget + "," + Ytarget  ;
            } else {
              /* sinon calcul d une courbure */
              let dx = Xtarget - Xsource,
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
      this.force.charge(this.charge)
          .linkDistance(this.distance)
          .friction(this.friction)
          //.alpha(1)
          .size([this.w, this.h])
          .start();
  }
}
