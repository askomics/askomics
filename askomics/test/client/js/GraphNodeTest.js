/*jshint esversion: 6 */

describe('GraphNode', function(){
  let node = new GraphNode({ uri:"http://wwww.system/test1",label:'node1',_id: 15,  _SPARQLid: "HelloWorld16", _suggested: true }, 12.5,16.3);
  describe('#Constructeur empty', function(){
    it('* test all methods *', function(){

      chai.assert.isNotOk(node.actif);

      chai.assert.isNumber(node.x,'x is a number');
      node.x = 12.2;
      chai.assert(node.x === 12.2);
      chai.assert.isNumber(node.y,'y is a number');
      node.y = 25.6;
      chai.assert(node.y === 25.6);
      chai.assert.isNumber(node.weight,'y is a number');
      chai.assert.deepEqual(node.nlink, { });

      node.actif = true;
      chai.assert.isOk(node.actif);
    });
  });
  describe('#JSON method', function(){
    it('* initializing object with json format *', function(){
      var n2 = {_uri:"http://wwww.system/test1",_label:'node1',_id:15,_SPARQLid:"H12",_suggested:true, _nothing:'nothing', _weight:0, _nlink : {} };
      node.setjson(n2);
      node.x = 12.2;
      node.y = 25.6;
      node.actif = true;
      chai.assert.deepEqual(node, {_uri:"http://wwww.system/test1",_label:'node1', _id: 15,  _SPARQLid: "H12", _suggested: true,_x: 12.2, _y:25.6, _actif:true , _weight:0, _nlink : {}});
    });
  });
  describe('#Attribute Graph Display methods', function(){
    it('* String output *', function(){
      chai.assert.typeOf(node.getNodeStrokeColor(),'string');
      chai.assert.typeOf(node.getColorInstanciatedNode(),'string');
      chai.assert.typeOf(node.toString(),'string');
    });
  });
  describe('#Switch active node', function(){
    it('*  *', function(){
      node.switchActiveNode();
      chai.assert.isNotOk(node.actif);
      node.switchActiveNode();
      chai.assert.isOk(node.actif);
    });
  });
  describe('#Manage Attributes/Categories', function(){
    it('* setAttributeOrCategoryForNode *', function(){
      node.setAttributeOrCategoryForNode(this.attributes,"test");
      node.setAttributeOrCategoryForNode(this.categories,"test2");
    });
    it('* buildAttributeOrCategoryForNode *', function(){
      chai.assert.isOk(false);
    });
    it('* getAttributeOrCategoryForNode *', function(){
      chai.assert.isOk(false);
    });
    it('* getTypeAttribute *', function(){
      chai.expect(function () { node.getTypeAttribute("anything");}).
        to.throw("GraphNode::Unknown type:"+"anything");
      chai.assert(node.getTypeAttribute("http://www.w3.org/2001/XMLSchema#decimal") == "decimal");
      chai.expect(function () { node.getTypeAttribute("decimal");}).
        to.throw("GraphNode::Unknown type:"+"decimal");
      chai.assert(node.getTypeAttribute("http://www.w3.org/2001/XMLSchema#string") == "string");
      chai.expect(function () { node.getTypeAttribute("string");}).
        to.throw("GraphNode::Unknown type:"+"string");
    });
  });

});
