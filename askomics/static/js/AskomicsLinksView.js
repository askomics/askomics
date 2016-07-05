/*jshint esversion: 6 */

/*
  Manage Information Link View With a current selected link
*/
var AskomicsLinksView = function () {
  var prefix = "rightview_";
  var arrowCode = "&#8594;";

  AskomicsLinksView.prototype.remove = function (link) {
    $("#"+prefix+"Link-"+link.id).remove();
  };

  AskomicsLinksView.prototype.showTitle = function (link) {

    nodeView.clean();
    $("#objectName").text(link.label);

  };

  AskomicsLinksView.prototype.show = function (link) {
    this.showTitle(link);
    $("#"+prefix+"Link-"+link.id).show();
  };

  AskomicsLinksView.prototype.hide = function (link) {
    $("#"+prefix+"Link-"+link.id).hide();
  };

  AskomicsLinksView.prototype.hideAll = function (link) {
    $("div[id*='"+ prefix +"']" ).hide();
  };

  AskomicsLinksView.prototype.changeType = function(link, type) {

    // remove link
    var id = link.id;
    $('#'+id).remove(); // link
    $('#label-'+id).remove(); // link label
    $('#marker-'+id).remove(); // arrow

    // change link type and label
    link.type = type;
    var labels = {'included':'included in', 'excluded':'exluded of', 'overlap':'overlap with', 'near': 'near'};
    link.label = labels[type];

    // If overlap, don't show reverse query (it is the same)
    if (type == 'overlap') {
      $('#change_dir-div-'+id).hide();
    }else{
      if ($('#change_dir-div-'+id).is(":hidden")) {
        $('#change_dir-div-'+id).show();
      }
    }

    // reload graph (it will recreate the link)
    forceLayoutManager.update();
    //select the link
    forceLayoutManager.selectLink(link);
  };

  AskomicsLinksView.prototype.reverseDir = function(link) {

    // remove rightview
    linksView.remove(link);

    // remove link
    var id = link.id;
    var linkid = $('#'+id).attr("idlink");

    $('#'+id).remove(); // link
    $('#label-'+id).remove(); // link label
    $('#marker-'+id).remove(); // arrow

    // swap target and source
    var buf = link.source ;
    link.source = link.target;
    link.target = buf;

    // new rightview for the reverse link
    linksView.create(link);

    // reload graph (it will recreate the link)
    forceLayoutManager.update();
    //select the link
    forceLayoutManager.selectLink(link);
  };

  AskomicsLinksView.prototype.changeStrict = function(link, strict) {
    link.strict = strict;
  };

  AskomicsLinksView.prototype.changeSameTax = function(link, same_tax) {
    link.sameTax = same_tax;
  };

  AskomicsLinksView.prototype.changeSameRef = function(link, same_ref) {
    link.sameRef = same_ref;
  };

  AskomicsLinksView.prototype.create = function (link) {
    if(link.positionable){
      linksView.createPosistionableView(link);
    }else{
      linksView.createStandardView(link);
    }
  };

  AskomicsLinksView.prototype.createStandardView = function (link) {

    var id_link = link.id;

    var elemUri = link.uri,
         nameDiv = prefix+"Link-"+id_link ;

    this.showTitle(link);
    var details = $("<div></div>").attr("id",nameDiv)
                                  .addClass('div-details')
                                  .append("No filter available");

    $("#viewDetails").append(details);
  };

  AskomicsLinksView.prototype.createPosistionableView = function (link) {

    var id_link = link.id;

    var elemUri = link.uri,
         nameDiv = prefix+"Link-"+id_link ;

    this.showTitle(link);

    var details = $("<div></div>").attr("id",nameDiv).addClass('div-details');
    //console.log(JSON.stringify(link.target));

    var reverseArrow = $('<div></div>').attr('id', 'change_dir-div-'+id_link).append($('<span><span>').attr('class', 'glyphicon glyphicon-resize-horizontal')
                                                                .attr('aria-hidden', 'true')
                                                                .attr('id', 'change_dir-'+id_link))
                                       .append('Reverse direction');

    var select = $('<select></select>').attr('id', 'type-'+id_link);

    // Uncomment near when near query is OK
    var types = {'included': 'included in', 'excluded': 'excluded of', 'overlap': 'overlap with'/*, 'near': 'near'*/};

    for (var key in types) {
      if(link.type == key) {
          select.append($('<option></option>').attr("value", key).attr("selected", "selected").append(types[key]));
      }else{
          select.append($('<option></option>').attr("value", key).append(types[key]));
      }
    }

    var relation = $("<div></div>").append(nodeView.formatLabelEntity(link.source))
                               .append(select)
                               .append(nodeView.formatLabelEntity(link.target));

    var checkbox_sameref;
    var checkbox_sametax;

    if (link.sameRef) {
      checkbox_sameref = $('<label></label>').append($('<input>').attr('type', 'checkbox').attr('id', 'ref-'+id_link).attr('checked', 'checked')).append('Reference');
    }else{
      checkbox_sameref = $('<label></label>').append($('<input>').attr('type', 'checkbox').attr('id', 'ref-'+id_link)).append('Reference');
    }

    if (link.sameTax) {
      checkbox_sametax = $('<label></label>').append($('<input>').attr('type', 'checkbox').attr('id', 'tax-'+id_link).attr('checked', 'checked')).append('Taxon');
    }else{
      checkbox_sametax = $('<label></label>').append($('<input>').attr('type', 'checkbox').attr('id', 'tax-'+id_link)).append('Taxon');
    }


    var onTheSame = $('<div></div>').append('On the same:')
                                    .append($('<br>'))
                                    .append(checkbox_sameref)
                                    .append($('<br>'))
                                    .append(checkbox_sametax);

    var strict;

    if (link.strict) {
      strict = $('<div></div>').append($('<label></label>').append($('<input>').attr('type', 'checkbox').attr('checked', 'checked').attr('id', 'strict-'+id_link).attr('value', 'strict')).append('Strict'));
    }else{
      strict = $('<div></div>').append($('<label></label>').append($('<input>').attr('type', 'checkbox').attr('id', 'strict-'+id_link).attr('value', 'strict')).append('Strict'));
    }

    details//.append(reverseArrow)
           .append(relation).append(reverseArrow)
           .append($('<hr>'))
           .append(onTheSame)
           .append($('<hr>'))
           .append(strict);

    lv = this;

    select.change(function() {
      value = select.val();
      lv.changeType(link, value);
    });

    checkbox_sameref.change(function() {
      if ($('#ref-'+id_link).is(':checked')) {
        lv.changeSameRef(link, true);
      }else{
        lv.changeSameRef(link, false);
      }
    });

    checkbox_sametax.change(function() {
      if($('#tax-'+id_link).is(':checked')) {
        lv.changeSameTax(link, true);
      }else{
        lv.changeSameTax(link, false);
      }
    });

    strict.change(function() {
      if($('#strict-'+id_link).is(':checked')) {
        lv.changeStrict(link, true);
      }else{
        lv.changeStrict(link, false);
      }
    });

    reverseArrow.click(function() {
      console.log('---> ReverseDir');
      lv.reverseDir(link);
    });

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
  };
};
