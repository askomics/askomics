/*jshint esversion: 6 */

class AskomicsNode extends GraphNode {

  constructor(node,x,y) {
    super(node,x,y);

    this._attributes = {} ;
    this._categories = {} ;
    this._filters    = {} ; /* filters of attributes key:sparqlid*/
    this._values     = {} ; /* values of attributes key:sparqlid*/
    this._isregexp   = {} ;
    return this;
  }

  setjson(obj) {
    super.setjson(obj);

    this._attributes = $.extend(true, {}, obj._attributes) ;
    this._categories = $.extend(true, {}, obj._categories) ;
    this._filters    = $.extend(true, {}, obj._filters)    ; /* filters of attributes key:sparqlid*/
    this._values     = $.extend(true, {}, obj._values)     ;
    this._isregexp   = $.extend(true, {}, obj._isregexp)   ;
  }

  set attributes (attributes) { this._attributes = attributes; }
  get attributes () { return this._attributes; }

  set categories (categories) { this._categories = categories; }
  get categories () { return this._categories; }

  set filters (filters) { this._filters = filters; }
  get filters () { return this._filters; }

  set values (values) { this._values = values; }
  get values () { return this._values; }

  set isregexp (__isregexp) { this._isregexp = __isregexp; }
  get isregexp () { return this._isregexp; }

  getPanelView() {
    return new AskomicsNodeView(this);
  }

  buildConstraintsSPARQL(constraintRelations) {
    let isOptional = false ; /* request too long with optional */
    /* add node inside */
    constraintRelations.push(["?"+'URI'+this.SPARQLid,'rdf:type',this.URI()]);
    constraintRelations.push(["?"+'URI'+this.SPARQLid,'rdfs:label',"?"+this.SPARQLid]);

    for (let uri in this.attributes) {
        let SparqlId = this.attributes[uri].SPARQLid;
        let isFiltered =  SparqlId in this.filters;
        if ( isFiltered || this.attributes[uri].actif ) {
          constraintRelations.push(["?"+'URI'+this.SPARQLid,this.URI(uri),"?"+this.attributes[uri].SPARQLid,isOptional]);
          constraintRelations.push([this.URI(uri),'rdfs:domain',this.URI(),isOptional]);
          constraintRelations.push([this.URI(uri),'rdfs:range',this.URI(this.attributes[uri].type),isOptional]);
          constraintRelations.push([this.URI(uri),'rdf:type',this.URI('owl:DatatypeProperty'),isOptional]);
        }
    }
    for (let uri in this.categories) {
      let SparqlId = "URICat"+this.categories[uri].SPARQLid;
      let isFiltered = SparqlId in this.filters;
      if ( isFiltered || this.categories[uri].actif ) {
        constraintRelations.push(["?"+'URI'+this.SPARQLid,this.URI(uri),"?"+SparqlId,isOptional]);
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

    if (attributeId === undefined || ($.trim(attributeId) === "") ){
      return [[],[],[]] ;
    }
    var node = this;
    /* add node inside */
    constraintRelations.push(["?"+'URI'+node.SPARQLid,'rdf:type',node.URI()]);
    constraintRelations.push(["?"+'URI'+node.SPARQLid,'rdfs:label',"?"+node.SPARQLid]);

    for (let uri in node.categories) {
      if ( node.categories[uri].id != attributeId ) continue;
      constraintRelations.push(["?"+'URI'+node.SPARQLid,this.URI(uri),"?URICat"+node.categories[uri].SPARQLid,isOptional]);
      constraintRelations.push(["?URICat"+node.categories[uri].SPARQLid,'rdfs:label',"?"+node.categories[uri].SPARQLid,isOptional]);
      variates.push("?"+node.categories[uri].SPARQLid);
      variates.push("?URICat"+node.categories[uri].SPARQLid);
      return [variates,constraintRelations,filters] ;
    }
    /* category are not found */
    return [[],[],[]] ;
  }

  switchRegexpMode(idatt) {
    if ( idatt === undefined ) throw "switchRegexpMode : undefined attribute !";
    if (! (idatt in this._isregexp)) {
      /* default value */
      this._isregexp[idatt] = true;
      return;
    }

    this._isregexp[idatt] = !this._isregexp[idatt] ;
  }

  isRegexpMode(idatt) {
    if ( idatt === undefined ) throw "isRegexpMode : undefined attribute !";
    if (! (idatt in this._isregexp)) {
      /* default value */
      this._isregexp[idatt] = false;
    }
    return this._isregexp[idatt];
  }

  setActiveAttribute(uriId,boolean,optional) {
    if ( uriId === undefined ) throw "activeAttribute : undefined attribute !";
    let opt = false;
    if ( optional && (optional !== undefined) ) {
      opt = true;
    }
    for (let a in this.attributes ) {
      if ( this.attributes[a].SPARQLid == uriId ) {
        this.attributes[a].actif = boolean ;
        if (opt) this.attributes[a].optional = optional;
        return ;
      }
    }
    for (let a in this.categories ) {
      if ( this.categories[a].SPARQLid == uriId ) {
        this.categories[a].actif = boolean ;
        if (opt) this.categories[a].optional = optional;
        return ;
      }
    }
    throw "activeAttribute : can not find attribute:"+uriId;
  }

  isActiveAttribute(uriId) {
    if ( uriId === undefined ) throw "isActiveAttribute : undefined attribute !";
    for (let a in this.attributes ) {
      if ( this.attributes[a].id == uriId ) {
        return this.attributes[a].actif;
      }
    }
    for (let a in this.categories ) {
      if ( this.categories[a].id == uriId ) {
        return this.categories[a].actif;
      }
    }
    throw "isActiveAttribute : can not find attribute:"+uriId;
  }

  setFilterAttributes(SPARQLid,value,filter) {
    if ($.trim(value) === "") { // case if user don't wan anymore a filter
      delete this.filters[SPARQLid];
      delete this.values[SPARQLid];
    } else {
      if ($.trim(filter)!=="") {
        this.filters[SPARQLid] = filter;
      } else {
        delete this.filters[SPARQLid];
      }
      this.values[SPARQLid]  = value; /* save value to restore it when the views need it*/
    }
  }

  getTextFillColor() { return 'black'; }
  getTextStrokeColor() { return 'black'; }
  getRNode() { return 12; }

  toString() {
    return "AskomicsNode >" + super.toString();
  }
}
