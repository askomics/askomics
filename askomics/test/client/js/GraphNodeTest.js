
describe('GraphNode', function(){
  var node = new GraphNode({ _id: 15,  _SPARQLid: "HelloWorld16", _suggested: true }, 12.5,16.3);
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
      var n2 = new GraphNode({_id:15,_SPARQLid:"H12",suggested:true, nothing:'nothing'},34.2,24.5);
      node.setjson(n2);
      node.x = 12.2;
      node.y = 25.6;
      node.actif = true;
      chai.assert.deepEqual(node, { _id: 15,  _SPARQLid: "H12", _suggested: true,_x: 12.2, _y:25.6, _actif:true , _weight:0, _nlink : {}});
    });
  });
  describe('#Attribute Graph Display methods', function(){
    it('* String output *', function(){
      chai.assert.typeOf(node.getNodeStrokeColor(),'string');
      chai.assert.typeOf(node.getColorInstanciatedNode(),'string');
      chai.assert.typeOf(node.toString(),'string');
    });
  });
});
