/*jshint esversion: 6 */

class AskomicsNode extends GraphNode {

  constructor(node,x,y) {
    super(node,x,y);
    this._attributes = {} ;
    this._categories = {} ;
    this._filters    = {} ; /* filters of attributes key:sparqlid*/
    this._values     = {} ; /* values of attributes key:sparqlid*/
    return this;
  }

  getPanelView() {
    return new AskomicsAttributesView(this);
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
