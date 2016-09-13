/*jshint esversion: 6 */

class AskomicsPositionableNode extends AskomicsNode {

  constructor(node,x,y) {
    super(node,x,y);
  }

  setjson(obj) {
    super.setjson(obj);
  }

  getPanelView(graphBuilder) {
    return new AskomicsPositionableNodeView(graphBuilder,this);
  }

  getTextFillColor() { return 'darkgreen'; }
  getTextStrokeColor() { return 'darkgreen'; }
  getNodeFillColor() { return 'darkgreen'; }

}
