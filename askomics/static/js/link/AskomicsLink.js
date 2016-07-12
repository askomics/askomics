/*jshint esversion: 6 */

class AskomicsLink extends GraphLink {

  constructor(uriL,sourceN,targetN) {
    super(sourceN,targetN);
    
    this.uri = uriL ;
    this.label = userAbstraction.removePrefix(this.uri);
  }

  getPanelView() {
    return new AskomicsLinkView(this);
  }
}
