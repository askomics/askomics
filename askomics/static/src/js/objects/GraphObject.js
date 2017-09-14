/*jshint esversion: 6 */

class GraphObject {
  constructor(obj) {

    if ( !obj || (! ('uri' in obj)) ) {
    /*  if ( obj && ('_uri' in obj) ) {
        // load json object
        this.setjson(obj);
      } else*/
        throw "GraphObject : Constructor need an 'uri' node:"+JSON.stringify(obj);
    }

    this._id        = -1;
    this._SPARQLid  = "";
    this._suggested = true ;
    this._uri       = obj.uri ;

    if ( obj.label ) {
      this._label   = obj.label ;
    } else {
      this._label   = this.removePrefix();
    }
  }

  set id (__id) { this._id = __id; }
  get id () { return this._id; }

  set SPARQLid (__spq) { this._SPARQLid = __spq; }
  get SPARQLid () { return this._SPARQLid; }

  set suggested (__sug) { this._suggested = __sug; }
  get suggested () { return this._suggested; }

  set uri (__uri) { this._uri = __uri; }
  get uri () { return this._uri; }

  set label (__label) { this._label = __label; }
  get label () { return this._label; }


  setjson(obj) {
    this.id        = obj._id ;
    this.SPARQLid  = obj._SPARQLid ;
    this.suggested = obj._suggested;
    this.uri       = obj._uri ;
    this.label     = obj._label ;
  }

  URI(uristring) {
    let uribase = this.uri;

    if ( uristring )
      uribase = uristring ;

    if ( typeof(uribase) !== "string" ) {
      throw "removePrefix: uri is not a string :"+JSON.stringify(uribase);
    }

    let idx = uribase.indexOf('position_');

    if ( idx>0 ) {
      let property = uribase.substring(idx+'position_'.length);
      if (property == "start") return "faldo:location/faldo:begin/faldo:position";
      if (property == "end") return "faldo:location/faldo:end/faldo:position";
      if (property == "ref") return "faldo:location/faldo:begin/faldo:reference";
    }
    if ( uribase.indexOf("#")>0 || uribase.indexOf("/")>0) {
      return '<'+uribase+">";
    }
    return uribase;
  }

  /* Get value of an attribut with RDF format like rdfs:label */
  removePrefix() {
      if (typeof(this.uri) !== 'string') {
        throw new Exception("uri is not a string :"+JSON.stringify(this.uri));
      }
      let idx =  this.uri.indexOf("#");
      if ( idx == -1 ) {
        idx =  this.uri.indexOf(":");
        if ( idx == -1 ) {
          return this.uri;
        }
      }
      let name = this.uri.substr(idx+1,this.uri.length);
      let longPref = this.uri.substr(0,idx);
      let shortPref = __ihm.getAbstraction().getReversePrefix(longPref);
      if ( shortPref !== '' ) shortPref = shortPref + ":" ;
      return shortPref + name;
  }

  formatInHtmlLabelEntity() {
    let re = new RegExp(/(\d+)$/);
    let indiceEntity = this.SPARQLid.match(re);
    if ( indiceEntity === null || indiceEntity.length <= 0 )
      indiceEntity = [""];
    let labelEntity = this.SPARQLid.replace(re,"");
    //return $('<em></em>').text(labelEntity).append($('<sub></sub>').text(indiceEntity[0]));
    return "<em>"+ labelEntity + "<sub>"+ indiceEntity[0] +"</sub>"+"</em>";
  }

  static getSvgLabelPrefix() {
      return "label-svg-";
  }

  getSvgLabelId() {
      return GraphObject.getSvgLabelPrefix()+this.id;
  }

  /*
    return the index name of the node to set up and update the graph
  */
  getLabelIndex() {
    if ( this.SPARQLid === "" ) return "";

    let re = new RegExp(/(\d+)$/);
    let indiceEntity = this.SPARQLid.match(re);

    if ( indiceEntity && indiceEntity.length>0 )
        return indiceEntity[0];
    else
        return "";
  }

  getLabelIndexHtml() {
    let v = '<tspan font-size="7" baseline-shift="sub">'+this.getLabelIndex()+"</tspan>";
    v += '<tspan constraint_node_id='+this.id+' font-size="8" dy="10" x="14"></tspan>' ;
    return v;
  }

  getOpacity() { return this.suggested? "0.5" : "1"; }

  getTextOpacity() { return this.suggested? "0.3" : "1"; }

  toString() {
    let s = super.toString();
    return "< id:"+this.id+" ,"+"uri:"+this.uri+" ,"+"label:"+this.label+" ,"+"SPARQLid:"+this.SPARQLid+" ,"+"suggested:"+this.suggested + " >";
  }

  getPanelView() {
    return new AskomicsPanelViewBuilder().getPanelView(this) ;
  }
}
