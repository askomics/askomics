
describe('GraphObject', function(){
  var node = new GraphObject();
  describe('#Constructor', function(){
    it('* Attribuites *', function(){
      chai.assert.isNumber(node.id,'id is a number');
      chai.assert.typeOf(node.SPARQLid,'string');
      chai.assert.isBoolean(node.suggested,'suggested is a boolean');
      node.id = 15;
      chai.assert.isOk(node.id === 15);
      node.SPARQLid = "HelloWorld16";
      chai.assert(node.SPARQLid === "HelloWorld16");
      node.suggested = true;
      chai.assert.isOk(node.suggested);
    });
  });
  describe('#Convert methods displaying information object', function(){
    it('* formatInHtmlLabelEntity *', function(){
      var elt=node.formatInHtmlLabelEntity();
      var waitValue="<em>HelloWorld<sub>16</sub></em>";
      chai.assert.isOk(node.formatInHtmlLabelEntity() === waitValue );
    });
    it('* getLabelIndex *', function(){
      node.SPARQLid = "HelloWorld16";
      var waitValue="16";
      chai.assert.isOk(node.getLabelIndex() === waitValue );
    });
    it('* getLabelIndexHtml *', function(){
      var waitValue='<tspan font-size="7" baseline-shift="sub">16</tspan>';
      chai.assert.isOk(node.getLabelIndexHtml() === waitValue );
    });
  });
  describe('#JSON method', function(){
    it('* initializing object with json format *', function(){
      var n2 = new GraphObject();
      n2.id = 15;
      n2.SPARQLid = "HelloWorld16";
      n2.suggested = true;
      node.setjson(n2);
      chai.assert.deepEqual(node, { _id: 15,  _SPARQLid: "HelloWorld16", _suggested: true });
    });
  });

  describe('#Attribute Graph Display methods', function(){
    it('* String output *', function(){
      var n1 = new GraphObject();
      n1.id = 15;
      n1.SPARQLid = "HelloWorld16";
      n1.suggested = false;

      chai.assert.typeOf(n1.getOpacity(),'string');
      chai.assert.typeOf(n1.getTextOpacity(),'string');
      var n2 = new GraphObject();
      n2.id = 15;
      n2.SPARQLid = "HelloWorld16";
      n2.suggested = true;

      chai.assert.typeOf(n2.getOpacity(),'string');
      chai.assert.typeOf(n2.getTextOpacity(),'string');

      chai.assert.notEqual(n1.getOpacity(), n2.getOpacity(), 'Opacity Value are not equal');
      chai.assert.notEqual(n1.getTextOpacity(), n2.getTextOpacity(), 'Opacity Text Value are not equal');
    });
  });
});
