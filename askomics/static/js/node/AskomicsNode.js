/*jshint esversion: 6 */

class AskomicsNode extends GraphNode {

  constructor(node,x,y) {
    super(node,x,y);

    this._attributes = {} ;
    this._categories = {} ;
    this._filters    = {} ; /* filters of attributes key:sparqlid*/
    this._values     = {} ; /* values of attributes key:sparqlid*/
    this._isregexp   = {} ; /* boolean if exact or regexp match */
    this._inverseMatch = {} ; /* boolean if negation filter is actived */
    return this;
  }

  setjson(obj) {
    super.setjson(obj);

    this._attributes = $.extend(true, {}, obj._attributes) ;
    this._categories = $.extend(true, {}, obj._categories) ;
    this._filters    = $.extend(true, {}, obj._filters)    ; /* filters of attributes key:sparqlid*/
    this._values     = $.extend(true, {}, obj._values)     ;
    this._isregexp   = $.extend(true, {}, obj._isregexp)   ;
    this._inverseMatch = $.extend(true, {}, obj._inverseMatch)   ;
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

  set inverseMatch (__inverseMatch) { this._inverseMatch = __inverseMatch; }
  get inverseMatch () { return this._inverseMatch; }

  getPanelView() {
    return new AskomicsNodeView(this);
  }

  buildConstraintsSPARQL() {
    let blockConstraintByNode = [];
    /* add node inside */
    blockConstraintByNode.push("?"+'URI'+this.SPARQLid+" "+'rdf:type'+" "+this.URI());
    blockConstraintByNode.push("?"+'URI'+this.SPARQLid+" "+'rdfs:label'+" "+"?"+this.SPARQLid);

    for (let uri in this.attributes) {
        let SparqlId = this.attributes[uri].SPARQLid;
        let isFiltered =  SparqlId in this.filters;
        if ( isFiltered || this.attributes[uri].actif ) {
          let subBlockConstraint = [];
          subBlockConstraint.push("?"+'URI'+this.SPARQLid+" "+this.URI(uri)+" "+"?"+this.attributes[uri].SPARQLid);
          subBlockConstraint.push(this.URI(uri)+" "+'rdfs:domain'+" "+this.URI());
          subBlockConstraint.push(this.URI(uri)+" "+'rdfs:range'+" "+this.URI(this.attributes[uri].type));
          subBlockConstraint.push(this.URI(uri)+" "+'rdf:type'+" "+this.URI('owl:DatatypeProperty'));
          /* check filter if exist */
          if ( SparqlId in this.filters ) {
            subBlockConstraint.push(this.filters[SparqlId]);
          }
          /* If Inverse Match we have to build a block */
          if ( this._inverseMatch[SparqlId] ) {
            subBlockConstraint = [subBlockConstraint,'FILTER NOT EXISTS'];
          }

          if ( this.attributes[uri].optional ) {
            blockConstraintByNode.push([subBlockConstraint,'OPTIONAL']);
          } else {
            blockConstraintByNode.push([subBlockConstraint,'']);
          }
        }
    }
    for (let uri in this.categories) {
      let SparqlId = "URICat"+this.categories[uri].SPARQLid;
      let isFiltered = SparqlId in this.filters;
      if ( isFiltered || this.categories[uri].actif ) {
        let subBlockConstraint = [];
        subBlockConstraint.push("?"+'URI'+this.SPARQLid+" "+this.URI(uri)+" "+"?"+SparqlId);
        subBlockConstraint.push("?"+SparqlId+" "+'rdfs:label'+" "+"?"+this.categories[uri].SPARQLid);

        if ( SparqlId in this.filters ) {
          subBlockConstraint.push(this.filters[SparqlId]);
        }

        /* If Inverse Match we have to build a block */
        if ( this._inverseMatch[this.categories[uri].SPARQLid] ) {
          subBlockConstraint = [subBlockConstraint,'FILTER NOT EXISTS'];
        }

        if ( this.categories[uri].optional ) {
          blockConstraintByNode.push([subBlockConstraint,'OPTIONAL']);
        } else {
          blockConstraintByNode.push([subBlockConstraint,'']);
        }
      }
    }

    // add the filters on entity name at end
    if (this.SPARQLid in this.filters) {
      blockConstraintByNode.push(this.filters[this.SPARQLid]);
    }

    return [blockConstraintByNode,''];
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

    if (attributeId === undefined || ($.trim(attributeId) === "") ){
      return [[],[]] ;
    }
    var node = this;
    /* add node inside */
    constraintRelations.push("?"+'URI'+node.SPARQLid+" "+'rdf:type'+" "+node.URI());
    constraintRelations.push("?"+'URI'+node.SPARQLid+" "+'rdfs:label'+" "+"?"+node.SPARQLid);

    for (let uri in node.categories) {
      if ( node.categories[uri].id != attributeId ) continue;
      constraintRelations.push("?"+'URI'+node.SPARQLid+" "+this.URI(uri)+" "+"?URICat"+node.categories[uri].SPARQLid);
      constraintRelations.push("?URICat"+node.categories[uri].SPARQLid+" "+'rdfs:label'+" "+"?"+node.categories[uri].SPARQLid);
      variates.push("?"+node.categories[uri].SPARQLid);
      variates.push("?URICat"+node.categories[uri].SPARQLid);
      return [variates,[constraintRelations,'']] ;
    }
    /* category are not found */
    return [[],[]] ;
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
    if ( typeof optional !== undefined ) {
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
/*
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
*/
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
  // TODO: Manage order of display
  getAttributesDisplaying() {
    let list_id = [];
    let list_label = [];

    list_id.push(this.SPARQLid);
    list_label.push("ID");

    for (let uriAtt in this.attributes) {
      if (this.attributes[uriAtt].actif) {
        list_id.push(this.attributes[uriAtt].SPARQLid);
        list_label.push(this.attributes[uriAtt].label);
        console.log('---> attr: '+JSON.stringify(this.attributes));
      }
    }
    for (let uriCat in this.categories) {
      if (this.categories[uriCat].actif) {
        list_id.push(this.categories[uriCat].SPARQLid);
        list_label.push(this.categories[uriCat].label);
        console.log('---> cat: '+JSON.stringify(this.categories));
      }
    }
    return {'id' : list_id, 'label': list_label};
  }

  getTextFillColor() { return 'black'; }
  getTextStrokeColor() { return 'black'; }
  getRNode() { return 12; }

  toString() {
    return "AskomicsNode >" + super.toString();
  }
}
