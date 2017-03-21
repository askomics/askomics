/*jshint esversion: 6 */

class AskomicsAliasNode extends GraphNode {

  constructor(node,targetNode,x,y) {
    super(node,x,y);
    this.alias = node.alias ;
  }

  set attributes (attributes) { }
  get attributes () { return this.alias.attributes; }

  set categories (categories) { }
  get categories () { return this.alias.categories; }

  set filters (filters) { }
  get filters () { return this.alias.filters; }

  set values (values) { }
  get values () { return this.alias.values; }

  set isregexp (__isregexp) { }
  get isregexp () { return this.alias.isregexp; }

  set inverseMatch (__inverseMatch) { }
  get inverseMatch () { return this.alias.inverseMatch; }

  set linkvar (__inverseMatch) { }
  get linkvar () { return this.alias.linkvar; }

  set SPARQLid (__spq) { }
  get SPARQLid () { return this.alias.SPARQLid; }

  getAttributesWithConstraints () {
    return this.alias.getAttributesWithConstraints() ;
  }

  getAttributesWithConstraintsString() {
    return this.alias.getAttributesWithConstraintsString() ;
  }

  setjson(obj) {
    super.setjson(obj);
  }


  buildConstraintsSPARQL() {
    return [[],''] ;
  }

  instanciateVariateSPARQL(variates) {
  }

  /* Using by the View to get Categories */
  buildConstraintsGraphForCategory(attributeId) {
    /* category are not found */
    return this.alias.buildConstraintsGraphForCategory(attributeId) ;
  }

  switchRegexpMode(idatt) {
    this.alias.switchRegexpMode(idatt);
  }

  isRegexpMode(idatt) {
    return this.alias.isRegexpMode(idatt) ;
  }

  isActif(uriId) {
    this.alias.isActif(uriId);
  }

  setActiveAttribute(uriId,boolean,optional) {
    this.alias.setActiveAttribute(uriId,boolean,optional);
  }

  setFilterAttributes(SPARQLid,value,filter) {
    this.alias.setFilterAttributes(SPARQLid,value,filter);
  }

  setFilterLinkVariable(SPARQLid1,node2,SPARQLid2) {
    this.alias.setFilterLinkVariable(SPARQLid1,node2,SPARQLid2);
  }

  removeFilterLinkVariable(SPARQLid1) {
    this.alias.removeFilterLinkVariable(SPARQLid1);
  }

  getAttributesDisplaying() {
    return {} ;
  }

  getTextFillColor() { return 'darkmagenta'; }

  getTextStrokeColor() { return 'darkmagenta'; }

  getClassSVG() {
    return "AliasClass";
  }

  getRNode() { return 11; }

  toString() {
    return "AskomicsAliasNode >" + super.toString();
  }

}
