/*jshint esversion: 6 */

/*
  Manage Information Node View With a current selected node
*/
var AskomicsNodeView = function () {

  // take a string and return an entity with a sub index
  AskomicsNodeView.prototype.formatLabelEntity = function(node) {
    if ( node === undefined )
      throw new Error("AskomicsNodeView.prototype.formatLabelEntity : node is not defined !");

    var re = new RegExp(/(\d+)$/);
    var indiceEntity = node.name.match(re);
    var labelEntity = node.name.replace(re,"");
    return $('<em></em>').text(labelEntity).append($('<sub></sub>').text(indiceEntity[0]));
  };

  AskomicsNodeView.prototype.clean = function () {
    $("#nodeName").text("");
    $("#showNode").hide();
    $("#deleteNode").hide();
  };

  AskomicsNodeView.prototype.set = function (node) {
    if ( node === undefined ) {
      throw new Error("AskomicsNodeView.prototype.set : node is undefined !");
    }

    this.clean();

    $("#nodeName").html(this.formatLabelEntity(node));
    $("#showNode").show();
    $("#deleteNode").show();
    $("#showNode").removeClass('glyphicon-eye-close');
    $("#showNode").addClass('glyphicon-eye-open');
  };
};
