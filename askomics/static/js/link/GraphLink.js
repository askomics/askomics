/*jshint esversion: 6 */

class GraphLink {
  constructor(sourceN,targetN) {
    this.id        = -1;
    this.SPARQLid  = "";
    this.suggested = true ;

    if ( sourceN ) {
      this.source    = sourceN ;
      this.source.weight++;
    } else {
      this.source = null ;
    }
    if (targetN) {
      this.target    = targetN ;
    } else {
      this.target = null ;
    }

    if ( sourceN && targetN ) {
      if ( ! (this.target.id in this.source.nlink) ) {
        this.source.nlink[this.target.id] = 0;
        this.target.nlink[this.source.id] = 0;
      }
      /* increment the number of link between the two nodes */
      this.source.nlink[this.target.id]++;
      this.target.nlink[this.source.id]++;

      this.linkindex = this.source.nlink[this.target.id];
    } else {
      this.linkindex = -1;
    }
  }

  setjson(obj) {
    this.id        = obj.id ;
    this.SPARQLid  = obj.SPARQLid ;
    this.suggested = obj.suggested;
    this.linkindex = obj.linkindex;

    let t = AskomicsGraphBuilder.findElt(graphBuilder.nodes(),obj.source.id);
    if (t[0]<0) {
      throw new Exception("Devel error: setjson : nodes have to be iniialized to define links.");
    }
    this.source    = t[1];
    t = AskomicsGraphBuilder.findElt(graphBuilder.nodes(),obj.target.id);
    if (t[0]<0) {
      throw new Exception("Devel error: setjson : nodes have to be iniialized to define links.");
    }
    this.target = t[1];
  }

  getTextOpacity() { return this.suggested? "0.3" : "1"; }
  getLinkStrokeColor() { return 'grey'; }
  getTextFillColor() { return 'grey'; }

}
