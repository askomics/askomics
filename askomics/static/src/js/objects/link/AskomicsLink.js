/*jshint esversion: 6 */

class AskomicsLink extends GraphLink {


  constructor(link,sourceN,targetN) {
    super(link,sourceN,targetN);
    this._positionable = false;
    this._transitive = false ;
    this._absentrel   = false ;
    this._subclassof = false ;
  }

  set subclassof (sub) { this._subclassof = sub; }
  get subclassof () { return this._subclassof; }

  set transitive (transitive) { this._transitive = transitive; }
  get transitive () { return this._transitive; }

  set absentrel (absentrel) { this._absentrel = absentrel; }
  get absentrel () { return this._absentrel; }

  setjson(obj,nodes) {
    super.setjson(obj,nodes);

    this._transitive = obj._transitive ;
    this._absentrel = obj._absentrel ;

  }

  buildConstraintsSPARQL() {
    let blockConstraintByNode = [];

    if ( this.sparql !== undefined ) {
        /* shortcut case */
        let code_sparql = this.sparql.replace(/%in0%/g,this.source.SPARQLid);
        code_sparql = code_sparql.replace(/%out0%/g,this.target.SPARQLid);
        blockConstraintByNode.push(code_sparql);
    } else {
       /* classical link case */
      let rel = this.URI();
      let target = this.target.SPARQLid;
      if ( this.subclassof ) {
        target = 'Sub'+this.target.SPARQLid;
        blockConstraintByNode.push("?"+target+" (rdfs:subClassOf*|rdf:type) "+"?"+this.target.SPARQLid+" ");
      }

      if ( this.transitive ) rel += "+";
      blockConstraintByNode.push("?"+this.source.SPARQLid+" "+rel+" "+"?"+target);

      if ( this.absentrel ) {
        this.target.sparqlgen = true ;
        blockConstraintByNode.push(this.target.buildConstraintsSPARQL());
        this.target.sparqlgen = false;
        blockConstraintByNode = [blockConstraintByNode,'FILTER NOT EXISTS'];
      }
    }
/*
    let allBlock = [];
    for ( let graph in __ihm.localUserAbstraction.uriToGraph[this.uri] ) {
        //alert(JSON.stringify(__ihm.localUserAbstraction.graphToEndpoint[graph]));
        let endpoint = __ihm.localUserAbstraction.graphToEndpoint[graph];
        allBlock.push([blockConstraintByNode,'SERVICE <'+endpoint+'>']);
    }
    return [allBlock,''] ;
*/
//    alert(JSON.stringify(__ihm.localUserAbstraction.uriToGraph));
    return [blockConstraintByNode,''];

  }

  instanciateVariateSPARQL(variates) {
    if ('shortcut_output_var' in this ) {
      for (let s in this.shortcut_output_var) {
        let idx = s.replace(/%in0%/g,this.source.SPARQLid);
        variates.push(idx);
        let idxWithouInterrog = idx.replace("?","");
        this.source.additionalShortcutListDisplayVar[idxWithouInterrog] =  this.shortcut_output_var[s];
      }
    }
  }

}
