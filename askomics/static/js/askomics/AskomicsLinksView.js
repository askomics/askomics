/*jshint esversion: 6 */

/*
  Manage Information Link View With a current selected link
*/
var AskomicsLinksView = function () {
  var prefix = "rightview_";
  var arrowCode = "&#8594;";

  AskomicsLinksView.prototype.remove = function (link) {
    $("#"+prefix+link.source.id+"-"+link.target.id).remove();
  };

  AskomicsLinksView.prototype.showTitle = function (link) {

    nodeView.clean();
    $("#objectName").text(link.label);

  };

  AskomicsLinksView.prototype.show = function (link) {
    this.showTitle(link);
    $("#"+prefix+"Link-"+link.source.id+"-"+link.target.id).show();
  };

  AskomicsLinksView.prototype.hide = function (link) {
    $("#"+prefix+"Link-"+link.source.id+"-"+link.target.id).hide();
  };

  AskomicsLinksView.prototype.hideAll = function (link) {
    $("div[id*='"+ prefix +"']" ).hide();
  };

  AskomicsLinksView.prototype.create = function (link) {

    var elemUri = link.uri,
         nameDiv = prefix+"Link-"+link.source.id+"-"+link.target.id ;

    this.showTitle(link);

    var details = $("<div></div>").attr("id",nameDiv).addClass('div-details');
    console.log(JSON.stringify(link.target));
    var relation = $("<p></p>").append(nodeView.formatLabelEntity(link.source))
                               .append($('<span></span>').html(arrowCode))
                               .append($('<em></em>').html(link.label))
                               .append($('<span></span>').html(arrowCode))
                               .append(nodeView.formatLabelEntity(link.target));
    details.append(relation);

    $("#viewDetails").append(details);
  };

  // take a string and return an entity with a sub index
  AskomicsLinksView.prototype.selectListLinksUser = function(links,node) {
    /* fix the first link associted with the new instanciate node TODO: propose an interface to select the link */
  for (var il in links) {
    var l = links[il];
    console.log("===>"+JSON.stringify(l));
    if ( l.suggested && (l.source.id == node.id || l.target.id == node.id) ) {
        return [links[il]];
    }
  }

  //$('#linksModal').modal('hide');
    /*
    for (var l of links) {
        if ( l.suggested ) {
          if (l.source.id == d.id || l.target.id == d.id ) {
            graphBuilder.instanciateLink(l);
            graphView.solidifyLink(l);
            break ; //only the link finded....
          }
        }
    }*/
  };
};
