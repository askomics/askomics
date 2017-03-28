/*jshint esversion: 6 */

const colorPalette  = ["yellowgreen","teal","paleturquoise","peru","tomato","steelblue","lightskyblue","lightcoral"];

var idxColorPalette = 0  ;
var colorUriList    = {} ;

class GraphNode extends GraphObject {
  constructor(node,x,y) {
    super(node);
    this.init();
    /* if this future node have the same coordinate with the previous node, the graph move too much ! */
    var sc = 30;
    var scaleX = Math.random()<0.5?-1:1;
    var scaleY = Math.random()<0.5?-1:1;
    this.x = x+scaleX*sc;
    this.y = y+scaleY*sc;

    return this;
  }

  getType() {
    return "node";
  }

  init() {
    this.actif        = false ;
    this.weight       = 0;
    this.x            = 0;
    this.y            = 0;
    this.nlink        = {}; // number of relation with a node.
  }

  set actif  (__actif) { this._actif = __actif; }
  get actif () { return this._actif; }

  set weight  (__weight) { this._weight = __weight; }
  get weight () { return this._weight; }

  set x  (__x) { this._x = __x; }
  get x () { return this._x; }

  set y  (__y) { this._y = __y; }
  get y () { return this._y; }

  set nlink (nlink) { this._nlink = nlink; }
  get nlink () { return this._nlink; }

  setjson(obj) {
    super.setjson(obj);

    this._actif = obj._actif;
    this._x = obj._x;
    this._y = obj._y;
    this._weight=obj._weight;
    this._nlink=$.extend(true, {}, obj._nlink);
  }

  switchActiveNode() {
        this.actif = !this.actif ;
  }

  /* Build attribute with id, sparId inside a node from a generic uri attribute */
  setAttributeOrCategoryForNode(AttOrCatArray,attributeForUri) {
    AttOrCatArray[attributeForUri.uri] = {} ;
    AttOrCatArray[attributeForUri.uri].uri       = attributeForUri.uri ;
    AttOrCatArray[attributeForUri.uri].type      = attributeForUri.type ;
    AttOrCatArray[attributeForUri.uri].basic_type  = attributeForUri.basic_type ;
    AttOrCatArray[attributeForUri.uri].label     = attributeForUri.label ;

    __ihm.getGraphBuilder().setSPARQLVariateId(AttOrCatArray[attributeForUri.uri]);
    AttOrCatArray[attributeForUri.uri].id=__ihm.getGraphBuilder().getId();

    /* by default all attributes is ask */
    AttOrCatArray[attributeForUri.uri].actif = false ;

    return AttOrCatArray[attributeForUri.uri];
  }

  buildAttributeOrCategoryForNode(attributeForUri) {

    if (attributeForUri.basic_type === "category") {
      return this.setAttributeOrCategoryForNode(this.categories,attributeForUri);
    }else {
      return this.setAttributeOrCategoryForNode(this.attributes,attributeForUri);
    }
  }

  getAttributeOrCategoryForNode(attributeForUri) {
    if (attributeForUri.basic_type === "category" ) {
      if (attributeForUri.uri in this.categories ) {
        return this.categories[attributeForUri.uri];
      }
      return this.buildAttributeOrCategoryForNode(attributeForUri);
    } else {
      if (attributeForUri.uri in this.attributes) {
        return this.attributes[attributeForUri.uri];
     }
      return this.buildAttributeOrCategoryForNode(attributeForUri);
    }
  }

  getNodeStrokeColor() { return 'grey'; }

  getClassSVG() { return "Class"; }

  getSizeText() { return 14; }

  getColorInstanciatedNode() {

    if ( this.uri in colorUriList ) {
      return colorUriList[this.uri];
    }

    colorUriList[this.uri] = colorPalette[idxColorPalette++];
    if (idxColorPalette >= colorPalette.length) idxColorPalette = 0;
    return colorUriList[this.uri];
  }

  toString() {
    let s = super.toString();
    return " GraphNode ("+ s + ")";
  }

}
