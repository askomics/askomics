/*jshint esversion: 6 */

class AskomicsObjectBuilder {

  constructor() {
  }

  static instanceNode(node,x,y) {
    if ( new AskomicsUserAbstraction().isPositionable(node.uri) ) {
      return new AskomicsPositionableNode(node,x,y);
    } else if (new AskomicsUserAbstraction().isGoterm(node.uri)) {
      return new GONode(node,x,y);
    } else {
      return new AskomicsNode(node,x,y);
    }
    return null;
  }

  static instanceLink(linkbase,source,target) {
    let link = null;
    if (new AskomicsUserAbstraction().isGoterm(source.uri) || new AskomicsUserAbstraction().isGoterm(target.uri)) {
      link = new GOLink(linkbase,source,target);
    } else {
      link = new AskomicsLink(linkbase,source,target);
    }
    return link ;
  }
}
