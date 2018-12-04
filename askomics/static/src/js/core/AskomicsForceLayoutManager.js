/*jshint esversion: 6 */

class AskomicsForceLayoutManager {

  constructor(svgdiv_id) {

    /* constantes */
    /* ---------- */

	  this.charge   = -700 ;
    this.distance = 175 ;
    this.friction = 0.7 ;
    this.w        = 650 ;
    this.h        = 600 ;

    this.svgdivid = svgdiv_id;
    this.svgdiv = $("#"+svgdiv_id) ;
  }

  reset() {
    this.svgdiv.off();
    this.svgdiv.empty();
  }

  init() {

    this._hideProposedUriNode    = [] ;
    this._hideProposedUriLink    = [] ;
    this._hideProposedUriShortcuts  = [] ;

    this.ctrlPressed = false ;
    this.selectNodes = []    ;
    this.selectLink  = ''    ;
    this.enterPressed = false;

    this.optionsView = {
      attributesFiltering  : true,
      relationsName        : true,
      objectproperty       : true,
      subclassof           : false
    };

    /*************************************************/
    /* Context Menu definition inside SVG Div        */
    /*************************************************/
    let currentFL = this;
    let faCheckEmptBox = 'fa-square-o';
    let faCheckBox = 'fa-check-square-o';

    let TitleFilterAtt = "Filtering attributes" ;
    let TitleFilterRelationName = "Relations name" ;

    let funcCheckBoxMenuContext = function(title,actionCheck,actionUncheck) {
      $(".context-menu-icon."+faCheckBox+",.context-menu-icon."+faCheckEmptBox).find("span").each(function( index ) {
          if ( $( this ).text() === title ) {
            if ($( this ).parent().hasClass(faCheckBox)) {
              actionUncheck();
              $( this ).parent().removeClass(faCheckBox);
              $( this ).parent().addClass(faCheckEmptBox);
            } else {
              actionCheck();
              $( this ).parent().removeClass(faCheckEmptBox);
              $( this ).parent().addClass(faCheckBox);
            }
          }
        });
    };
    $.contextMenu({
            selector: '#'+currentFL.svgdivid,
            items: {
              "rmenu-linkrelation"   : {
                name: 'ObjectProperty relation',
                icon  : currentFL.optionsView.objectproperty?faCheckBox:faCheckEmptBox,
                callback: function(key, options) {
                  funcCheckBoxMenuContext('ObjectProperty relation',
                    function() { currentFL.optionsView.objectproperty = true;},
                    function() { currentFL.optionsView.objectproperty = false ;});

                  $(".arrowobjectpropertyClass, .linkobjectpropertyClass, .textobjectpropertyClass, .nodeClass, .textClass")
                    .each(function (index, item) {
                      let dis = ((!item.__data__._suggested) || currentFL.optionsView.objectproperty)?'block':'none';
                      $(item).css("display",dis);
                    });

                  return false;
                }
              },
              "rmenu-isarelation"   : {
                name: 'is-a relation',
                icon  : faCheckEmptBox,
                callback: function(key, options) {
                  funcCheckBoxMenuContext('is-a relation',
                    function() { currentFL.optionsView.subclassof = true;},
                    function() { currentFL.optionsView.subclassof = false ;}
                  );

                  $(".arrowsubclassofClass, .linksubclassofClass, .textsubclassofClass, .nodeAliasClass, .textAliasClass")
                    .each(function (index, item) {
                      let dis = ((!item.__data__._suggested) || currentFL.optionsView.subclassof)?'block':'none';
                      $(item).css("display",dis);
                    }
                  );
                  return false;
                }
              },
              "sep0"   : "---------",
                "rmenu-save-query"   : {
                  name: $("#dwl-query").text(),
                  icon: "fa-download",
                  callback: function(key, options) {
                    $("#dwl-query")[0].click();
                  }
                },
                "rmenu-save-sparql-query" :
                {
                  name: $("#dwl-query-sparql").text(),
                  icon: "fa-floppy-o",
                  callback: function(key, options) {
                    $("#dwl-query-sparql")[0].click();
                  }
                },
                "sep1"   : "---------",
                "rmenu-filt-attributes" :
                {
                  name  : TitleFilterAtt,
                  icon  : faCheckBox,
                  callback: function(key, options) {
                    funcCheckBoxMenuContext(TitleFilterAtt,
                      function() { currentFL.optionsView.attributesFiltering = true;},
                      function() { currentFL.optionsView.attributesFiltering = false ;});
                      $("tspan[constraint_node_id]").css('display', currentFL.optionsView.attributesFiltering?'block':'none');
                      return false;
                  },
                },
                "rmenu-relation-name" :
                {
                  name  : TitleFilterRelationName,
                  icon  : faCheckBox,
                  callback: function(key, options) {
                    funcCheckBoxMenuContext(TitleFilterRelationName,
                      function() { currentFL.optionsView.relationsName = true;},
                      function() { currentFL.optionsView.relationsName = false ;});
                      $("[id^=" + GraphObject.getSvgLabelPrefix() + "] textPath").css('display', currentFL.optionsView.relationsName?'block':'none');
                      return false;
                   }
                },
                "sep2"   : "---------",
                "rmenu-reset"   : {
                  name: "Reset",
                  callback: function(){
                    __ihm.stopSession();
                  }
                }
              },
              events: {
                  show: function(opt) {
                    // this is the trigger element
                    var $this = this;
                    if (Object.keys($this.data()).length === 0 ) return ;

                    // import states from data store
                    $.contextMenu.setInputValues(opt, $this.data());
                    // this basically fills the input commands from an object
                    // like {name: "foo", yesno: true, radio: "3", &hellip;}
                  },
                  hide: function(opt) {
                    // this is the trigger element
                    var $this = this;
                    // export states to data store
                    $.contextMenu.getInputValues(opt, $this.data());
                    // this basically dumps the input commands' values to an object
                    // like {name: "foo", yesno: true, radio: "3", &hellip;}
                  }
            }
        });

        /* Definition of an event when CTRL key is actif to select several node */
        /* Definition of an event when a special key is pressed */
        $(document).keydown(function (e) {
          // if ctrl is pressed, select several node
          if (e.keyCode == 17) {
            currentFL.ctrlPressed = true ;
          }

          // If enter is pressed, launch the query
          if (e.keyCode == 13 && $('#queryBuilder').is(':visible') && !this.enterPressed) {
            __ihm.jobsview.createJob();
            currentFL.enterPressed = true;
          }
        });

        $(document).keyup(function (e) {
            currentFL.ctrlPressed = false;
        });
  }

  getArrayForProposedUri(type) {
    if ( type == "node" ) {
      return this._hideProposedUriNode;
    }
    if ( type == "link" ) {
      return this._hideProposedUriLink;
    }
    if ( type == "shortcuts" ) {
      return this._hideProposedUriShortcuts;
    }

    throw "AskomicsForceLayoutManager::getArrayForProposedUri Devel error => type !=node and link :"+type;
  }

  offProposedUri(type,uri) {
    let tab = this.getArrayForProposedUri(type);

    for (let i in tab) {
      if (tab[i] == uri) return;
    }
    tab.push(uri);
  }

  onProposedUri(type,uri) {
    let tab = this.getArrayForProposedUri(type);

    for (let i in tab) {
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

  selectObject(prefix,obj) {
    $(prefix+obj.id).css("stroke", "firebrick");
  }

  unSelectObject(prefix,obj) {
    $(prefix+obj.id).css("stroke", obj.getStrokeColor());
  }

  updateInstanciedNode() {
    d3.selectAll('g.node')
    .each(function(d) {
      //d3.select(this) // Transform to d3 Object
      if (! d.suggested )
        d.getPanelView().define_context_menu();
    });
  }

  initSvg() {
    console.log("========== start session ForceLayoutManager ==============");
    console.log("D3.JS version:"+d3.version);

    let currentFL = this;

    d3.select("#"+this.svgdivid).select("svg").remove();

    this.vis = d3.select("#"+this.svgdivid)
                .append("svg:svg")
                /*.attr("pointer-events", "all")*/
                .attr("width","100%")
                .attr("height","100%")
                /* viewport : this.w,this.h :partie visible => viewBox : this.w*3,this.h*3 image size */
                .attr("viewBox", "0 0 " + this.w + " " + this.h )
                .attr("width",this.w)
                .attr("height",this.h)
                .attr("perserveAspectRatio", "xMinYMid meet")
                .call(d3.behavior.zoom().on("zoom", function() {
                  let velocity = 1/10;
                  let scale =  Math.pow(d3.event.scale,velocity);

                  let translateY = (currentFL.h - (currentFL.h * scale))/2;
                  let translateX = (currentFL.w - (currentFL.w * scale))/2;

                  currentFL.vis.attr("transform","translate(" + [translateX,translateY] + ")" + " scale(" +scale+ ")");

                  //  currentFL.vis.attr("transform","translate(" + d3.event.translate + ")" + " scale(" +scale+ ")");
                }))
                .append('svg:g');

    this.force = d3.layout.force();

    this.nodes = this.force.nodes();
    this.links = this.force.links();
  }


  start(startPoint) {

    console.assert(startPoint.uri != undefined , "Bad definition of startpoint : "+JSON.stringify(startPoint));

    this.initSvg();
    /* load abstraction */
    startPoint = __ihm.getAbstraction().buildBaseNode(startPoint.uri);
    /* Setting up an ID for the first variate */
    startPoint = __ihm.getGraphBuilder().setStartpoint(startPoint);

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
    this.selectObject("#node_",startPoint.id);
  }

  startWithQuery(dump) {
    this.initSvg();

    this.nodes.splice(0, this.nodes.length);
    this.links.splice(0, this.links.length);
    let t = __ihm.getGraphBuilder().setNodesAndLinksFromState(dump);
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
    var lastn = __ihm.getGraphBuilder().nodes()[__ihm.getGraphBuilder().nodes().length-1];
    this.unSelectNodes();
    this.manageSelectedNodes(lastn);
    /* update right view with attribute view */
    lastn.getPanelView().show();
    /* insert new suggestion with startpoints */
    this.insertSuggestions();

    this.update();
    this.selectObject("#node_",lastn.id);
  }

  updateInstanciateLinks(links) {
      for (var l in links) {
        let id = links[l].id;
        $("#" + id).css("stroke-dasharray","");
        $("#" + id).css("opacity","1");
        $('#'+GraphObject.getSvgLabelPrefix()+id).css('opacity', "1");
      }
    //  $("[id^=" + GraphObject.getSvgLabelPrefix() + "] textPath").css('display', this.optionsView.relationsName?'block':'none');
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
      $("tspan[constraint_node_id]").css('display', this.optionsView.attributesFiltering?'block':'none');
    }

    /* Update the label of cercle when a node is instanciated */
    manageSelectedNodes(node) {
      if (! this.ctrlPressed) {
        $("[id*='node_']").each(function (index, value) {
          let id = $(this).attr("id").replace("node_","");
          let lnodes = __ihm.getGraphBuilder().nodes();
          for (let inode in lnodes ) {
            if (lnodes[inode].id == id ) {
              $(this).css("stroke", lnodes[inode].getStrokeColor());
              break;
            }
          }

        });

        /* if several node were selected or a diffente node were selected so select only the current node */
        if ( this.selectNodes.length > 1 || (this.selectNodes.length===0) || (this.selectNodes[0].id != node.id) ) {
          this.selectNodes = [] ;
          this.selectNodes.push(node);
          this.selectObject("#node_",node);
        } else { /* deselection of node */
          this.selectNodes = [] ;
          this.unSelectObject("#node_",node);
        }

      } else {
        // deselection case
        for ( let n in this.selectNodes ){
          if (this.selectNodes[n].id == node.id) {
            // remove the current node from the selected node list !
            this.selectNodes.splice(n,1);
             //$("#node_"+node.id).css("stroke", "grey");
            this.unSelectObject("#node_",node);
             return;
          }
        }
        this.selectNodes.push(node);
        this.selectObject("#node_",node);
      }

      if (this.selectNodes.length === 0) {
        //no node selected: hide rightview
        AskomicsObjectView.hideAll();
        //linksView.hideAll();
      }
    }

    isSelected(node) {
      for ( let n in this.selectNodes ) {
        if ( this.selectNodes[n].id == node.id ) return true;
      }
      return false;
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
      this.selectLink = '';
      $(".textobjectpropertyClass,.textsubclassofClass").each(function (index) {
        $(this).css("stroke", "grey");
        this.selectLink = '';
      });
      $(".linkobjectpropertyClass,.linksubclassofClass").each(function (index) {
        $(this).css("stroke", "grey");
        this.selectLink = '';
      });
      //alert("todo unSelectLink");
      $(".arrowobjectpropertyClass,.arrowsubclassofClass").each(function (index) {
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

      let suggestedList = {} ;

      if (this.selectNodes.length === 0 ) {
        return ;
      } else if (this.selectNodes.length === 1 ) {
        this.insertSuggestionsWithNewNode(suggestedList,this.selectNodes[0]);
      } else if (this.selectNodes.length === 2) {
        this.insertSuggestionsWithTwoNodesInstancied(this.selectNodes[0],this.selectNodes[1]);
      }
      //shortcuts
      this.insertSuggestionsShortcuts(suggestedList,this.selectNodes);

      //subclassof
      this.insertSuggestionsSubclassof(this.selectNodes);
    }

    insertSuggestionsWithNewNode(suggestedList,slt_node) {
        /* get All suggested node and relation associated to get orientation of arc */
        let tab = __ihm.getAbstraction().getRelationsObjectsAndSubjectsWithURI(slt_node.uri);
        let objectsTarget = tab[0];  /* All triplets which slt_node URI are the subject */
        let subjectsTarget = tab[1]; /* All triplets which slt_node URI are the object */
        //console.log("insertSuggestionsWithNewNode");
        //console.log(JSON.stringify(objectsTarget));
        let link;

        for (let uri in objectsTarget ) {
          /* Filter if node are not desired by the user */
          if (! this.isProposedUri("node",uri)) continue ;
          /* creating node */
          let suggestedNode = __ihm.getAbstraction().buildBaseNode(uri);
          /* specific attribute for suggested node */
          suggestedNode = __ihm.getGraphBuilder().setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);

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
            link.id = __ihm.getGraphBuilder().getId();
            //console.log("1URI SUG:"+JSON.stringify(link));

            this.links.push(link);
          }
        }

        for (let uri in subjectsTarget ) {
          /* Filter if node are not desired by the user */
          if (! this.isProposedUri("node",uri)) continue ;
          let suggestedNode;
          if ( ! (uri in suggestedList) ) {
            suggestedNode = __ihm.getAbstraction().buildBaseNode(uri);
            suggestedNode = __ihm.getGraphBuilder().setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);
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
            link.id = __ihm.getGraphBuilder().getId();
            //console.log("2 URI SUG:"+JSON.stringify(link));
            this.links.push(link);
          }
        }
        // add neighbours of a node to the graph as propositions.

        // Manage positionnable entities
        let positionableEntities = __ihm.getAbstraction().getPositionableEntities();

        for (let uri in positionableEntities) {
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
            suggestedNode = __ihm.getAbstraction().buildBaseNode(uri);
            /* specific attribute for suggested node */
            suggestedNode = __ihm.getGraphBuilder().setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);
            /* adding in the node list to create D3.js graph */
            this.nodes.push(suggestedNode);
            suggestedList[uri] = suggestedNode ;

          }

          let linkbase     = {} ;
          linkbase.uri     = 'positionable' ;
          let source   = suggestedList[uri] ;
          let target   = slt_node;
          link = new AskomicsPositionableLink(linkbase,source,target);
          link.id = __ihm.getGraphBuilder().getId();
          this.links.push(link);
        }

        return suggestedList;
    }

    relationInstancied(subj, obj,relation,links) {
      for ( var rel of links ) {
        if ( rel.source == subj && rel.target == obj && rel.uri == relation ) return true;
      }
      return false;
    }

    insertSuggestionsWithTwoNodesInstancied(node1, node2) {

      /* get All suggested node and relation associated to get orientation of arc */
      let tab = __ihm.getAbstraction().getRelationsObjectsAndSubjectsWithURI(node1.uri);
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
        link.id = __ihm.getGraphBuilder().getId();
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
        link.id = __ihm.getGraphBuilder().getId();
        this.links.push(link);
      }
      // Manage positionnable entities
      let positionableEntities = __ihm.getAbstraction().getPositionableEntities();

      if ( this.isProposedUri("link","positionable") &&
           (node1.uri in positionableEntities) && (node2.uri in positionableEntities)) {

        let linkbase     = {} ;
        linkbase.uri     = 'positionable' ;
        let source   = node2 ;
        let target   = node1;
        let link = new AskomicsPositionableLink(linkbase,source,target);
        link.id = __ihm.getGraphBuilder().getId();
        this.links.push(link);
      }
    }

    insertSuggestionsShortcuts(suggestedList,listSelectedNodes) {

      let lShortcuts = new ShortcutsParametersView().getShortcuts(listSelectedNodes);
      let x=0,y=0;
      if (listSelectedNodes.length>0) {
        x = listSelectedNodes[0].x;
        y = listSelectedNodes[0].y;
      }
      x+=0.5;y+=0.5;

      for (let shortcut in lShortcuts) {
        let suggestedNode;
        let uri = Object.keys(lShortcuts[shortcut].out)[0];

        if (! this.isProposedUri("shortcuts",shortcut)) continue ;

        if ( ! ( uri in suggestedList) ) {
          /* creatin node */
          suggestedNode = __ihm.getAbstraction().buildBaseNode(uri);
          /* specific attribute for suggested node */
          suggestedNode = __ihm.getGraphBuilder().setSuggestedNode(suggestedNode,x,y);
          /* adding in the node list to create D3.js graph */
          this.nodes.push(suggestedNode);
          suggestedList[uri] = suggestedNode ;
        }

        let linkbase     = {} ;

        linkbase.label   = lShortcuts[shortcut].label ;

        linkbase.uri     = shortcut;

        let source   ;
        if ( listSelectedNodes.length >1 ) {
          source = listSelectedNodes ;
        } else if ( listSelectedNodes.length === 1 ){
          source = listSelectedNodes[0];
        } else {
          console.error("DEVEL ERROR : can not implement a shortcut link without source !");
        }
        let target   = suggestedList[uri];

        let link = AskomicsObjectBuilder.instanceLink(linkbase,source,target);

        link.sparql  = lShortcuts[shortcut].sparql_string ;
        link.prefix  = lShortcuts[shortcut].prefix_string ;
        link.shortcut_output_var  = lShortcuts[shortcut].output_var ;

        link.id = __ihm.getGraphBuilder().getId();
        this.links.push(link);
      }
    }

    insertSuggestionsSubclassof(listSelectedNodes) {

      let suggestedList = {};

      for (let entity in listSelectedNodes) {
        let source = listSelectedNodes[entity] ;
        let urisublist = __ihm.getAbstraction().getSubclassof(source.uri);
        for (let urisubidx in urisublist ) {
          let urisub = urisublist[urisubidx];
          let suggestedNode ;
          if ( !( urisub in suggestedList) ) {
            /* creating node */
            suggestedNode = __ihm.getAbstraction().buildBaseNode(urisub);
            suggestedNode.alias = source;
            /* specific attribute for suggested node */
            suggestedNode = __ihm.getGraphBuilder().setSuggestedNode(suggestedNode,source.x,source.y);
            this.nodes.push(suggestedNode);
            suggestedList[urisub] = suggestedNode;
          } else {
            suggestedNode = suggestedList[urisub];
          }

          /* increment the number of link between the two nodes */
          let linkbase     = {} ;
          linkbase.uri     = "is a" ;
          //console.log(JSON.stringify(suggestedNode));
          //link = new AskomicsLink(linkbase,source,target);
          let link = new AskomicsIsALink(linkbase,source,suggestedNode);
          link.id = __ihm.getGraphBuilder().getId();
          this.links.push(link);
        }

      }
    }

    removeLinkSvgInformation(l) {
      $('#'+l.getSvgLabelId()).remove();
      $('#start-marker-'+l.id).parent().remove();
      $('#end-marker-'+l.id).parent().remove();
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
        /* remove label, and arraow start/end */
        this.removeLinkSvgInformation(this.links[removeL[j]]);
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

  displayObject(node) {
      let r = 'block';
      if (this.isSelected(node)) return r;

      if (node instanceof AskomicsAliasNode || node instanceof AskomicsIsALink ) {
        if (this.optionsView.subclassof ) {
          r='block';
        } else {
          r='none';
        }
      } else {
        if (this.optionsView.objectproperty) {
          r='block';
        } else {
          r='none';
        }
      }
      return r;
    }

  update () {

    let link = this.vis.selectAll(".linkobjectpropertyClass,.linksubclassofClass")
                  .data(this.links, function (d) {
                      return d.id ;
                  });

    let arrow = this.vis.selectAll(".arrowobjectpropertyClass,.arrowsubclassofClass")
                   .data(this.links, function (d) {
                      return d.id ;
                   });
    let currentFL = this;
    // Link labels
    link.enter().append("text")
                .attr("style", "text-anchor:middle; font: 10px sans-serif; cursor: pointer;")
                .attr("class", function(d) { return "text"+d.getClassSVG();} )
                .attr("dy", "-5")
                .attr('id', function(d) { return d.getSvgLabelId();})
                .style("opacity", function(d) {return d.getTextOpacity();})
                .append("textPath")
                .attr("xlink:href",function(d) {return "#"+d.id;})
                .attr("startOffset", "35%")
                .attr('fill', function(d){ return d.getTextFillColor();})
                .text(function(d){return d.label;})
                .style('display', function(d){ return currentFL.displayObject(d);})
                .on('click', function(d) { // Mouse down on a link label
                //  console.log("ID D:"+d.id);
                //  for (let u in currentFL.links) {
                //    console.log("-------------");
                //    console.log(JSON.stringify(currentFL.links[u].id));
                //  }
                  if (d != currentFL.selectLink) { //if link is not selected
                    /* user want a new relation contraint betwwenn two node*/
                    //deselect all nodes and links
                    currentFL.unSelectNodes();
                    currentFL.unSelectLink();

                    //select link
                    currentFL.setSelectLink(d);
                    if ( d.suggested ) {

              //        console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD target sug:"+d.target.suggested);
              //        console.log(JSON.stringify(d));
                      let ll = [d];
                      __ihm.getGraphBuilder().instanciateLink(ll);

                      currentFL.updateInstanciateLinks(ll);

                      if ( d.source.suggested || d.target.suggested  ) {
                        var node = d.source.suggested?d.source:d.target;
                        __ihm.getGraphBuilder().instanciateNode(node);
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
    __ihm.getGraphBuilder().synchronizeInstanciatedNodesAndLinks(this.nodes,this.links);

    // Arrows
    arrow.enter().append("svg:defs").append("svg:marker")
                     .attr("id", function(d) {return 'end-marker-'+d.id;})
                     .attr("class", function(d) { return "arrow"+d.getClassSVG();} )
                     .style('stroke', function (d) {return d.getStrokeColor();})
                     .style('fill', function (d) {return d.getStrokeColor();})
                     .style('display', function(d){ return currentFL.displayObject(d);})
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
                     .attr("class", function(d) { return "arrow"+d.getClassSVG();} )
                     .style('stroke', function (d) { return d.getStrokeColor();})
                     .style('fill', function (d) { return d.getStrokeColor();})
                     .style('display', function(d){ return currentFL.displayObject(d);})
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
          .attr("label", function (d) { return d.label ; })
          .attr("class", function(d) { return "link"+d.getClassSVG();} )
          .attr("marker-end", function(d) {return "url(#end-marker-"+d.id+")";})
          .attr("marker-start", function(d) {return d.type == 'overlap'?"url(#start-marker-"+d.id+")":"none";})
          .style('stroke', function (d) {return d.getStrokeColor();})
          .style('fill', function (d) {return d.getStrokeColor();})
          .style('display', function(d){ return currentFL.displayObject(d);})
          .style("stroke-dasharray",function(d) {return d.suggested?"2":"";})
          .style("opacity", function(d) {return d.suggested?"0.3":"1";})
          .style("stroke-width", "2px");
        //  .on("mouseover", function(d) { this.style[2]="4";}); /* "TypeError: 2 is read-only" occurs in browser */

      var node = this.vis.selectAll("g.node")
                  .data(this.nodes, function (d) { return d.id; });

      var nodeEnter = node.enter().append("g")
                          .attr("class", "node")
                          .call(this.force.drag);

      //setup_node(nodeEnter,slt_elt,slt_data,prev_elt,prev_data);
      //
      nodeEnter.append("svg:circle")
              .attr("style", "cursor: pointer;")
              .style('display', function (d) { return currentFL.displayObject(d); })
              .attr("r", function (d)       { return d.getRNode(); })
              .attr("id", function (d)      { return "node_" + d.id; })
              .attr("uri", function (d)     { return d.uri; })
              .attr("class", "node")
              .attr("class", function(d) { return "node"+d.getClassSVG();})
              .style('stroke', function (d) { return d.getStrokeColor(); })
              .style('stroke-width','2px')
              .style("fill", function (d)   { return d.getColorInstanciatedNode(); })
              .style("opacity", function(d) { return d.getOpacity();})
              .on('click', function(d) {
                currentFL.manageSelectedNodes(d);
                currentFL.unSelectLink();
              // Mouse up on a link
              //document.body.style.cursor = 'default';
                // nothing todo for intance
                if (! __ihm.getGraphBuilder().isInstanciatedNode(d)) {
                  // When selected a node is not considered suggested anymore.
                  __ihm.getGraphBuilder().instanciateNode(d);
                  currentFL.updateInstanciatedNode(d);
                  var listOfLinksInstancied = currentFL.selectListLinksUser(currentFL.links,d);
                  __ihm.getGraphBuilder().instanciateLink(listOfLinksInstancied);
                  currentFL.updateInstanciateLinks(listOfLinksInstancied);
                  for (let ll of listOfLinksInstancied ) {
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
              .attr("class", function(d) { return "text"+d.getClassSVG();})
              .attr("x", function (d)       { return d.getRNode()+1; })
              .attr("font-size",function(d) { return d.getSizeText();})
              .attr("dy",function (d)       { return d.getRNode()+1; } )
              .style('display', function (d) { return currentFL.displayObject(d); })
              .attr('fill', function(d){return d.getTextFillColor();})
              .style('stroke', function(d){return d.getTextStrokeColor();})
              .style("opacity", function(d) { return d.getOpacity();})
              .attr("y", ".31em")
              .attr("id", function (d) {
                  return "txt_" + d.id;
              }).text(function (d) { return d.label; })
              .append("tspan")
                   .attr("font-size","7")
                   .attr("baseline-shift","sub")
                   .text(function (d) {
                     return d.getLabelIndex();
                    })
             .append("tspan")
             .attr("constraint_node_id",function(d){
               return d.id;
             } )
             .style('display', function (d) {
               return currentFL.optionsView.attributesFiltering?'block':'none'; }
             )
             .text(function (d) { return d.getAttributesWithConstraintsString(); }) ;

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
      $(".nodeClass, .textClass, .nodeAliasClass, .textAliasClass").each(function( index ) {
          var gnode = this.parentNode;
          gnode.parentNode.appendChild(gnode);
      });

      this.updateInstanciedNode() ;

      // Restart the force layout.
      this.force.charge(this.charge)
          .linkDistance(this.distance)
          .friction(this.friction)
          //.alpha(1)
          .size([this.w, this.h])
          .start();
  }
}
