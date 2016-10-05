/*jshint esversion: 6 */

class GraphLink extends GraphObject {
  constructor(link,sourceN,targetN) {
    super(link);

    this.linkindex = -1;

    if ( sourceN && sourceN !== null ) {
      this.source    = sourceN ;
      //this.source.weight++;
    } else {
      this.source = null ;
    }
    if ( targetN && targetN !== null) {
      this.target    = targetN ;
    } else {
      this.target = null ;
    }

    if ( this.source !== null && this.target !== null ) {
      if ( ! (this.target.id in this.source.nlink) ) {
        this.source.nlink[this.target.id] = 0;
        this.target.nlink[this.source.id] = 0;
      }
      /* increment the number of link between the two nodes */
      this.source.nlink[this.target.id]++;
      this.target.nlink[this.source.id]++;

      this.linkindex = this.source.nlink[this.target.id];
    }
  }

  getType() {
    return "link";
  }

  set source  (__source) { this._source = __source; }
  get source () { return this._source; }

  set target  (__target) { this._target = __target; }
  get target () { return this._target; }

  set linkindex  (__linkindex) { this._linkindex = __linkindex; }
  get linkindex () { return this._linkindex; }

  setjson(obj) {
    super.setjson(obj);
    this.linkindex = obj._linkindex;

    if (! (('_source' in obj) || ('_target' in obj) ) ) {
      throw "Devel error: setjson : obj have no _source/_target property : "+JSON.stringify(obj);
    }

    if (! ('_id' in obj._source) ) {
      throw "Devel error: setjson : obj._source have no id property : "+JSON.stringify(obj);
    }

    if (! ('_id' in obj._target) ) {
      throw "Devel error: setjson : obj._target have no id property : "+JSON.stringify(obj);
    }

    let t = AskomicsGraphBuilder.findElt(new AskomicsGraphBuilder().nodes(),obj._source._id);
    if (t[0]<0) {
      throw "Devel error: setjson : nodes have to be initialized to define links.";
    }

    this.source    = t[1];

    t = AskomicsGraphBuilder.findElt(new AskomicsGraphBuilder().nodes(),obj._target._id);
    if (t[0]<0) {
      throw "Devel error: setjson : nodes have to be initialized to define links.";
    }
    this.target = t[1];
  }

  getLinkStrokeColor() { return 'grey'; }
  getTextFillColor() { return 'grey'; }

  toString() {
    let s = super.toString();
    return " GraphLink ("+ s + ")";
  }

}
