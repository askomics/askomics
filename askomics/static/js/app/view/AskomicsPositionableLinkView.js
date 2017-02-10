/*jshint esversion: 6 */

/*
  Manage Information Link View With a current selected link
*/
class AskomicsPositionableLinkView extends AskomicsObjectView {

  constructor(link) {
    super(link);
    this.link = link ;
  }

  display_help() {
    let help_title = 'Positionable link '+this.link.label;
    let help_str = 'There is a relation of position between '+this.link.source.label+' and '+this.link.target.label+'.';
    help_str += ' You can choose different kind of positionable relation.';
    help_str += 'This relations are explained on the following figure:';
    $('#help_figure').attr('src', '/static/images/positionable.png').attr('alt', 'positionable').css('width', '650px');
    $('#help_figure').removeClass( "hidden" );
    displayModal(help_title, help_str, 'ok');
  }

  changeType(type) {
    // remove link
    var id = this.link.id;
    $('#'+id).remove(); // link
    $('#'+GraphObject.getSvgLabelPrefix()+id).remove(); // link label
    $('#marker-'+id).remove(); // arrow

    // change link type and label
    this.link.type = type;
    var labels = {'included':'included in', 'excluded':'exluded of', 'overlap':'overlap with', 'near': 'near'};
    this.link.label = labels[type];

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
    forceLayoutManager.setSelectLink(this.link);
  }

  reverseDir() {

    // remove rightview
    this.remove();

    // remove link
    var id = this.link.id;
    var linkid = $('#'+id).attr("idlink");

    $('#'+id).remove(); // link
    $('#'+GraphObject.getSvgLabelPrefix()+id).remove(); // link label
    $('#marker-'+id).remove(); // arrow

    // swap target and source
    var buf = this.link.source ;
    this.link.source = this.link.target;
    this.link.target = buf;

    // new rightview for the reverse link
    this.create();

    // reload graph (it will recreate the link)
    forceLayoutManager.update();
    //select the link
    forceLayoutManager.setSelectLink(this.link);
  }

  changeStrict(strict) {
    this.link.strict = strict;
  }

  changeSameTax(same_tax) {
    this.link.same_tax = same_tax;
  }

  changeSameRef(same_ref) {
    this.link.same_ref = same_ref;
  }

  changeStrand(strand) {
    this.link.which_strand = strand;
  }

  create() {
    var id_link = this.link.id;
    var elemUri = this.link.uri;

    this.divPanel() ;

    var reverseArrow = $('<div></div>').attr('id', 'change_dir-div-'+id_link).append($('<span><span>').attr('class', 'glyphicon glyphicon-resize-horizontal')
                                                                .attr('aria-hidden', 'true')
                                                                .attr('id', 'change_dir-'+id_link))
                                       .append('Reverse direction');

    var select = $('<select></select>').attr('id', 'type-'+id_link);

    // Uncomment near when near query is OK
    var types = {'included': 'included in', 'excluded': 'excluded of', 'overlap': 'overlap with'/*, 'near': 'near'*/};

    for (var key in types) {
      if(this.type == key) {
          select.append($('<option></option>').attr("value", key).attr("selected", "selected").append(types[key]));
      }else{
          select.append($('<option></option>').attr("value", key).append(types[key]));
      }
    }

    var relation = $("<div></div>").append(this.link.source.formatInHtmlLabelEntity())
                               .append(select)
                               .append(this.link.target.formatInHtmlLabelEntity());

    var checkbox_sameref;
    var checkbox_sametax;
    var checkbox_samestrand;
    var radio_samestrand;

    if (this.link.position_ref) {
        if (this.link.same_ref) {
          checkbox_sameref = $('<label></label>').attr('id', 'reflab-'+id_link).append($('<input>').attr('type', 'checkbox').attr('id', 'ref-'+id_link).attr('checked', 'checked')).append('Reference');
        }else{
          checkbox_sameref = $('<label></label>').attr('id', 'reflab-'+id_link).append($('<input>').attr('type', 'checkbox').attr('id', 'ref-'+id_link)).append('Reference');
        }

        checkbox_sameref.change(function() {
          if ($('#ref-'+id_link).is(':checked')) {
            view.changeSameRef(true);
          }else{
            view.changeSameRef(false);
          }
        });
    }else{
      checkbox_sameref = '';
    }

    if (this.link.position_taxon) {
        if (this.link.same_tax) {
          checkbox_sametax = $('<label></label>').attr('id', 'taxlab-'+id_link).append($('<input>').attr('type', 'checkbox').attr('id', 'tax-'+id_link).attr('checked', 'checked')).append('Taxon');
        }else{
          checkbox_sametax = $('<label></label>').attr('id', 'taxlab-'+id_link)
                                                 .append($('<input>').attr('type', 'checkbox')
                                                                     .attr('id', 'tax-'+id_link))
                                                 .append('Taxon');
        }

        checkbox_sametax.change(function() {
          if($('#tax-'+id_link).is(':checked')) {
            view.changeSameTax(true);
          }else{
            view.changeSameTax(false);
          }
        });
    }else{
      checkbox_sametax = '';
    }

    if (this.link.position_strand) {
       if (this.link.which_strand == 'same') {
        radio_samestrand = $('<div></div>').attr('id', 'div_strand-'+id_link)
                                              .append('Strand:')
                                              .append('<br>')
                                              .append($('<input>').attr('id', 'both_strand-'+id_link)
                                                                  .attr('type', 'radio')
                                                                  .attr('name', 'strand-'+id_link)
                                                                  .attr('value', 'both'))
                                              .append('both').append('<br>')
                                              .append($('<input>').attr('id', 'same_strand-'+id_link)
                                                                  .attr('type', 'radio')
                                                                  .attr('name', 'strand-'+id_link)
                                                                  .attr('value', 'same')
                                                                  .attr('checked', 'checked'))
                                              .append('same').append('<br>')
                                              .append($('<input>').attr('id', 'opp_strand-'+id_link)
                                                                  .attr('type', 'radio')
                                                                  .attr('name', 'strand-'+id_link)
                                                                  .attr('value', 'opp'))
                                              .append('opposite').append('<br>');
       }else if (this.link.which_strand == 'opp') {
        radio_samestrand = $('<div></div>').attr('id', 'div_strand-'+id_link)
                                              .append('Strand:')
                                              .append('<br>')
                                              .append($('<input>').attr('id', 'both_strand-'+id_link)
                                                                  .attr('type', 'radio')
                                                                  .attr('name', 'strand-'+id_link)
                                                                  .attr('value', 'both'))
                                              .append('both').append('<br>')
                                              .append($('<input>').attr('id', 'same_strand-'+id_link)
                                                                  .attr('type', 'radio')
                                                                  .attr('name', 'strand-'+id_link)
                                                                  .attr('value', 'same'))
                                              .append('same').append('<br>')
                                              .append($('<input>').attr('id', 'opp_strand-'+id_link)
                                                                  .attr('type', 'radio')
                                                                  .attr('name', 'strand-'+id_link)
                                                                  .attr('value', 'opp')
                                                                  .attr('checked', 'checked'))
                                              .append('opposite').append('<br>');
       }else{ // 'both'
        radio_samestrand = $('<div></div>').attr('id', 'div_strand-'+id_link)
                                              .append('Strand:')
                                              .append('<br>')
                                              .append($('<input>').attr('id', 'both_strand-'+id_link)
                                                                  .attr('type', 'radio')
                                                                  .attr('name', 'strand-'+id_link)
                                                                  .attr('value', 'both')
                                                                  .attr('checked', 'checked'))
                                              .append('both').append('<br>')
                                              .append($('<input>').attr('id', 'same_strand-'+id_link)
                                                                  .attr('type', 'radio')
                                                                  .attr('name', 'strand-'+id_link)
                                                                  .attr('value', 'same'))
                                              .append('same').append('<br>')
                                              .append($('<input>').attr('id', 'opp_strand-'+id_link)
                                                                  .attr('type', 'radio')
                                                                  .attr('name', 'strand-'+id_link)
                                                                  .attr('value', 'opp'))
                                              .append('opposite').append('<br>');
      }
      // Onchange function for strand
      radio_samestrand.change(function() {
        let value = $('input[name=strand-'+id_link+']:checked', '#div_strand-'+id_link).val();
        view.changeStrand(value);
      });







    }else{
      radio_samestrand = '';
    }

    var onTheSame = $('<div></div>').append('On the same:')
                                    .append($('<br>'))
                                    .append(checkbox_sameref)
                                    .append($('<br>'))
                                    .append(checkbox_sametax)
                                    .append($('<hr>'))
                                    .append(checkbox_samestrand)
                                    .append(radio_samestrand);
    var strict;

    if (this.link.strict) {
      strict = $('<div></div>').append($('<label></label>').append($('<input>').attr('type', 'checkbox').attr('checked', 'checked').attr('id', 'strict-'+id_link).attr('value', 'strict')).append('Strict'));
    }else{
      strict = $('<div></div>').append($('<label></label>').append($('<input>').attr('type', 'checkbox').attr('id', 'strict-'+id_link).attr('value', 'strict')).append('Strict'));
    }

    this.details//.append(reverseArrow)
           .append(relation).append(reverseArrow)
           .append($('<hr>'))
           .append(onTheSame)
           .append($('<hr>'))
           .append(strict);

    var view = this ;

    select.change(function() {
      let value = select.val();
      view.changeType(value);
    });

    strict.change(function() {
      if($('#strict-'+id_link).is(':checked')) {
        view.changeStrict(true);
      }else{
        view.changeStrict(false);
      }
    });

    reverseArrow.click(function() {
      view.reverseDir();
    });

    $("#viewDetails").append(this.details);
  }
}
