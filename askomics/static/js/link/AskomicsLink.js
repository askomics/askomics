/*jshint esversion: 6 */

class AskomicsLink extends GraphLink {

  constructor(uriL,sourceN,targetN) {
    super(sourceN,targetN);

    this.uri = uriL ;
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


}
