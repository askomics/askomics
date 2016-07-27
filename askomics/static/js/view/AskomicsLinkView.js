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
    let help_title = 'Link '+this.link.label;
    let help_str = 'There is a relation between '+this.link.source.label+' and '+this.link.target.label+'.';
    help_str += ' This mean that attribute '+this.link.target.label+' of '+this.link.source.label+' is an entity.';
    $('#help_figure').addClass( "hidden" );
    displayModal(help_title, help_str, 'ok');
  }

  create() {
    var details = this.divPanel() ;
    details.addClass('div-details').append("No filter available");
    $("#viewDetails").append(details);
  }

}
