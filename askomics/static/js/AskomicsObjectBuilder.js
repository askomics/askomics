/*jshint esversion: 6 */

class AskomicsObjectBuilder {

  constructor() {
  }

  static instanceNode(_userAbstraction,node,x,y) {
    if ( _userAbstraction.isPositionable(node.uri) ) {
      return new AskomicsPositionableNode(node,x,y);
    } else if (_userAbstraction.isGoterm(node.uri)) {
      return new GONode(node,x,y);
    } else {
      return new AskomicsNode(node,x,y);
    }
    return null;
  }

  static instanceLink(_userAbstraction,linkbase,source,target) {
    let link = null;
    if (_userAbstraction.isGoterm(source.uri) || _userAbstraction.isGoterm(target.uri)) {
      link = new GOLink(linkbase,source,target);
    } else {
      link = new AskomicsLink(linkbase,source,target);
    }
    return link ;
  }
}
