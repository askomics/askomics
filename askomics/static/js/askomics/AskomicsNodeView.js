/*jshint esversion: 6 */

/*
  Manage Information Node View With a current selected node
*/
var AskomicsNodeView = function () {
  //var prefix = "nodeview_";

  {
    // Switch between close and open eye icon for unselected
    $("#showNode").click(function() {
        var sparqlId = $("#nodeName").text();
        var node = graphBuilder.getInstanciedNodeFromSparqlId(sparqlId);
        graphBuilder.switchActiveNode(node);

        if (! node.actif) {
            $(this).removeClass('glyphicon-eye-close');
            $(this).addClass('glyphicon-eye-open');
        } else {
            $(this).removeClass('glyphicon-eye-open');
            $(this).addClass('glyphicon-eye-close');
        }
    });

    // Node deletion
    $("#deleteNode").click(function() {
        var sparqlId = $("#nodeName").text();
        var node = graphBuilder.getInstanciedNodeFromSparqlId(sparqlId);
        graphBuilder.removeInstanciedNode(node);
        forceLayoutManager.removeSuggestions();
        forceLayoutManager.update();
        //$(this).removeNode($("#nodeName").text());
    });

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
    $("#nodeName").text("");
    $("#showNode").hide();
    $("#deleteNode").hide();
  };

  AskomicsNodeView.prototype.show = function (node) {
    if ( node === undefined ) {
      throw new Error("AskomicsNodeView.prototype.set : node is undefined !");
    }

    this.clean();

    $("#nodeName").html(this.formatLabelEntity(node));
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
  //  $("div[id*='"+ prefix +"']" ).hide();
  this.clean();
  };

  AskomicsNodeView.prototype.create = function (node) {
  //  var nodeView = $("<div></div>").attr("id",prefix+node.SPARQLid);
  };
};
