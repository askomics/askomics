/*jshint esversion: 6 */

describe('AskomicsLinkView', function(){
  let json1 = { uri:"http://wwww.system/test1",_label:'',_id: 15,  _SPARQLid: "HelloWorldNode1", _suggested: false };
  var node1 = new GraphNode( json1 , 12.5,16.3);
  let json2 = { uri:"http://wwww.system/test2",_id: 16,  _SPARQLid: "HelloWorlNode2", _suggested: true };
  var node2 = new GraphNode(json2, 14.1,26.3);
  node1.setjson(json1);
  node2.setjson(json2);

  describe('#Constructor/JSON', function(){
    it('* constructor empty link *', function(){
      let view = new AskomicsLinkView({});
    });

    it('* constructor with link *', function(){
      let link = new AskomicsLink({ uri:'http://wwww.system/link1'},node1,node2);
      let view = new AskomicsLinkView(link);
    });
  });

  describe('#display_help', function(){
    it('*  *', function(){
      let link = new AskomicsLink({ uri:'http://wwww.system/link1'},node1,node2);
      let view = new AskomicsLinkView(link);
      chai.expect(function () {  view.display_help();}).
        to.throw("undefined is not a function (evaluating '$('#modal').modal('show')')");
    });
  });

  describe('#getTextColorLabel', function(){
    it('*  *', function(){
      let link = new AskomicsLink({ uri:'http://wwww.system/link1'},node1,node2);
      let view = new AskomicsLinkView(link);

      chai.assert(view.getTextColorLabel(),link.getTextFillColor());
    });
    it('* negative  *', function(){
      let link = new AskomicsLink({ uri:'http://wwww.system/link1'},node1,node2);
      let view = new AskomicsLinkView(link);
      link.negative = true;
      chai.assert.isOk(view.getTextColorLabel() === LINKVIEW_NEGATIVE_COLOR_TEXT);
    });
  });

  describe('#', function(){
    it('*  *', function(){
    });
  });

});
