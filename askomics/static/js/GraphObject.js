/*jshint esversion: 6 */

class GraphObject {
  constructor() {
    this._id        = -1;
    this._SPARQLid  = "";
    this._suggested = true ;
  }

  set id (__id) { this._id = __id; }
  get id () { return this._id; }

  set SPARQLid (__spq) { this._SPARQLid = __spq; }
  get SPARQLid () { return this._SPARQLid; }

  set suggested (__sug) { this._suggested = __sug; }
  get suggested () { return this._suggested; }

  setjson(obj) {
    this.id        = obj._id ;
    this.SPARQLid  = obj._SPARQLid ;
    this.suggested = obj._suggested;
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
    return '<tspan font-size="7" baseline-shift="sub">'+this.getLabelIndex()+"</tspan>";
  }

  getOpacity() { return this.suggested? "0.5" : "1"; }

  getTextOpacity() { return this.suggested? "0.3" : "1"; }

  toString() {
    let s = super.toString();
    return "< id:"+this.id+" ,"+"SPARQLid:"+this.SPARQLid+" ,"+"suggested:"+this.suggested + " >";
  }

}
