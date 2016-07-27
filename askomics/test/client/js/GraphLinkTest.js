describe('GraphLink', function(){
  var node1 = new GraphNode({ _id: 15,  _SPARQLid: "HelloWorldNode1", _suggested: false }, 12.5,16.3);
  var node2 = new GraphNode({ _id: 16,  _SPARQLid: "HelloWorlNode2", _suggested: true }, 14.1,26.3);
  var link = new GraphLink(node1,node2);
  var link2 = new GraphLink(null,node2);
  var link3 = new GraphLink(node1,null);
  describe('#Constructeur empty', function(){
    it('* test all methods *', function(){

      chai.assert.isNumber(link.linkindex,'x is a number');

      chai.assert.deepEqual(link.source, node1);
      chai.assert.deepEqual(link.target, node2);

      chai.assert.deepEqual(link2.source, null);
      chai.assert.deepEqual(link2.target, node2);

      chai.assert.deepEqual(link3.source, node1);
      chai.assert.deepEqual(link3.target, null);

      link.linkindex = 10;
      chai.assert( link.linkindex === 10 );
      link.source = node2;
      chai.assert.deepEqual(link.source, node2);

      link.source = node1;
    });
  });
  describe('#JSON method', function(){
    it('* initializing object with json format *', function(){
      var node1 = new GraphNode({ _id: 15,  _SPARQLid: "HelloWorldNode1", _suggested: false }, 12.5,16.3);
      var node2 = new GraphNode({ _id: 16,  _SPARQLid: "HelloWorlNode2", _suggested: true }, 14.1,26.3);
      var l = new GraphLink(node1,node2);
      chai.expect(function () { link.setjson(l); }).to.throw("Devel error: setjson : graphBuilder is not instancied!");
      link.source.x = 1.0;
      link.source.y = 2.0;
      link.target.x = 3.0;
      link.target.y = 4.0;
      var expectedLink = {
        _SPARQLid: "",
        _id: -1,
        _linkindex: 1,
        _source: {
          _SPARQLid: "HelloWorldNode1",
          _actif: false,
          _id: 15,
          _nlink: {
            16: 1
          },
          _suggested: false,
          _weight: 2,
          _x: 1.0,
          _y: 2.0,
        },
        _suggested: true,
        _target: {
          _SPARQLid: "HelloWorlNode2",
          _actif: false,
          _id: 16,
          _nlink: {
            15: 1
          },
          _suggested: true,
          _weight: 0,
          _x: 3.0,
          _y: 4.0
        }
      };

      chai.assert.deepEqual( link, expectedLink );
    });
  });
  describe('#Attribute Graph Display methods', function(){
    it('* String output *', function(){
      chai.assert.typeOf(link.getLinkStrokeColor(),'string');
      chai.assert.typeOf(link.getTextFillColor(),'string');
      chai.assert.typeOf(link.toString(),'string');
    });
  });
});
