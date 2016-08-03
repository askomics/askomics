/*jshint esversion: 6 */

class GOLink extends GraphLink {

  constructor(link,sourceN,targetN) {
    super(link,sourceN,targetN);
  }
  setjson(obj) {
    super.setjson(obj);
  }
  getPanelView() {
    return new GOLinkView(this);
  }

  getFillColor() { return 'darkgreen'; }

  buildConstraintsSPARQL() {
    let blockConstraintByNode = [];
    let rel = this.URI();

    blockConstraintByNode.push('?URI'+this.source.SPARQLid+" "+rel+" "+'?tmp_URI'+this.target.SPARQLid);
    blockConstraintByNode.push("BIND (IRI ( REPLACE(str("+'?tmp_URI'+this.target.SPARQLid+"),\"http://purl.org/obo/owl/GO#\",\"http://purl.obolibrary.org/obo/GO_\")) AS "+'?URI'+this.target.SPARQLid+")");
    //BIND (IRI ( REPLACE(str(?goid),"http://purl.org/obo/owl/GO#","http://purl.obolibrary.org/obo/GO_")) AS ?obogoid)
    return [blockConstraintByNode,''];
  }

  instanciateVariateSPARQL(variates) {
    variates.push('?tmp_URI'+this.target.SPARQLid);
  }
}
