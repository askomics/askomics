/*jshint esversion: 6 */

class AskomicsLink extends GraphLink {

  constructor(link,sourceN,targetN) {
    super(link,sourceN,targetN);
  }

  getPanelView() {
    return new AskomicsLinkView(this);
  }

  buildConstraintsSPARQL(constraintRelations) {
    constraintRelations.push(["?"+'URI'+this.source.SPARQLid,this.URI(),"?"+'URI'+this.target.SPARQLid]);
  }

  buildFiltersSPARQL(filters) {
  }

  instanciateVariateSPARQL(variates) {

  }

  setjson(obj) {
    super.setjson(obj);
  }
}
