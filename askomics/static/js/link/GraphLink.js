/*jshint esversion: 6 */

class GraphLink {
  constructor(sourceN,targetN) {
    this.suggested = true ;
    this.source    = sourceN ;
    this.target    = targetN ;

    this.source.weight++;
    this.target.weight++;

    if ( ! (this.target.id in this.source.nlink) ) {
      this.source.nlink[this.target.id] = 0;
      this.target.nlink[this.source.id] = 0;
    }
    /* increment the number of link between the two nodes */
    this.source.nlink[this.target.id]++;
    this.target.nlink[this.source.id]++;

    this.linkindex = this.source.nlink[this.target.id];
  }

  getTextOpacity() { return this.suggested? "0.3" : "1"; }
  getLinkStrokeColor() { return 'grey'; }
  getTextFillColor() { return 'grey'; }

}
