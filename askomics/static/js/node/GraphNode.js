/*jshint esversion: 6 */

const colorPalette  = ["yellowgreen","teal","paleturquoise","peru","tomato","steelblue","lightskyblue","lightcoral"];

var idxColorPalette = 0  ;
var colorUriList    = {} ;

class GraphNode {
  constructor(node,x,y) {

    for (var prop in node) {
      if (node.hasOwnProperty(prop)) {
          this[prop] = node[prop];
        }
    }

    this.suggested    = true;
    this.actif        = false ;
    /* if this future node have the same coordinate with the previous node , the graphe move too much ! */
    var sc = 30;
    var scaleX = Math.random()<0.5?-1:1;
    var scaleY = Math.random()<0.5?-1:1;
    this.x = x+scaleX*sc;
    this.y = y+scaleY*sc;
    this.weight     = 0;
    this._nlink     = {}; // number of relation with a node.

    return this;
  }

  set nlink (nlink) { this._nlink = nlink; }
  get nlink () { return this._nlink; }

  toString() {
    return " GraphNode ";
  }

  getOpacity() { return this.suggested? "0.5" : "1"; }
  getNodeStrokeColor() { return 'grey'; }

  getColorInstanciatedNode() {

    if ( this.uri in colorUriList ) {
      return colorUriList[this.uri];
    }

    colorUriList[this.uri] = colorPalette[idxColorPalette++];
    if (idxColorPalette >= colorPalette.length) idxColorPalette = 0;
    return colorUriList[this.uri];
  }

}
