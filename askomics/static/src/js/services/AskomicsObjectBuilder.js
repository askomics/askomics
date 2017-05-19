/*jshint esversion: 6 */

class AskomicsObjectBuilder {

  constructor() {
  }

  static instanceNode(node,x,y) {
    if ( __ihm.getAbstraction().isPositionable(node.uri) ) {
      return new AskomicsPositionableNode(node,x,y);
    } else if ( 'alias' in node ) {
      return new AskomicsAliasNode(node,x,y);
    } else {
      return new AskomicsNode(node,x,y);
    }
    return null;
  }

  static instanceLink(linkbase,source,target) {
    let link = new AskomicsLink(linkbase,source,target);
    return link ;
  }
}
