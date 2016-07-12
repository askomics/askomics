/*jshint esversion: 6 */

/*
  Manage Information Link View With a current selected link
*/
class AskomicsLinkView extends AskomicsObjectView {
  constructor(link) {
    super(link);
    this.link = link ;
  }

  create() {
    var details = this.divPanel() ;
    details.addClass('div-details').append("No filter available");
    $("#viewDetails").append(details);
  }

}
