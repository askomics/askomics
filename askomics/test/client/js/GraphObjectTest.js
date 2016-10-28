/*jshint esversion: 6 */

describe('GraphObject', function(){
  let node = new GraphObject({uri:"http://wwww.system/test1",label:''});
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
      let elt=node.formatInHtmlLabelEntity();
      let waitValue="<em>HelloWorld<sub>16</sub></em>";
      chai.assert.isOk(node.formatInHtmlLabelEntity() === waitValue );
    });
    it('* getLabelIndex *', function(){
      node.SPARQLid = "HelloWorld16";
      let waitValue="16";
      chai.assert.isOk(node.getLabelIndex() === waitValue );
    });
    it('* getLabelIndexHtml *', function(){
      let waitValue='<tspan font-size="7" baseline-shift="sub">16</tspan>';
      waitValue += '<tspan constraint_node_id='+node.id+' font-size="8" dy="10" x="14"></tspan>' ;
      chai.assert.isOk(node.getLabelIndexHtml() === waitValue );
    });
    it('* removePrefix *', function(){
      chai.assert(new GraphObject({uri : "http://olala/olili#tst" }).removePrefix() === "tst","prefix have to be 'tst'");
      chai.assert(new GraphObject({uri : "http://olala/olili-tst" }).removePrefix("http://olala/olili-tst") === "//olala/olili-tst","prefix have to be '//olala/olili-tst'");
      chai.assert(new GraphObject({uri : "olala/olili-tst" }).removePrefix("olala/olili-tst") === "olala/olili-tst","prefix have to be 'olala/olili-tst'");
    });
    it('* URI *', function(){
      chai.assert(new GraphObject({uri : "http://olala/olili#tst" }).URI() === "<http://olala/olili#tst>","prefix have to be '<http://olala/olili#tst>'");
      chai.assert(new GraphObject({uri : ":tst" }).URI() === ":tst","prefix have to be 'tst'");
      chai.assert(new GraphObject({uri : ":test" }).URI(":tst") === ":tst","prefix have to be 'tst'");
      chai.assert(new GraphObject({uri : ":test" }).URI("http://olala/olili#tst") === "<http://olala/olili#tst>","prefix have to be '<http://olala/olili#tst>'");
      chai.expect(function () { new GraphObject({uri : ":test" }).URI(12) ; }).to.throw(/removePrefix: uri is not a string :/);
    });
  });
  describe('#JSON method', function(){
    it('* initializing object with json format *', function(){
      var n2 = {_uri:"http://wwww.system/test1",_label:'', _id: 15,  _SPARQLid: "HelloWorld16", _suggested: true };
      node.setjson(n2);
      chai.assert.deepEqual(node, n2);
    });
  });

  describe('#Attribute Graph Display methods', function(){
    it('* String output *', function(){
      var n1 = new GraphObject({uri:"http://wwww.system/test1",label:''});
      n1.id = 15;
      n1.SPARQLid = "HelloWorld16";
      n1.suggested = false;

      chai.assert.typeOf(n1.getOpacity(),'string');
      chai.assert.typeOf(n1.getTextOpacity(),'string');
      var n2 = new GraphObject({uri:"http://wwww.system/test1",label:''});
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
