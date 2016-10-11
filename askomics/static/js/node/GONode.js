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

  buildConstraintsSPARQL() {

    let blockConstraintByNode = [];
    blockConstraintByNode.push('?URI'+this.SPARQLid+' rdfs:label ?Label'+this.SPARQLid);

    if ( this.filterOnOboId.length > 0 ) {
      blockConstraintByNode.push('?URI'+this.SPARQLid+' rdfs:subClassOf* '+'?oboid'+this.SPARQLid);
      let valueFilterOnOboId = 'VALUES ?oboid'+this.SPARQLid + " {";
      for (let i=0; i<this.filterOnOboId.length;i++) {
        valueFilterOnOboId += " <"+this.filterOnOboId[i]+">";
      }
      valueFilterOnOboId += " }";
      blockConstraintByNode.push(valueFilterOnOboId);
    }

    {
      //
      //blockConstraintByNode.push('?URI'+this.SPARQLid+' ?rel'+this.SPARQLid+' ?valueString'+this.SPARQLid);
      blockConstraintByNode.push('?URI'+this.SPARQLid+'<http://www.geneontology.org/formats/oboInOwl#hasOBONamespace> ?OBONamespace'+this.SPARQLid);
      blockConstraintByNode.push('OPTIONAL { ?URI'+this.SPARQLid+'<http://purl.obolibrary.org/obo/IAO_0000115> ?IAODefinition'+this.SPARQLid+"}");
      blockConstraintByNode.push('OPTIONAL { ?URI'+this.SPARQLid+'<http://www.w3.org/2000/01/rdf-schema#comment> ?Comment'+this.SPARQLid+"}");
      blockConstraintByNode.push('OPTIONAL { ?URI'+this.SPARQLid+'<http://www.geneontology.org/formats/oboInOwl#hasBroadSynonym> ?BroadSynonym'+this.SPARQLid+"}");
      blockConstraintByNode.push('OPTIONAL { ?URI'+this.SPARQLid+'<http://www.geneontology.org/formats/oboInOwl#hasRelatedSynonym> ?RelatedSynonym'+this.SPARQLid+"}");
      blockConstraintByNode.push('OPTIONAL { ?URI'+this.SPARQLid+'<http://www.geneontology.org/formats/oboInOwl#hasExactSynonym> ?ExactSynonym'+this.SPARQLid+"}");
      blockConstraintByNode.push('OPTIONAL { ?URI'+this.SPARQLid+'<http://www.geneontology.org/formats/oboInOwl#hasNarrowSynonym> ?NarrowSynonym'+this.SPARQLid+"}");
      //blockConstraintByNode.push('OPTIONAL { ?URI'+this.SPARQLid+'<http://www.geneontology.org/formats/oboInOwl#hasDefinition> ?Definition'+this.SPARQLid+"}");

      //blockConstraintByNode.push('FILTER ( datatype(?valueString'+this.SPARQLid+') = xsd:string )');
    }

    /*     TEST       */
    //blockConstraintByNode.push('?subClass'+this.SPARQLid+' rdfs:subClassOf* '+'?URI'+this.SPARQLid);
    // obo: ne match pas avec la bonne url....on met en dure pour les tests
    //blockConstraintByNode.push('?subClass'+this.SPARQLid+' <http://www.geneontology.org/formats/oboInOwl#id> ?id2'+this.SPARQLid);
    //blockConstraintByNode.push('?subClass'+this.SPARQLid+' rdfs:label ?desc2'+this.SPARQLid);

    return [
            blockConstraintByNode,'SERVICE <'+new GOParametersView().configuration('url_service')+'>'
          ];
  }

  instanciateVariateSPARQL(variates) {
    variates.push("?Label"+this.SPARQLid);
    variates.push("?OBONamespace"+this.SPARQLid);
    variates.push("?IAODefinition"+this.SPARQLid);
    variates.push("?Comment"+this.SPARQLid);

    variates.push("?BroadSynonym"+this.SPARQLid);
    variates.push("?RelatedSynonym"+this.SPARQLid);
    variates.push("?ExactSynonym"+this.SPARQLid);
    variates.push("?NarrowSynonym"+this.SPARQLid);
    //variates.push("?Definition"+this.SPARQLid);

    //variates.push("?rel"+this.SPARQLid);
    //variates.push("?valueString"+this.SPARQLid);

    //variates.push('?subClass'+this.SPARQLid);
    //variates.push('?desc2'+this.SPARQLid);
    //variates.push('?id2'+this.SPARQLid);
  }

  getAttributesDisplaying() {
    let list_id = [];
    let list_label = [];
    let map_url = {} ;

    list_id.push("tmp_URI"+this.SPARQLid);
    list_label.push("Id");
    map_url["tmp_URI"+this.SPARQLid] = new GOParametersView().config.web_link;

    list_id.push("Label"+this.SPARQLid);
    list_label.push("Label");
    /*
    if ( this.filterOnOboId.length <= 0 ) {
      list_id.push('rel'+this.SPARQLid);
      list_label.push("RelationName");
      list_id.push('valueString'+this.SPARQLid);
      list_label.push("Value");
    }*/

    list_id.push("OBONamespace"+this.SPARQLid);
    list_label.push("Namespace");
    list_id.push("IAODefinition"+this.SPARQLid);
    list_label.push("IAO:Definition");
    list_id.push("Comment"+this.SPARQLid);
    list_label.push("Comment");
    list_id.push("BroadSynonym"+this.SPARQLid);
    list_label.push("BroadSynonym");
    list_id.push("RelatedSynonym"+this.SPARQLid);
    list_label.push("RelatedSynonym");
    list_id.push("ExactSynonym"+this.SPARQLid);
    list_label.push("ExactSynonym");
    list_id.push("NarrowSynonym"+this.SPARQLid);
    list_label.push("NarrowSynonym");
    //list_id.push("Definition"+this.SPARQLid);
    //list_label.push("OBO:Definition");

    return {'id' : list_id, 'label': list_label, 'url': map_url };
  }

  /* To informe userAbstraction with new relation managed by GO */
  static getRemoteRelations() {
/*
    http://www.geneontology.org/formats/oboInOwl#hasAlternativeId    ===> GO:TERM
    http://www.geneontology.org/formats/oboInOwl#hasDbXref           ===> Reactome:REACT_30266,Wikipedia:Apoptosis,NIF_Subcellular:sao1702920020
*/
    let allRel = [] ;

    allRel.push({
      'subject'  : "http://purl.org/obo/owl/GO#term" ,
      'object'   : "http://purl.org/obo/owl/GO#term" ,
      'relation' : 'http://www.geneontology.org/formats/oboInOwl#hasAlternativeId'});

    allRel.push({
        'subject'  : "http://purl.org/obo/owl/GO#term" ,
        'object'   : "http://identifiers.org/reactome#term" ,
        'relation' : 'http://www.geneontology.org/formats/oboInOwl#hasDbXref'});
    allRel.push({
        'subject'  : "http://purl.org/obo/owl/GO#term" ,
        'object'   : "https://en.wikipedia.org/wiki#term" ,
        'relation' : 'http://www.geneontology.org/formats/oboInOwl#hasDbXref'});

    return allRel ;
  }

  getTextFillColor() { return 'Coral'; }
  getTextStrokeColor() { return 'Coral'; }
  getNodeFillColor() { return 'Coral'; }
  getNodeStrokeColor() { return 'yellowgreen'; }
  getRNode() { return 13; }

}
