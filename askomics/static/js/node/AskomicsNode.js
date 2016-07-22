/*jshint esversion: 6 */

class AskomicsNode extends GraphNode {

  constructor(node,x,y) {
    super(node,x,y);
    this._attributes = {} ;
    this._categories = {} ;
    this._filters    = {} ; /* filters of attributes key:sparqlid*/
    this._values     = {} ; /* values of attributes key:sparqlid*/
    this._isregexp   = {} ;
    this.label       = node.label;
    this.uri         = node.uri;
    return this;
  }

  setjson(obj) {
    super.setjson(obj);
    this._attributes = obj._attributes ;
    this._categories = obj._categories ;
    this._filters    = obj._filters ; /* filters of attributes key:sparqlid*/
    this._values     = obj._values ;
    this.label       = obj.label ;
  }

  getPanelView() {
    return new AskomicsNodeView(this);
  }

  buildConstraintsSPARQL(constraintRelations) {
    let ua = userAbstraction;
    let isOptional = false ; /* request too long with optional */
    /* add node inside */
    constraintRelations.push(["?"+'URI'+this.SPARQLid,'rdf:type',ua.URI(this.uri)]);
    constraintRelations.push(["?"+'URI'+this.SPARQLid,'rdfs:label',"?"+this.SPARQLid]);

    for (let uri in this.attributes) {
        let SparqlId = this.attributes[uri].SPARQLid;
        let isFiltered =  SparqlId in this.filters;
        if ( isFiltered || this.attributes[uri].actif ) {
          constraintRelations.push(["?"+'URI'+this.SPARQLid,ua.URI(uri),"?"+this.attributes[uri].SPARQLid,isOptional]);
          constraintRelations.push([ua.URI(uri),'rdfs:domain',ua.URI(this.uri),isOptional]);
          constraintRelations.push([ua.URI(uri),'rdfs:range',ua.URI(this.attributes[uri].type),isOptional]);
          constraintRelations.push([ua.URI(uri),'rdf:type',ua.URI('owl:DatatypeProperty'),isOptional]);
        }
    }
    for (let uri in this.categories) {
      let SparqlId = "URICat"+this.categories[uri].SPARQLid;
      let isFiltered = SparqlId in this.filters;
      if ( isFiltered || this.categories[uri].actif ) {
        constraintRelations.push(["?"+'URI'+this.SPARQLid,ua.URI(uri),"?"+SparqlId,isOptional]);
        constraintRelations.push(["?"+SparqlId,'rdfs:label',"?"+this.categories[uri].SPARQLid,isOptional]);
      }
    }
  }

  buildFiltersSPARQL(filters) {
    // add the filters on entity name
    if (this.SPARQLid in this.filters) {
      filters.push(this.filters[this.SPARQLid]);
    }
    console.log(JSON.stringify(this.filters));
    for (let uri in this.attributes) {
      let SparqlId = this.attributes[uri].SPARQLid;
      console.log(SparqlId);
      if ( SparqlId in this.filters ) {
        filters.push(this.filters[SparqlId]);
      }
    }
    for (let uri in this.categories) {
      let SparqlId = "URICat"+this.categories[uri].SPARQLid;
      if ( SparqlId in this.filters ) {
          filters.push(this.filters[SparqlId]);
      }
    }
  }

  instanciateVariateSPARQL(variates) {
    /* adding variable node name if asked by the user */
    if (this.actif) {
      variates.push("?"+this.SPARQLid);
    } else {
      return ; /* Attribute are not instanciate too */
    }
    for (let uri in this.attributes) {
      let SparqlId = this.attributes[uri].SPARQLid;
      if ( this.attributes[uri].actif ) {
          variates.push("?"+this.attributes[uri].SPARQLid);
      }
    }

    for (let uri in this.categories) {
      let SparqlId = this.categories[uri].SPARQLid;
      if ( this.categories[uri].actif) {
          variates.push("?"+this.categories[uri].SPARQLid);
      }
    }
  }

  /* Using by the View to get Categories */
  buildConstraintsGraphForCategory(attributeId) {
    let variates = [] ;
    let constraintRelations = [] ;
    let filters = [];
    let isOptional = false ; /* request too long with optional */

    let nodeAttribute = this ;

    let ua = userAbstraction;

    for (let idx=graphBuilder.nodes().length-1;idx>=0;idx--) {
      var node = graphBuilder.nodes()[idx];
      if (nodeAttribute.id != node.id ) continue ;
      /* add node inside */
      constraintRelations.push(["?"+'URI'+node.SPARQLid,'rdf:type',ua.URI(node.uri)]);
      constraintRelations.push(["?"+'URI'+node.SPARQLid,'rdfs:label',"?"+node.SPARQLid]);

      /* for instance we don't filter category with attributes node but could be (very long request)*/
      if ( nodeAttribute.id != node.id ) continue;

      for (let uri in node.categories) {
          if ( node.categories[uri].id != attributeId ) continue;
          constraintRelations.push(["?"+'URI'+node.SPARQLid,ua.URI(uri),"?URICat"+node.categories[uri].SPARQLid,isOptional]);
          constraintRelations.push(["?URICat"+node.categories[uri].SPARQLid,'rdfs:label',"?"+node.categories[uri].SPARQLid,isOptional]);
          variates.push("?"+node.categories[uri].SPARQLid);
          variates.push("?URICat"+node.categories[uri].SPARQLid);
          console.log(variates.length);
          return [variates,constraintRelations,filters] ;
      }
    }
    return [variates,constraintRelations,filters] ;
  }

  switchRegexpMode(idatt) {
    if (! (idatt in this._isregexp)) {
      /* default value */
      this._isregexp[idatt] = true;
      return;
    }
    this._isregexp[idatt] = !this._isregexp[idatt] ;
  }

  isregexp(idatt) {
    if (! (idatt in this._isregexp)) {
      /* default value */
      this._isregexp[idatt] = true;
    }
    return this._isregexp[idatt];
  }

  set attributes (attributes) { this._attributes = attributes; }
  get attributes () { return this._attributes; }

  set categories (categories) { this._categories = categories; }
  get categories () { return this._categories; }

  set filters (filters) { this._filters = filters; }
  get filters () { return this._filters; }

  set values (values) { this._values = values; }
  get values () { return this._values; }

  getTextFillColor() { return 'black'; }
  getTextStrokeColor() { return 'black'; }
  getRNode() { return 12; }

  toString() {
    return "AskomicsNode >" + super.toString();
  }
}
