/*jshint esversion: 6 */

/*

http://yuml.me/diagram/scruffy/class/draw

[AskomicsNode|*id:string;*x:float;*y:float;*weight:int|SPARQLid:string;suggested:bool;name:string;nlinks:Array(int)|doShiz()]<>-orders*>
[AskomicsLinks|suggested:bool;uri:string;label:string;linkindex:int]
[AskomicsLinks]<>--source[AskomicsNode]
[AskomicsLinks]<>--target[AskomicsNode]
[AskomicsGraphBuilder]
[AskomicsUserAbstraction|tripletSubjectRelationObject:Array(Triple(Subject Relation Object));entityInformationList:Map(uri - Array(String))|updateOntology()]
*/

/*
  CLASSE AskomicsUserAbstraction
  Manage Abstraction storing in the TPS.
*/
var AskomicsUserAbstraction = function () {
    'use strict';
    const prefix = {
      'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      'xsd': 'http://www.w3.org/2001/XMLSchema#',
      'rdfs':'http://www.w3.org/2000/01/rdf-schema#',
      'owl': 'http://www.w3.org/2002/07/owl#'
    };
    /* Ontology is save locally to avoid request with TPS  */
    /* --------------------------------------------------- */
    var tripletSubjectRelationObject = [];
    var entityInformationList = {};
    /* load ontology */
    AskomicsUserAbstraction.prototype.updateOntology = function() {

      var service = new RestServiceJs("userAbstraction");
      service.post({}, function(resultListTripletSubjectRelationObject) {

        /* All relation are stored in tripletSubjectRelationObject */
        tripletSubjectRelationObject = resultListTripletSubjectRelationObject.relations;
        entityInformationList = {};
        /* All information about an entity available in TPS are stored in entityInformationList */
        for (var entry in resultListTripletSubjectRelationObject.entities){
          var uri = resultListTripletSubjectRelationObject.entities[entry].entity;
          var rel = resultListTripletSubjectRelationObject.entities[entry].attribut;
          var val = resultListTripletSubjectRelationObject.entities[entry].value;
          console.log(uri);
          if ( ! (uri in entityInformationList) ) {
              entityInformationList[uri] = {};
          }
          entityInformationList[uri][rel] = val;
        }

        console.log("<=== entityInformationList ===> ");
        console.log(JSON.stringify(entityInformationList));
      });
    };

    /* Get value of an attribut with RDF format like rdfs:label */
    AskomicsUserAbstraction.prototype.removePrefix = function(uriEntity) {
      var idx =  uriEntity.indexOf("#");
      if ( idx == -1 ) {
        idx =  uriEntity.indexOf(":");
        if ( idx == -1 ) return;
      }
      uriEntity = uriEntity.substr(idx+1,uriEntity.length);
      return uriEntity;
    };

    /* Get value of an attribut with RDF format like rdfs:label */
    AskomicsUserAbstraction.prototype.getAttrib = function(uriEntity,attrib) {
        if (!(uriEntity in entityInformationList)) {
          console.error(JSON.stringify(uriEntity) + " is not referenced in the user abstraction !");
          return;
        }
        var attrib_longterm = attrib ;
        for (var p in prefix) {
          var i = attrib_longterm.search(p+":");
          if ( i != - 1) {
            attrib_longterm = attrib_longterm.replace(p+":",prefix[p]);
            break;
          }
        }

        if (!(attrib_longterm in entityInformationList[uriEntity])) {
          console.error(JSON.stringify(uriEntity) + '['+JSON.stringify(attrib)+']' + " is not referenced in the user abstraction !");
          return;
        }
        return entityInformationList[uriEntity][attrib_longterm];
    };

    /* build node from user abstraction infomation */
    AskomicsUserAbstraction.prototype.buildBaseNode  = function(uriEntity) {
      var node = {
        uri : uriEntity,
        label : this.getAttrib(uriEntity,'rdfs:label')
      } ;
      return node;
    };


    /*
    Get
    - relations with UriSelectedNode as a subject or object
    - objects link with Subject UriSelectedNode
    - Subjects link with Subject UriSelectedNode
     */

    AskomicsUserAbstraction.prototype.getRelationsObjectsAndSubjectsWithURI = function(UriSelectedNode) {
      console.log('getRelationsFromSubject '+UriSelectedNode);
      console.log('tripletSubjectRelationObject '+JSON.stringify(tripletSubjectRelationObject));

      var objectsTarget = {} ;
      var subjectsTarget = {} ;

      for (var i in tripletSubjectRelationObject) {

        if ( tripletSubjectRelationObject[i].object == UriSelectedNode ) {
          if (! (tripletSubjectRelationObject[i].subject in subjectsTarget) ) {
            subjectsTarget[tripletSubjectRelationObject[i].subject] = [];
          }
          subjectsTarget[tripletSubjectRelationObject[i].subject].push(tripletSubjectRelationObject[i].relation);
        }
        if ( tripletSubjectRelationObject[i].subject == UriSelectedNode ) {
          if (! (tripletSubjectRelationObject[i].object in objectsTarget) ) {
            objectsTarget[tripletSubjectRelationObject[i].object] = [];
          }
          objectsTarget[tripletSubjectRelationObject[i].object].push(tripletSubjectRelationObject[i].relation);
        }
      }
      // TODO: Manage Doublons and remove it....

      return [objectsTarget, subjectsTarget];
    };

  };


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
    AskomicsGraphBuilder.prototype.setSPARQLVariateId = function(nodeOrLink) {
      lab = nodeOrLink.label;
      if ( ! SPARQLIDgeneration[lab] ) {
        SPARQLIDgeneration[lab] = 0 ;
      }

      SPARQLIDgeneration[lab]++ ;
      nodeOrLink.SPARQLid = lab+SPARQLIDgeneration[lab];
      console.log("AskomicsGraphBuilder.prototype.SPARQLIDgeneration:"+JSON.stringify(nodeOrLink));
      return nodeOrLink;
    };

    AskomicsGraphBuilder.prototype.setIdNode = function(node) {
      node.id = IGgeneration;
      IGgeneration++;
      return node;
    };

    AskomicsGraphBuilder.prototype.setStartpoint = function(node) {
      this.setSPARQLVariateId(node);
      this.setIdNode(node);
      node.name = node.SPARQLid;
      node.weight = 0;
      node.nlink = {}; // number of relation with a node
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

    AskomicsGraphBuilder.prototype.toInstanciateNode = function(node) {
      node.suggested = false;
      this.setSPARQLVariateId(node);
      node.name = node.SPARQLid;
      _instanciedNodeGraph.push(node);
    };

    AskomicsGraphBuilder.prototype.isInstanciateNode = function(idNode) {

      for (var n of _instanciedNodeGraph) {
        if (n.id === idNode)
          return true;
      }
      return false;
    };
    AskomicsGraphBuilder.prototype.toInstanciateLink = function(link) {
      link.suggested = false;
      this.setSPARQLVariateId(link);
      //link.name = node.SPARQLid;
      _instanciedLinkGraph.push(link);
    };
  };


var AskomicsGraphView = function () {

  AskomicsGraphView.prototype.solidifyLink = function(link) {
    var id = link.source.id + "-" + link.target.id + "-" + link.linkindex;
    $("#" + id).css("stroke-dasharray","");
    $("#" + id).css("opacity","1");
  };
};



//********************************************************************************************************************************************************************

var expanded = [];

function keepNodesOnTop() {
    // Ensure the nodes are in front and the links on the back
    $(".nodeStrokeClass").each(function( index ) {
        var gnode = this.parentNode;
        gnode.parentNode.appendChild(gnode);
    });
}

/* Remove all nodes and links suggestion */
function removeSuggestions(nodeList,linkList) {
  console.log(" === REMOVE SUGGESTION ===");

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
    console.log("REMOVE LINK:"+JSON.stringify(linkList[removeL[j]]));
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
console.log("REMOVE NODE:"+JSON.stringify(nodeList[idxn]));
    nodeList.splice(idxn,1);
  }
}

function insertSuggestions2(slt_node, nodeList, linkList) {
    console.log("running insertSuggestions");
    console.log("selected node is: "+JSON.stringify(slt_node));
    console.log("current node list is: "+JSON.stringify(nodeList));
    console.log("current link list is: "+JSON.stringify(linkList));

    /* get All suggested node and relation associated to get orientation of arc */
    tab = DK.getRelationsObjectsAndSubjectsWithURI(slt_node.uri);
    objectsTarget = tab[0];  /* All triplets which slt_node URI are the subject */
    subjectsTarget = tab[1]; /* All triplets which slt_node URI are the object */
    var link = {} ;

    var suggestedList = {} ;

    for (var uri in objectsTarget ) {
      /* creatin node */
      suggestedNode = DK.buildBaseNode(uri);
      /* specific attribute for suggested node */
      AGB.setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);
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
          label: DK.removePrefix(objectsTarget[uri][rel]),
          linkindex: slt_node.nlink[suggestedList[uri].id],
        };

        link.source.weight++;
        linkList.push(link);
      }
    }

    for (uri in subjectsTarget ) {
      if ( ! (uri in suggestedList) ) {
        suggestedNode = DK.buildBaseNode(uri);
        AGB.setSuggestedNode(suggestedNode,slt_node.x,slt_node.y);
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
          label: DK.removePrefix(subjectsTarget[uri][rel2]),
          linkindex: slt_node.nlink[suggestedList[uri].id],
        };
        link.source.weight++;
        linkList.push(link);
      }
    }
    // add neighbours of a node to the graph as propositions.

}


function detailsOf(elemUri, elemId, attributes, nameDiv, data) {
    // Add attributes of the selected node on the right side of AskOmics

    nameDiv = (nameDiv ? nameDiv : elemId);

    var details = $("<div></div>").attr("id",nameDiv).addClass('div-details');

    var addSpecified = function(link) {
        addConstraint('node', link.id, link.specified_by.uri);
        addConstraint('link', link.parent_id, link.specified_by.relation, link.id);
        addConstraint('link', link.child_id, link.specified_by.relation, link.id);
    };

    if (!data) {
        var nameLab = $("<label></label>").attr("for",elemId).text("Name");
        var nameInp = $("<input/>").attr("id", "lab_" + elemId).addClass("form-control");

        details.append(nameLab).append(nameInp);

        nameInp.change(function(d) {
            var value = $(this).val();
            removeFilterCat(elemId);
            removeFilterNum(elemId);
            removeFilterStr(elemId);
            if (value === "") {
                return;
            }
            addFilterStr(elemId,value);
        });
    }

    $.each(attributes, function(i) {
        var id = attributes[i].id;
        var lab = $("<label></label>").attr("for",attributes[i].label).text(attributes[i].label.replace("has_",""));
        var inp = $("<select/>").attr("id",id).addClass("form-control").attr("multiple","multiple");
        //var inp = $("<div/>").attr("id",id).addClass("form-control");
        if (attributes[i].type_uri.indexOf("http://www.w3.org/2001/XMLSchema#") < 0) {
            $('#waitModal').modal('show');
            inp.attr("list", "opt_" + id);
            //console.log(JSON.stringify(nameDiv));
            var service = new RestServiceJs("category_value");
            var model = {
              'category_uri': attributes[i].type_uri,
              'entity': elemUri,
              'category': attributes[i].uri
            };

          //  console.log(attributes[i].uri);
            service.post(model, function(d) {
              //  var datalist = $("<datalist></datalist>").attr("id", "opt_" + id);
                inp.append($("<option></option>").attr("value", "").attr("selected", "selected"));
                var sizeSelect = 3 ;
                if ( d.value.length<3 ) sizeSelect = d.value.length;
                if ( d.value.length === 0 ) sizeSelect = 1;
              //  console.log(d.value.length);
                inp.attr("size",sizeSelect);

                if ( d.value.length > 1 ) {
                  for (var v of d.value) {
                    inp.append($("<option></option>").attr("value", v).append(v));
                  }
                } else if (d.value.length == 1) {
                  inp.append($("<option></option>").attr("value", d.value[0]).append(d.value[0]));
                }
              //  inp.append(datalist);
              $('#waitModal').modal('hide');
            });
        } else {
            // OFI -> new adding filter on numeric
            if (attributes[i].type_uri.indexOf("decimal") >= 0) {
              inp = $("<table></table>");

              v = $("<select></select>").attr("id", "sel_" + id).addClass("form-control");
              v.append($("<option></option>").attr("value", '=').append('='));
              v.append($("<option></option>").attr("value", '<').append('<'));
              v.append($("<option></option>").attr("value", '<=').append('<='));
              v.append($("<option></option>").attr("value", '>').append('>'));
              v.append($("<option></option>").attr("value", '>=').append('>='));
              v.append($("<option></option>").attr("value", '!=').append('!='));

              tr = $("<tr></tr>");
              tr.append($("<td></td>").append(v));
              v = $("<input/>").attr("id",id).attr("type", "text").addClass("form-control");
              tr.append($("<td></td>").append(v));
              inp.append(tr);
            } else {
              inp = $("<input/>").attr("id",id).attr("type", "text").addClass("form-control");
            }
        }

        var icon = $('<span></span>')
                .attr('id', 'display_' + id)
                .attr('aria-hidden','true')
                .addClass('glyphicon')
                .addClass('glyphicon-eye-close')
                .addClass('display');

        details.append(lab).append(icon).append(inp);

        inp.change(function() {
            var value = $(this).find('#'+id).val();

            if ( typeof value === 'undefined' ) {
               value = $(this).find('#opt_'+id).val();
            }

            if ( typeof value === 'undefined' || value === '' ) {
              value = $(this).val();
            }

            removeFilterCat(id);
            removeFilterNum(id);
            removeFilterStr(id);

            if (value === "") {
                if (!isDisplayed(id)) {
                    removeConstraint(id);

                    // If no attributes of a link are selected, remove the from the query
                    if ((data) && (!hasConstraint(null,data.id,['node', 'link']))) {
                        removeConstraint(data.id);
                    }
                }
                return;
            }

            // if specified link
            if (data) addSpecified(data);

            if  (attributes[i].type_uri.indexOf("http://www.w3.org/2001/XMLSchema#") < 0) {
                addConstraint('node',id,
                    attributes[i].type_uri);
            }

            addConstraint('attribute',id,
                attributes[i].uri,
                attributes[i].parent);

            if  (attributes[i].type_uri.indexOf("#decimal") > 0) {
              var operator = $(this).find('#sel_'+ id).val();
              addFilterNum(id,value,operator);
            } else if  (attributes[i].type_uri.indexOf("#string") > 0) {
              addFilterStr(id,value);
            } else { /* Category */
              addFilterCat(id,value);
            }
        });

        icon.click(function() {
            if (icon.hasClass('glyphicon-eye-close')) {
                icon.removeClass('glyphicon-eye-close');
                icon.addClass('glyphicon-eye-open');

                // if specified link
                if (data) addSpecified(data);

                addDisplay(id);
                if  (attributes[i].type_uri.indexOf("http://www.w3.org/2001/XMLSchema#") < 0) {
                    addConstraint('node',id,
                        attributes[i].type_uri);
                }
                addConstraint('attribute',id,
                        attributes[i].uri,
                        attributes[i].parent);
            } else {
                icon.removeClass('glyphicon-eye-open');
                icon.addClass('glyphicon-eye-close');
                removeDisplay(id);

                if (!hasFilter(id)) {
                    removeConstraint(id);

                    // If no attributes of a link are selected, remove the from the query
                    if ((data) && (!hasConstraint(null,data.id,['node', 'link']))) {
                        removeConstraint(data.id);
                    }
                }

            }
        });
        //$('#waitModal').modal('hide');
    });

    $("#nodeName").append(formatLabelEntity(elemId));
    $("#nodeDetails").append(details);
}

function myGraph(AGB,DK) {
    // d3.js graph

    // set up the D3 visualisation in the specified element
    var w = $("#svgdiv").width(),
    h = 350;

    var slt_elt = null,
        slt_data = null,
        prev_elt = null,
        prev_data = null;

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

    var hideSuggestions = function(id) {
        if ($("#node_" + id).length < 1) return;

        // Hide suggestions associated to the previously selected node
        for (var l of links) {
            if (id != l.parent_id)
                continue;
            if ((slt_elt) && (slt_data.id == l.child_id))
                continue;
            if (expanded.indexOf(l.child_id) > -1)
                continue;

            $("#node_" + l.child_id).hide();
            $("#" + id + "-" + l.child_id).hide();
            $("#txt_" + l.child_id).hide();
        }
    };

    var showSuggestions = function(id) {
        if ($("#node_" + id).length < 1) return;
        if (expanded.indexOf(id) < 0) return;

        // Show suggestions associated to the selected node.
        for (var l of links) {
            if (id != l.parent_id)
                continue;

            $("#node_" + l.child_id).show();
            $("#" + id + "-" + l.child_id).show();
            $("#txt_" + l.child_id).show();
        }
    };

    // Change current node
    var swapSelection = function(new_elt, new_data) {
        prev_elt = slt_elt;
        prev_data = slt_data;
        slt_elt = new_elt;
        slt_data = new_data;
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
      var AGV = new AskomicsGraphView();

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
                    detailsOf(uri, d.relation_label, attr.attributes, d.id, d);
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

                if ($("#" + slt_data.id).length) {
                    $("#nodeName").append(formatLabelEntity(slt_data.relation_label));
                    $("#" + slt_data.id).show();
                }
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
                .attr("class", "nodeStrokeClass")
                .style("fill", "royalblue")
                .style("opacity", function(d) {
                    return (d.suggested === true ? 0.6 : 1);
                })
                .on('mousedown', function(d) {
                    // Mouse down on a link
                    document.body.style.cursor = 'crosshair';

                    if (this == slt_elt) {
                        // Clicking on a selected node, unselect it
                        deselection(d.id,this);
                        swapSelection(null, null);

                        return;
                    }

                    swapSelection(this, d);

                    // Deselection of the previous element
                    //if (prev_data) {
                    //    deselection(prev_data.id,prev_elt);
                    //    hideSuggestions(prev_data.id);
                    //}
                    // Show suggestions associated to the selected node.
                    //showSuggestions(slt_data.id);

                    // Change eye if the selected node will be displayed
                    if (isDisplayed(slt_data.id)) {
                        $("#showNode").removeClass('glyphicon-eye-close');
                        $("#showNode").addClass('glyphicon-eye-open');
                    } else {
                        $("#showNode").removeClass('glyphicon-eye-open');
                        $("#showNode").addClass('glyphicon-eye-close');
                    }

                    // Colorize the selected node
                    d3.select(slt_elt).style("fill", "mediumvioletred");

                    // Show the filters of the current node.
                    if ($("#" + slt_data.id).length) {
                        $("#nodeName").append(formatLabelEntity(slt_data.id));
                        $("#" + slt_data.id).show();
                    }

                    $("#showNode").show();
                    $("#deleteNode").show();
                })
                .on('mouseup', function(d) {
                    // Mouse up on a link
                    document.body.style.cursor = 'default';

                  //  if (slt_data != d) return;
                  //  if ($("#" + slt_data.id).length) return;
                    console.log("instance"+d.id);
                    if (AGB.isInstanciateNode(d.id))
                      return;
                    console.log("passe"+d.id);

                    /* fix the first link associted with the new instanciate node TODO: propose an interface to select the link */
                    for (var l of links) {
                        console.log(JSON.stringify(l));
                        if ( l.suggested ) {
                          if (l.source.id == slt_data.id || l.target.id == slt_data.id ) {
                            AGB.toInstanciateLink(l);
                            AGV.solidifyLink(l);
                            break ; //only the link finded....
                          }
                        }
                    }
                    // When selected a node is not considered suggested anymore.
                    AGB.toInstanciateNode(d);
                      //slt_data.suggested = false;

                    //expanded.push(slt_data.id);
                    //addDisplay(slt_data.id);
                    //addConstraint('node', slt_data.id, slt_data.uri);

                    d3.select(slt_elt).style("opacity", "1");

                    // If clicked on a node that is not a starting point
                    // It happens if we clicked on a suggestion
                    // If we click again on a node with an ancestor but that is not a suggestion the constraint will not
                    // be added twice (filtered in addConstraint function)
                    if (prev_data) {
                        // Display a 'real' link in the canvas
                        $("#" + prev_data.id + "-" + slt_data.id).css("stroke-dasharray","");
                        $("#" + prev_data.id + "-" + slt_data.id).css("opacity","1");

                        // Create a constraint corresponding to this link
                        // Links were added when adding suggestion
                        // We need to search in the link list to get the relation_uri
                        for (l of links) {
                            if ((l.child_id == slt_data.id) && (l.parent_id == prev_data.id)) {
                                addConstraint('link',
                                    l.source.id,
                                    l.uri,
                                    l.target.id);
                            }
                        }
                    }

                    /* remove old suggestion */
                    removeSuggestions(nodes, links);
                    /* insert new suggestion */
                    insertSuggestions2(slt_data, nodes, links);

                    update();

              //      keepNodesOnTop();

                    // Get the neighbours of a node using REST service

/*
                    var service = new RestServiceJs("neighbours");
                    var model = {
                                  'source_previous_node': prev_data,
                                  'source_node': slt_data,
                                  'last_new_counter': $("#svgdiv").data().last_new_counter
                                };

                    service.post(model, function(expansion) {

                        insertSuggestions(prev_data, slt_data, expansion, nodes, links);

                        for (l of links) {
                            if ((l.special_clause)
                                    && (!hasConstraint(l.special_clause, l.relation, ['node', 'link', 'attribute']))
                                    && (hasConstraint(l.parent_id, l.child_id, ['node', 'clause', 'attribute']))) {
                                addConstraint('clause', l.relation, l.special_clause.replace(/#src#/g, '?' + l.parent_id).replace(/#tg#/g, '?' + l.child_id));
                            }
                            if ((l.special_clause)
                                    && (!hasConstraint(l.special_clause, l.relation, ['node', 'link', 'attribute']))
                                    && (hasConstraint(l.child_id, l.parent_id, ['node', 'clause', 'attribute']))) {
                                addConstraint('clause', l.relation, l.special_clause.replace(/#src#/g, '?' + l.child_id).replace(/#tg#/g, '?' + l.parent_id));
                            }

                        }

                        detailsOf(slt_data.uri, slt_data.id, expansion.attributes);


                        $("#showNode").removeClass('glyphicon-eye-close');
                        $("#showNode").addClass('glyphicon-eye-open');

                        update();
                        keepNodesOnTop();

                        if (prev_data)
                            hideSuggestions(prev_data.id); // Hide suggestions on previous node

                        // save the query in the download button
                        launchQuery(0, 30, true);
                    });
                    */
                });

        nodeEnter.append("svg:text").append("tspan")
                .attr("class", "textClass")
                .attr("x", 14)
                .attr("y", ".31em")
                .attr("id", function (d) {
                    return "txt_" + d.id;
                })
                .text(function (d) {
                    var re = new RegExp(/(\d+)$/);
                    var labelEntity = d.name.replace(re,"");

                    return labelEntity;
                  }).append("tspan").attr("font-size","7").attr("baseline-shift","sub")
                  .text(function (d) {
                      var re = new RegExp(/(\d+)$/);
                      var indiceEntity = d.name.match(re);

                      if ( indiceEntity && indiceEntity.length>0 )
                        return indiceEntity[0];
                      else
                        return "";
                    })
                ;
              //  .append("<tspan></tspan>").attr("dy","-10").text("2");
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

        // Restart the force layout.
        force.charge(-1000)
            .linkDistance(175)
            .size([w, h])
            .start();
    };

    update();
}
