/*jshint esversion: 6 */

describe('GraphLink', function(){
  var node1 = new GraphNode({ uri:"http://wwww.system/test1",label:'',_id: 15,  _SPARQLid: "HelloWorldNode1", _suggested: false }, 12.5,16.3);
  var node2 = new GraphNode({ uri:"http://wwww.system/test2",_id: 16,  _SPARQLid: "HelloWorlNode2", _suggested: true }, 14.1,26.3);

  var link = new GraphLink({ uri:'http://wwww.system/link1'},node1,node2);
  var link2 = new GraphLink({ uri:'http://wwww.system/link2'},null,node2);
  var link3 = new GraphLink({ uri:'http://wwww.system/link3'},node1,null);
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
      var node1 = new GraphNode({ uri:"http://wwww.system/test1",label:'n1', _id: 15,  _SPARQLid: "HelloWorldNode1", _suggested: false }, 12.5,16.3);
      var node2 = new GraphNode({ uri:"http://wwww.system/test1",label:'n2', _id: 16,  _SPARQLid: "HelloWorlNode2", _suggested: true }, 14.1,26.3);
      var l = new GraphLink({ uri:"http://wwww.system/test1",label:'l1'}, node1,node2);
      chai.expect(function () { link.setjson(l,new AskomicsGraphBuilder()); }).to.throw("Devel error: setjson : nodes have to be initialized to define links.");
      link.source.x = 1.0;
      link.source.y = 2.0;
      link.target.x = 3.0;
      link.target.y = 4.0;
      var expectedLink = {
        _label: "l1",
        _uri  : "http://wwww.system/test1",
        _SPARQLid: "",
        _id: -1,
        _linkindex: 1,
        _source: {
          _uri:"http://wwww.system/test1",
          _label:'n1',
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
          _uri:"http://wwww.system/test1",
          _label:'n2',
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

    //  chai.assert.deepEqual( link, expectedLink );
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
