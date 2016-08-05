/*jshint esversion: 6 */

//define a positionable node
let PositionableNodeJSON = {
    "_id": 0,
    "_SPARQLid": "helloWorld",
    "_suggested": false,
    "_uri": "http://test.askomics#helloWorld",
    "_label": "helloWorld",
    "_actif": true,
    "_weight": 1,
    "_x": 0.0,
    "_y": 0.0,
    "_nlink": {},
    "_attributes": {},
    "_categories": {},
    "_filters": {},
    "_values": {},
    "_isregexp": {},
    "_inverseMatch": {},
    "_linkvar": {}
};


describe('AskomicsPositionableNode', function(){
  describe('#Constructor/JSON', function(){
    it('* test all methods *', function(){
      let positionableNode = new AskomicsPositionableNode({uri:"http://wwww.system/test1"},0.0,0.0);
      positionableNode.setjson(PositionableNodeJSON);
      chai.assert.deepEqual(positionableNode, PositionableNodeJSON);
    });
  });

  describe('#Attribute Graph Display methods', function(){
    it('* String output *', function(){
      let nodeEmpty = new AskomicsPositionableNode({ label:"helloWorld", uri:"/huoulu/lolo/dddddd#", _id: 15,  _SPARQLid: "HelloWorld16", _suggested: true }, 12.5,16.3);
      chai.assert.typeOf(nodeEmpty.getTextFillColor(),'string');
      chai.assert.typeOf(nodeEmpty.getTextStrokeColor(),'string');
      chai.assert.typeOf(nodeEmpty.getNodeFillColor(),'string');
    });
  });
});
