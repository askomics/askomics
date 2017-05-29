/*jshint esversion: 6 */

class AskomicsPositionableNode extends AskomicsNode {

  constructor(node,x,y) {
    super(node,x,y);
    this._positionable = true;
  }

  setjson(obj) {
    super.setjson(obj);
  }

  getTextFillColor() { return 'darkgreen'; }
  getTextStrokeColor() { return 'darkgreen'; }
  getNodeFillColor() { return 'darkgreen'; }

}
