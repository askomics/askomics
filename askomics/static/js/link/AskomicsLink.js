/*jshint esversion: 6 */

class AskomicsLink extends GraphLink {

  constructor(link,sourceN,targetN) {
    super(link,sourceN,targetN);
  }

  getPanelView() {
    return new AskomicsLinkView(this);
  }

  buildConstraintsSPARQL() {
    let blockConstraintByNode = [];
    blockConstraintByNode.push("?"+'URI'+this.source.SPARQLid+" "+this.URI()+" "+"?"+'URI'+this.target.SPARQLid);
    return [blockConstraintByNode,''];
  }

  instanciateVariateSPARQL(variates) {

  }

  setjson(obj) {
    super.setjson(obj);
  }
}
