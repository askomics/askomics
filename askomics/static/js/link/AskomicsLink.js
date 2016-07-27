/*jshint esversion: 6 */

class AskomicsLink extends GraphLink {

  constructor(uriL,sourceN,targetN) {
    super(sourceN,targetN);
    if ( uriL ) {
      this.uri = uriL ;
    } else {
      this.uri = "undef";
    }
    this.label = userAbstraction.removePrefix(this.uri);
  }

  getPanelView() {
    return new AskomicsLinkView(this);
  }

  buildConstraintsSPARQL(constraintRelations) {
    let ua = userAbstraction;
    constraintRelations.push(["?"+'URI'+this.source.SPARQLid,ua.URI(this.uri),"?"+'URI'+this.target.SPARQLid]);
  }

  buildFiltersSPARQL(filters) {
  }

  instanciateVariateSPARQL(variates) {

  }

  setjson(obj) {
    super.setjson(obj);
    this.uri = obj.uri;
    this.label = obj.label;
  }


}
