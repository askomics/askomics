/*jshint esversion: 6 */

/* General class to manage Askomics Panel View*/
class AskomicsObjectView {
  constructor() {
    this.prefix = "rightview_"; /* TODO : This prefix have to be the same as Link view otherwise !!!!!!!!!!! */
  }

  remove(node) {
    $("#"+this.prefix+node.SPARQLid).remove();
  }

  show(node) {
    console.log(" == Hide ==");
    $("#"+this.prefix+node.SPARQLid).show();
  }

  hide(node) {
    console.log(" == Show ==");
    $("#"+this.prefix+node.SPARQLid).hide();
  }

  hideAll (node) {
    $("div[id*='"+ this.prefix +"']" ).hide();
  }
}
