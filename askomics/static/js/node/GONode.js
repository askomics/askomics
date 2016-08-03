/*jshint esversion: 6 */
/*
http://geneontology.org/page/go-rdfxml-file-format

*/
class GONode extends GraphNode {

  constructor(node,x,y) {
    super(node,x,y);
    this.label = "GO Term";
    return this;
  }

  setjson(obj) {
    super.setjson(obj);
  }

  getPanelView() {
    return new GONodeView(this);
  }

  buildConstraintsSPARQL() {

    let blockConstraintByNode = [];
    blockConstraintByNode.push('?URI'+this.SPARQLid+' rdfs:label ?desc'+this.SPARQLid);
    /*
    SERVICE <http://localhost:8891/sparql> {
                ?obogoid rdfs:label ?desc .
                ?obogoid ?b ?c.
        }
    */
    return [
            blockConstraintByNode,'SERVICE <http://localhost:8891/sparql>'
          ];
  }

  instanciateVariateSPARQL(variates) {
    variates.push("?desc"+this.SPARQLid);
  }

  getAttributesDisplaying() {
    var list_id = [];
    var list_label = [];

    list_id.push("tmp_URI"+this.SPARQLid);
    list_label.push("ID");
    list_id.push("desc"+this.SPARQLid);
    list_label.push("label");

    return {'id' : list_id, 'label': list_label};
  }

  getTextFillColor() { return 'Coral'; }
  getTextStrokeColor() { return 'Coral'; }
  getNodeFillColor() { return 'Coral'; }
  getNodeStrokeColor() { return 'yellowgreen'; }
  getRNode() { return 13; }

}
