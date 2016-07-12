/*jshint esversion: 6 */

class AskomicsPositionableNode extends AskomicsNode {

  constructor(node,x,y) {
    super(node,x,y);
  }

  getPanelView() {
    return new AskomicsPositionableNodeView(this);
  }

  getTextFillColor() { return 'darkgreen'; }
  getTextStrokeColor() { return 'darkgreen'; }
  getNodeFillColor() { return 'darkgreen'; }

}
