/*jshint esversion: 6 */

/*
  Manage Information Node View With a current selected node
*/
var AskomicsNodeView = function () {
  //var prefix = "nodeview_";

  {
    // Switch between close and open eye icon for unselected
    $("#showNode").click(function() {
        var sparqlId = $("#objectName").text();
        var node = graphBuilder.getInstanciedNodeFromSparqlId(sparqlId);
        graphBuilder.switchActiveNode(node);

        if (node.actif) {
            $(this).removeClass('glyphicon-eye-close');
            $(this).addClass('glyphicon-eye-open');
        } else {
            $(this).removeClass('glyphicon-eye-open');
            $(this).addClass('glyphicon-eye-close');
        }
    });

    // Node deletion
    $("#deleteNode").click(function() {
        var sparqlId = $("#objectName").text();
        var node = graphBuilder.getInstanciedNodeFromSparqlId(sparqlId);
        if ( node ) {
          listLinksRemoved = graphBuilder.removeInstanciedNode(node);
          forceLayoutManager.removeSuggestions();
          forceLayoutManager.update();
          attributesView.remove(node);
          nodeView.clean();
          for (var l of listLinksRemoved) {
            linksView.remove(l);
          }
        }
    });

    $('#help').click(function() {
      var sparqlId = $("#objectName").text();
        console.log('---> sparqlId: '+sparqlId);
        try{
          var node = graphBuilder.getInstanciedNodeFromSparqlId(sparqlId);
        }catch(err){
          return;
        }


        if ( node ) {
          if (node.positionable) {
            help_title = 'positionable node '+node.label;
            help_str = node.label+' is a positionable node. You can click on the positionable link to change the query.';
            help_str += ' Choose which attributes you want to see on the right panel.';
            help_str += ' Filter this attributes by choosing values';
          }else{
            help_title = 'Node '+node.label;
            help_str = ' Choose which attributes you want to see on the right panel.';
            help_str += ' Filter this attributes by choosing values';
          }

          displayModal(help_title, help_str, 'ok');
        }
    })

  }

  // take a string and return an entity with a sub index
  AskomicsNodeView.prototype.formatLabelEntity = function(node) {
    if ( node === undefined )
      throw new Error("AskomicsNodeView.prototype.formatLabelEntity : node is not defined !");

    var re = new RegExp(/(\d+)$/);
    var indiceEntity = node.name.match(re);
    if ( indiceEntity === null || indiceEntity.length <= 0 )
      indiceEntity = ["unknown"];
    var labelEntity = node.name.replace(re,"");
    return $('<em></em>').text(labelEntity).append($('<sub></sub>').text(indiceEntity[0]));
  };

  AskomicsNodeView.prototype.clean = function () {
    $("#objectName").text("");
    $("#showNode").hide();
    $("#deleteNode").hide();
  };

  AskomicsNodeView.prototype.show = function (node) {
    if ( node === undefined ) {
      throw new Error("AskomicsNodeView.prototype.set : node is undefined !");
    }

    this.clean();

    $("#objectName").html(this.formatLabelEntity(node));
    $("#showNode").show();
    $("#deleteNode").show();
    if ( node.actif ) {
      $("#showNode").removeClass('glyphicon-eye-close');
      $("#showNode").addClass('glyphicon-eye-open');
    } else {
      $("#showNode").removeClass('glyphicon-eye-open');
      $("#showNode").addClass('glyphicon-eye-close');
    }
  };

  AskomicsNodeView.prototype.remove = function (node) {
    //$("#"+prefix+node.SPARQLid).remove();
    this.clean();
  };

  AskomicsNodeView.prototype.hide = function (node) {
    //$("#"+prefix+node.SPARQLid).hide();
    this.clean();
  };

  AskomicsNodeView.prototype.hideAll = function (node) {
    //$("div[id*='"+ prefix +"']" ).hide();
    this.clean();
  };

  AskomicsNodeView.prototype.create = function (node) {
  //  var nodeView = $("<div></div>").attr("id",prefix+node.SPARQLid);
  };
};
