/*jshint esversion: 6 */

class AskomicsObjectBuilder {

  constructor(objet) {
  }

  static instanceNode(node,x,y) {
    if ( userAbstraction.isPositionable(node.uri) ) {
      return new AskomicsPositionableNode(node,x,y);
    } else if (userAbstraction.isGoterm(node.uri)) {
      return new GONode(node,x,y);
    } else {
      return new AskomicsNode(node,x,y);
    }
    return null;
  }

  static instanceLink(linkbase,source,target) {
    let link = null;
    if (userAbstraction.isGoterm(source.uri) || userAbstraction.isGoterm(target.uri)) {
      link = new GOLink(linkbase,source,target);
    } else {
      link = new AskomicsLink(linkbase,source,target);
    }
    return link ;
  }
}
