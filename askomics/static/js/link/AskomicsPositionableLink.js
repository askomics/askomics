/*jshint esversion: 6 */

class AskomicsPositionableLink extends AskomicsLink {

  constructor(uriL,sourceN,targetN) {
    super(uriL,sourceN,targetN);
    
    this.type     = 'included' ;
    this.label    = 'included in';
    this.sameTax  =  true ;
    this.sameRef  =  true ;
    this.strict   =  true ;
  }

  getPanelView() {
    return new AskomicsPositionableLinkView(this);
  }

  getFillColor() { return 'darkgreen'; }

}
