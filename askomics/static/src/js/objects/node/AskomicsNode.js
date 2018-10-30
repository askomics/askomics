/*jshint esversion: 6 */

class AskomicsNode extends GraphNode {

  constructor(node,x,y) {
    super(node,x,y);

    this._positionable = false;
    this._attributes = {} ;
    this._categories = {} ;
    this._filters    = {} ; /* filters of attributes key:sparqlid*/
    this._values     = {} ; /* values of attributes key:sparqlid*/
    this._isregexp   = {} ; /* boolean if exact or regexp match */
    this._inverseMatch = {} ; /* boolean if negation filter is actived */
    this._linkvar      = {} ; /* link variable are listed */

    this.actif = true     ;
    this.optional = false ;

    this.additionalShortcutListDisplayVar = {} ;
    return this;
  }

  attIsInside(uri,array) {
    return this.attributes[uri].SPARQLid in array;
  }
  catIsInside(uri,array) {
    return 'URICat'+this.categories[uri].SPARQLid in array;
  }

  getAttributesWithConstraints () {
    let attribs = [];
    let regexp = [];
    let invmat = [];
    let linkv = [];

    for (let uri in this.attributes) {
      if ( this.attIsInside(uri,this.filters) ) {
        attribs.push(this.attributes[uri].label);
      }
    }

    for (let uri in this.categories) {
      if ( this.catIsInside(uri,this.filters) ) {
        attribs.push(this.categories[uri].label);
      }
    }

    return attribs ;
  }

  getAttributesWithConstraintsString() {
    let constraints = this.getAttributesWithConstraints();
    let v = "";
    let iConstr = 0;

    if ( constraints.length >= 1 ) {
      v = "#"+constraints[iConstr++];
    }
    for (iConstr; iConstr < constraints.length; iConstr++ ) {
        v += ",#"+constraints[iConstr];
    }
    return v;
  }

  setjson(obj) {
    super.setjson(obj);

    this._attributes = $.extend(true, {}, obj._attributes) ;
    this._categories = $.extend(true, {}, obj._categories) ;
    this._filters    = $.extend(true, {}, obj._filters)    ; /* filters of attributes key:sparqlid*/
    this._values     = $.extend(true, {}, obj._values)     ;
    this._isregexp   = $.extend(true, {}, obj._isregexp)   ;
    this._inverseMatch = $.extend(true, {}, obj._inverseMatch)   ;
    this._linkvar = $.extend(true, {}, obj._linkvar)   ;
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

  set linkvar (__inverseMatch) { this._linkvar = __linkvar; }
  get linkvar () { return this._linkvar; }

  att_position_active(attpos) {
    for (let uri in this.attributes) {
      if ( uri.indexOf("position_"+attpos) > 0 ) {
        if ( this.attributes[uri].actif  ) {
          return this.attributes[uri].SPARQLid;
        }
      }
    }
    for (let uri in this.categories) {
      if ( uri.indexOf("position_"+attpos) > 0 ) {
        if ( this.categories[uri].actif  ) {
          return this.categories[uri].SPARQLid;
        }
      }
    }
    return null;
  }

  buildConstraintsSPARQL() {

    let blockConstraintByNode = [];

    if (! this.sparqlgen)
      return [blockConstraintByNode,''];

    /* add node inside */
    blockConstraintByNode.push("?"+this.SPARQLid+" "+'rdf:type'+" "+this.URI());

    for (let uri in this.attributes) {
        let SparqlId = this.attributes[uri].SPARQLid;
        let isFiltered =  SparqlId in this.filters;
        let isLinked = SparqlId in this.linkvar;
        let isInversedMatch = SparqlId in this.inverseMatch;

        if ( isLinked || isFiltered || isInversedMatch || this.attributes[uri].actif ) {
          let subBlockConstraint = [];
          subBlockConstraint.push("?"+this.SPARQLid+" "+this.URI(uri)+" "+"?"+SparqlId);
          // subBlockConstraint.push("FILTER isLiteral(?"+SparqlId+")");
          /* check filter if exist */

          let subBlockNegativeConstraint = [];
          if ( isInversedMatch ) {
            subBlockNegativeConstraint.push("?"+this.SPARQLid+" "+this.URI(uri)+" "+"?negative"+SparqlId);
            // subBlockNegativeConstraint.push("FILTER isLiteral(?negative"+SparqlId+")");
          }
          /* If Inverse Match we have to build a block */
          if ( isFiltered  ) {
            if ( isInversedMatch ) {
              let newfilt = this.filters[SparqlId].replace(SparqlId,"negative"+SparqlId);
              subBlockNegativeConstraint.push(newfilt);
            } else {
              subBlockConstraint.push(this.filters[SparqlId]);
            }
          }

          if ( isInversedMatch ) {
            if ( this.inverseMatch[SparqlId] === 'inverseWithNoRelation' ) {
                blockConstraintByNode.push([subBlockConstraint,'OPTIONAL']);
            } else {
                blockConstraintByNode.push([subBlockConstraint,'']);
            }
            blockConstraintByNode.push([subBlockNegativeConstraint,'FILTER NOT EXISTS']);
          } else {
            if ( this.attributes[uri].optional ) {
              blockConstraintByNode.push([subBlockConstraint,'OPTIONAL']);
            } else {
              blockConstraintByNode.push([subBlockConstraint,'']);
            }
          }
      }
    }
    for (let uri in this.categories) {
      let SparqlId = "URICat"+this.categories[uri].SPARQLid;
      let isFiltered = SparqlId in this.filters;
      let isLinked = SparqlId in this.linkvar;
      let isInversedMatch = SparqlId in this.inverseMatch;

      if ( isInversedMatch || isLinked || isFiltered  || this.categories[uri].actif ) {
        let subBlockConstraint = [];
        // *** cause a very long execution with virtuoso ***
        //subBlockConstraint.push("<"+this.categories[uri].type+"> askomics:category ?"+SparqlId);
        subBlockConstraint.push("?"+this.SPARQLid+" "+this.URI(uri)+" "+"?"+SparqlId);
        subBlockConstraint.push("?"+SparqlId+" "+'rdfs:label'+" "+"?"+this.categories[uri].SPARQLid);


        let subBlockNegativeConstraint = [];
        if ( isInversedMatch ) {
          // *** cause a very long execution with virtuoso ***
          //subBlockNegativeConstraint.push("<"+this.categories[uri].type+"> askomics:category "+"?negative"+SparqlId);
          subBlockNegativeConstraint.push("?"+this.SPARQLid+" "+this.URI(uri)+" "+"?negative"+SparqlId);
          subBlockNegativeConstraint.push("?negative"+SparqlId+" "+'rdfs:label'+" "+"?negative"+this.categories[uri].SPARQLid);
        }
        /* If Inverse Match we have to build a block */
        if ( isFiltered  ) {
            if ( isInversedMatch ) {
              let newfilt = this.filters[SparqlId].replace(SparqlId,"negative"+SparqlId);
              subBlockNegativeConstraint.push(newfilt);
            } else {
              subBlockConstraint.push(this.filters[SparqlId]);
            }
          }

        if ( isInversedMatch ) {
            if ( this.inverseMatch[SparqlId] === 'inverseWithNoRelation' ) {
                blockConstraintByNode.push([subBlockConstraint,'OPTIONAL']);
            } else {
                blockConstraintByNode.push([subBlockConstraint,'']);
            }
            blockConstraintByNode.push([subBlockNegativeConstraint,'FILTER NOT EXISTS']);
          } else {
            if ( this.categories[uri].optional ) {
              blockConstraintByNode.push([subBlockConstraint,'OPTIONAL']);
            } else {
              blockConstraintByNode.push([subBlockConstraint,'']);
            }
          }
        }
      }

    // add the filters on entity name at end
    if (this.SPARQLid in this.filters) {
      /* If Inverse Match we have to build a block */

      if ( this.SPARQLid in this.inverseMatch ) {
        let subBlockConstraint = [];
        let newfilt = this.filters[this.SPARQLid].replace(this.SPARQLid,this.SPARQLid);
        subBlockConstraint.push(newfilt);
        subBlockConstraint = [subBlockConstraint,'FILTER NOT EXISTS'];
        blockConstraintByNode.push([subBlockConstraint,'']);
      } else {
        blockConstraintByNode.push(this.filters[this.SPARQLid]);
      }
    }

    return [blockConstraintByNode,''];
  }

  instanciateVariateSPARQL(variates) {
    /* no sparql had been generated ... */
    if ( (!this.sparqlgen) )
      return ;

    if (this.actif) {
      variates.push("?"+this.SPARQLid);
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
  buildConstraintsGraphForCategory(attributeId,entityDepends=false) {
    let variates = [] ;
    let constraintRelations = [] ;

    if (attributeId === undefined || ($.trim(attributeId) === "") ){
      return [[],[]] ;
    }
    var node = this;

    /* add node inside */
    for (let uri in node.categories) {
      if ( node.categories[uri].id != attributeId ) continue;
      constraintRelations.push("<"+node.categories[uri].type+"> askomics:category "+"?URICat"+node.categories[uri].SPARQLid);
      constraintRelations.push("?URICat"+node.categories[uri].SPARQLid+" "+'rdfs:label'+" "+"?"+node.categories[uri].SPARQLid);
      if (entityDepends)
        constraintRelations.push("?"+node.SPARQLid+" "+this.URI(uri)+" "+"?URICat"+node.categories[uri].SPARQLid);
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
      this._isregexp[idatt] = false;
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

  isActif(uriId) {
    if ( uriId == this.SPARQLid ) return this.actif;
    for (let a in this.attributes ) {
      if ( this.attributes[a].SPARQLid == uriId ) return this.attributes[a].actif;
    }
    for (let a in this.categories ) {
      if ( this.categories[a].SPARQLid == uriId ) return this.categories[a].actif;
    }
  }

  setActiveAttribute(uriId,boolean,optional) {
    if ( uriId === undefined ) throw "activeAttribute : undefined attribute !";
    let opt = false;
    if ( typeof optional !== undefined ) {
      opt = true;
    }

    // rdfs:label desactived
    if ( uriId == this.SPARQLid ) {
      this.actif = boolean ;
      if (opt) this.optional = optional;
      return ;
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

  setFilterLinkVariable(SPARQLid1,node2,SPARQLid2) {
    this.setFilterAttributes(SPARQLid1,SPARQLid2,'FILTER (?'+SPARQLid1+'=?'+SPARQLid2+')');
    if (! (SPARQLid1 in this.linkvar) ) {
      this.linkvar[SPARQLid1] = {};
      this.linkvar[SPARQLid1].cpt = 0;       /* counter about this attribute */
      this.linkvar[SPARQLid1].nodelink = -1; /* ref node link */
    }

    if (! (SPARQLid2 in node2.linkvar) ) {
      node2.linkvar[SPARQLid2] = {};
      node2.linkvar[SPARQLid2].cpt = 0;       /* counter about this attribute */
      node2.linkvar[SPARQLid2].nodelink = -1; /* ref node link */
    }

    this.linkvar[SPARQLid1].cpt++;
    this.linkvar[SPARQLid1].nodelink = node2.id;
    node2.linkvar[SPARQLid2].cpt++;
    node2.linkvar[SPARQLid2].nodelink = this.id;

  }

  removeFilterLinkVariable(SPARQLid1) {

    if (! (SPARQLid1 in this.values)  ) return ;

    let SPARQLid2 = this.values[SPARQLid1];
    this.setFilterAttributes(SPARQLid1,"","");

    this.linkvar[SPARQLid1].cpt--;

    let n = __ihm.getGraphBuilder().nodes([this.linkvar[SPARQLid1].nodelink],'id');
    if (n.length<=0) {
      cnsole.log("AskomicsNode::removeFilterLinkVariable can not find linkvar node:"+this.linkvar[SPARQLid1].nodelink);
      return ;
    }
    n[0].linkvar[SPARQLid2].cpt--;

    if ( this.linkvar[SPARQLid1].cpt <= 0 ) delete this.linkvar[SPARQLid1];
    if ( n[0].linkvar[SPARQLid2].cpt <= 0 ) delete n[0].linkvar[SPARQLid2];
  }

  getAttributesDisplaying() {

    let list_id = [];
    let list_label = [];
    let map_url = {} ;

    let orderAttributes = __ihm.getAbstraction().getOrderAttributesList(this.uri);

    for ( let uriAttI in orderAttributes ) {
      let uriAtt = orderAttributes[uriAttI].uri;
      if ( this.uri === uriAtt ) {
        list_id.push(this.SPARQLid);
        list_label.push(this.label);
        map_url[this.SPARQLid] = "%s";
      }
      else if ( orderAttributes[uriAttI].basic_type != "category" ) {
        /* actif could be not instancied if the data is loaded without interface */
        if (! ( uriAtt in this.attributes) ) {
          this.attributes[uriAtt] = {};
          console.error("Bad match attribut");
          console.error("uriAtt:"+uriAtt);
          console.error("this.attributes:"+JSON.stringify(this.attributes));
        }
        if ( this.attributes[uriAtt].actif === undefined ) this.attributes[uriAtt].actif = false;
        if (this.attributes[uriAtt].actif) {
          list_id.push(this.attributes[uriAtt].SPARQLid);
          list_label.push(this.attributes[uriAtt].label);
        }
      } else {

        if (! ( uriAtt in this.categories) ) {
          this.categories[uriAtt] = {};
          console.error("Bad match categories");
          console.error("uriAtt:"+uriAtt);
          console.error("this.categories:"+JSON.stringify(this.categories));
        }
        if ( this.categories[uriAtt].actif === undefined ) this.categories[uriAtt].actif = false;
        if (this.categories[uriAtt].actif) {
          list_id.push(this.categories[uriAtt].SPARQLid);
          list_label.push(this.categories[uriAtt].label);
        }
      }
    }

    for ( let sparqlid in this.additionalShortcutListDisplayVar ) {
      list_id.push(sparqlid);
      list_label.push(this.additionalShortcutListDisplayVar[sparqlid]);
    }

    return {'id' : list_id, 'label': list_label, 'url': map_url};
  }

  getTextFillColor() { return 'black'; }
  getTextStrokeColor() { return 'black'; }
  getRNode() { return 12; }

  toString() {
    return "AskomicsNode >" + super.toString();
  }
}
