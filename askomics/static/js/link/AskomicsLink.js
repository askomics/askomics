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

  setjson(obj) {
    super.setjson(obj);

    this._transitive = obj._transitive ;
    this._negative = obj._negative ;

  }

  getPanelView() {
    return new AskomicsLinkView(this);
  }

  buildConstraintsSPARQL() {
    let blockConstraintByNode = [];

    if ( this.sparql !== undefined ) {
        /* shortcut case */
        let code_sparql = this.sparql.replace(/%in0%/g,'URI'+this.source.SPARQLid);
        code_sparql = code_sparql.replace(/%out0%/g,'URI'+this.target.SPARQLid);
        blockConstraintByNode.push(code_sparql);
    } else {
       /* classical link case */
      let rel = this.URI();
      if ( this.transitive ) rel += "+";
      blockConstraintByNode.push("?"+'URI'+this.source.SPARQLid+" "+rel+" "+"?"+'URI'+this.target.SPARQLid);
      if ( this.negative ) {
        blockConstraintByNode = [blockConstraintByNode,'FILTER NOT EXISTS'];
      }
    }
    return [blockConstraintByNode,''];
  }

  instanciateVariateSPARQL(variates) {

  }

  getLinkStrokeColor() { return super.getLinkStrokeColor(); }

}
