/*jshint esversion: 6 */

/*
  Manage Information Link View With a current selected link
*/
class AskomicsLinkView extends AskomicsObjectView {
  constructor(link) {
    super(link);
    this.link = link ;
  }
  display_help() {
    let help_title = 'Link "'+this.link.label+'"';
    let help_str = 'There is a relation between '+this.link.source.label+' and '+this.link.target.label+'.';
    help_str += ' This mean that attribute '+this.link.target.label+' of '+this.link.source.label+' is an entity.';
    $('#help_figure').addClass( "hidden" );
    displayModal(help_title, help_str, 'ok');
  }

  makeNegativeCheckBox() {
    let inpNeg = $('<input>')
    .attr('type', 'checkbox')
    .attr('linkid', this.link.id);

    inpNeg.click(function(d) {
      let linkid = $(this).attr('linkid');
      let link = graphBuilder.getInstanciedLink(linkid);
      if ($(this).is(':checked')) {
        link.negative = true;
      } else {
        link.negative = false;
      }
    });

    if (this.link.negative) {
      inpNeg.attr('checked', 'checked');
    }

    return inpNeg ;
  }
  makeTransitiveCheckBox() {
    let inpTrans = $('<input>')
    .attr('type', 'checkbox')
    .attr('linkid', this.link.id);

    inpTrans.click(function(d) {
      let linkid = $(this).attr('linkid');
      let link = graphBuilder.getInstanciedLink(linkid);
      if ($(this).is(':checked')) {
        link.transitive = true;
      } else {
        link.transitive = false;
      }
    });

    if (this.link.transitive) {
      inpTrans.attr('checked', 'checked');
    }

    return inpTrans ;
  }

  create() {
    this.divPanel() ;
    let inpNeg = this.makeNegativeCheckBox();
    let inpTrans = this.makeTransitiveCheckBox();

    let listProperties = $('<div></div>')
                                .append($("<label></label>").html("Relations properties"))
                                .append($('<br>'))
                                .append($('<label></label>').append(inpTrans).append('Transitive relation'))
                                .append($('<br>'))
                                .append($('<label></label>').append(inpNeg).append('Negative relation'));
    this.details.append($('<hr>'))
                .append(listProperties)
                .append($('<hr>'));

    $("#viewDetails").append(this.details);
  }

}
