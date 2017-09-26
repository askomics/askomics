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
        let code_sparql = this.sparql.replace(/%in0%/g,'URI'+this.source.SPARQLid);
        code_sparql = code_sparql.replace(/%out0%/g,'URI'+this.target.SPARQLid);
        blockConstraintByNode.push(code_sparql);
    } else {
       /* classical link case */
      let rel = this.URI();
      let target = 'URI'+this.target.SPARQLid;
      if ( this.subclassof ) {
        target = 'SubURI'+this.target.SPARQLid;
        blockConstraintByNode.push("?"+target+" (rdfs:subClassOf*|rdf:type) "+"?"+'URI'+this.target.SPARQLid+" ");
      }

      if ( this.transitive ) rel += "+";
      blockConstraintByNode.push("?"+'URI'+this.source.SPARQLid+" "+rel+" "+"?"+target);

      if ( this.absentrel ) {
        this.target.sparqlgen = true ;
        blockConstraintByNode.push(this.target.buildConstraintsSPARQL());
        this.target.sparqlgen = false;
        blockConstraintByNode = [blockConstraintByNode,'FILTER NOT EXISTS'];
      }
    }
    return [blockConstraintByNode,''];
  }

  instanciateVariateSPARQL(variates) {
    if ('shortcut_output_var' in this ) {
      for (let s in this.shortcut_output_var) {
        let idx = s.replace(/%in0%/g,'URI'+this.source.SPARQLid);
        variates.push(idx);
        let idxWithouInterrog = idx.replace("?","");
        this.source.additionalShortcutListDisplayVar[idxWithouInterrog] =  this.shortcut_output_var[s];
      }
    }
  }

}
