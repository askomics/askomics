/*jshint esversion: 6 */

/*
  Manage Information Link View With a current selected link
*/
var AskomicsLinksView = function () {
  var prefix = "rightview_";
  var arrowCode = "&#8594;";

  AskomicsLinksView.prototype.remove = function (link) {
    $("#"+prefix+"Link-"+link.source.id+"-"+link.target.id).remove();
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

    var reverseArrow = $('<div></div>').append($('<span><span>').attr('class', 'glyphicon glyphicon-resize-horizontal').attr('aria-hidden', 'true'))
                                       .append('Reverse direction');

    var select = $('<select></select>').append($('<option></option>').attr("value", 'included').attr("selected", "selected").append('included in'))
                                       .append($('<option></option>').attr("value", 'excluded').append('exluded of'))
                                       .append($('<option></option>').attr("value", 'overlap').append('overlap with'))
                                       .append($('<option></option>').attr("value", 'near').append('near'));

    var relation = $("<div></div>").append(nodeView.formatLabelEntity(link.source))
                               .append(select)
                               .append(nodeView.formatLabelEntity(link.target));

    var checkbox = $('<div></div>').append($('<label></label>').append($('<input>').attr('type', 'checkbox').attr('checked', 'checked').attr('id', 'ref').attr('value', 'sameref')).append('Reference'))
                                   .append($('<br>'))
                                   .append($('<label></label>').append($('<input>').attr('type', 'checkbox').attr('checked', 'checked').attr('id', 'tax').attr('value', 'sametax')).append('Taxon'));

    var onTheSame = $('<div></div>').append('On the same:')
                                    .append(checkbox);

    var strict = $('<div></div>').append($('<label></label>').append($('<input>').attr('type', 'checkbox').attr('checked', 'checked').attr('id', 'strict').attr('value', 'strict')).append('Strict'));

    details.append(reverseArrow)
           .append(relation)
           .append($('<hr>'))
           .append(onTheSame)
           .append($('<hr>'))
           .append(strict);

    console.log('---> source: '+JSON.stringify(link.source));

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
