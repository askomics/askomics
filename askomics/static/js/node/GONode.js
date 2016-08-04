/*jshint esversion: 6 */
/*
http://geneontology.org/page/go-rdfxml-file-format

*/
class GONode extends GraphNode {

  constructor(node,x,y) {
    super(node,x,y);
    this.label = "GO Term";
    this.filterOnOboId = [];
    return this;
  }

  set filterOnOboId (__filterOnOboId) { this._filterOnOboId = __filterOnOboId; }
  get filterOnOboId () { return this._filterOnOboId; }

  setjson(obj) {
    super.setjson(obj);
    this.filterOnOboId = obj._filterOnOboId ;
  }

  getPanelView() {
    return new GONodeView(this);
  }

  addOboIdFilter(oboid) {
    this.filterOnOboId.push(oboid);
  }

  deleteOboIdFilter(oboid) {
    for (let i=0;i<this.filterOnOboId.length;i++) {
      if ( this.filterOnOboId[i] == oboid ) {
        this.filterOnOboId.splice(i,1);
        return ;
      }
    }
  }

  buildListOfGODescriptionsSPARQL() {
    let blockConstraintByNode = [];
    let variates = ['?goid','?description','?oboid'];

    blockConstraintByNode.push('?oboid rdfs:label ?description');
    blockConstraintByNode.push('?oboid <http://www.geneontology.org/formats/oboInOwl#id> ?goid');
    /* pour les tests*/
    //blockConstraintByNode.push("VALUES ?oboid { <http://purl.obolibrary.org/obo/GO_0034136> <http://purl.obolibrary.org/obo/GO_0034132> <http://purl.obolibrary.org/obo/GO_0034128>}");

    blockConstraintByNode = [ blockConstraintByNode,'SERVICE <http://localhost:8891/sparql>' ];
    return [variates,[blockConstraintByNode,'']];
  }

  buildConstraintsSPARQL() {

    let blockConstraintByNode = [];
    blockConstraintByNode.push('?URI'+this.SPARQLid+' rdfs:label ?desc'+this.SPARQLid);

    if ( this.filterOnOboId.length > 0 ) {
      blockConstraintByNode.push('?URI'+this.SPARQLid+' rdfs:subClassOf* '+'?oboid'+this.SPARQLid);
      let valueFilterOnOboId = 'VALUES ?oboid'+this.SPARQLid + " {";
      for (let i=0; i<this.filterOnOboId.length;i++) {
        valueFilterOnOboId += " <"+this.filterOnOboId[i]+">";
      }
      valueFilterOnOboId += " }";
      blockConstraintByNode.push(valueFilterOnOboId);
    }
    /*     TEST       */
    //blockConstraintByNode.push('?subClass'+this.SPARQLid+' rdfs:subClassOf* '+'?URI'+this.SPARQLid);
    // obo: ne match pas avec la bonne url....on met en dure pour les tests
    //blockConstraintByNode.push('?subClass'+this.SPARQLid+' <http://www.geneontology.org/formats/oboInOwl#id> ?id2'+this.SPARQLid);
    //blockConstraintByNode.push('?subClass'+this.SPARQLid+' rdfs:label ?desc2'+this.SPARQLid);

    return [
            blockConstraintByNode,'SERVICE <http://localhost:8891/sparql>'
          ];
  }

  instanciateVariateSPARQL(variates) {
    variates.push("?desc"+this.SPARQLid);
    //variates.push('?subClass'+this.SPARQLid);
    //variates.push('?desc2'+this.SPARQLid);
    //variates.push('?id2'+this.SPARQLid);
  }

  getAttributesDisplaying() {
    var list_id = [];
    var list_label = [];

    list_id.push("tmp_URI"+this.SPARQLid);
    list_label.push("ID");
    list_id.push("desc"+this.SPARQLid);
    list_label.push("Label");
    //list_id.push('id2'+this.SPARQLid);
    //list_label.push("SubClassOf");
    //list_id.push('desc2'+this.SPARQLid);
    //list_label.push("LabelSubClassOf");


    return {'id' : list_id, 'label': list_label};
  }

  getTextFillColor() { return 'Coral'; }
  getTextStrokeColor() { return 'Coral'; }
  getNodeFillColor() { return 'Coral'; }
  getNodeStrokeColor() { return 'yellowgreen'; }
  getRNode() { return 13; }

}
