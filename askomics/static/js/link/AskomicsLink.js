/*jshint esversion: 6 */

class AskomicsLink extends GraphLink {


  constructor(link,sourceN,targetN) {
    super(link,sourceN,targetN);
    this._transitive = false ;
    this._negative   = false ;
  }

  set transitive (transitive) { this._transitive = transitive; }
  get transitive () { return this._transitive; }

  set negative (negative) { this._negative = negative; }
  get negative () { return this._negative; }

  setjson(obj,graphBuilder) {
    super.setjson(obj,graphBuilder);

    this._transitive = obj._transitive ;
    this._negative = obj._negative ;

  }

  getPanelView(graphBuilder) {
    return new AskomicsLinkView(graphBuilder,this);
  }

  buildConstraintsSPARQL() {
    let blockConstraintByNode = [];
    let rel = this.URI();
    if ( this.transitive ) rel += "+";
    blockConstraintByNode.push("?"+'URI'+this.source.SPARQLid+" "+rel+" "+"?"+'URI'+this.target.SPARQLid);
    if ( this.negative ) {
      blockConstraintByNode = [blockConstraintByNode,'FILTER NOT EXISTS'];
    }
    return [blockConstraintByNode,''];
  }

  instanciateVariateSPARQL(variates) {

  }
}
