/*jshint esversion: 6 */
var userAbstraction = new AskomicsUserAbstraction();

describe('AskomicsForceLayoutManager', function(){
  describe('# methods', function(){
    it('*constructor *', function(){
      let fl = new AskomicsForceLayoutManager();
    });

    it('*getArrayForProposedUri (node) *', function(){
      let fl = new AskomicsForceLayoutManager();
      let tab = fl.getArrayForProposedUri("node");
      chai.assert.deepEqual(tab, []);
    });

    it('*getArrayForProposedUri (link) *', function(){
      let fl = new AskomicsForceLayoutManager();
      let tab = fl.getArrayForProposedUri("link");
      chai.assert.deepEqual(tab, []);
    });

    it('*getArrayForProposedUri (bidon) *', function(){
      let fl = new AskomicsForceLayoutManager();
      chai.expect(function () { let tab = fl.getArrayForProposedUri("bidon"); }).to.throw("AskomicsForceLayoutManager::getArrayForProposedUri Devel error => type !=node and link :bidon");
    });

    it('* offProposedUri *', function(){
      let fl = new AskomicsForceLayoutManager();
      fl.offProposedUri("node","uritest");
      fl.offProposedUri("link","uritest");

      fl.getArrayForProposedUri("node").push("uritest");
      fl.offProposedUri("node","uritest");

      fl.getArrayForProposedUri("link").push("uritest");
      fl.offProposedUri("link","uritest");

    });

    it('* onProposedUri *', function(){
      let fl = new AskomicsForceLayoutManager();
      fl.onProposedUri("node","uritest");
      fl.onProposedUri("link","uritest");

      fl.getArrayForProposedUri("node").push("uritest");
      fl.offProposedUri("node","uritest");

      fl.getArrayForProposedUri("link").push("uritest");
      fl.offProposedUri("link","uritest");

    });
    it('* isProposedUri node *', function(){
      let fl = new AskomicsForceLayoutManager();

      chai.assert.isOk(fl.isProposedUri("node","uritest"));
      fl.getArrayForProposedUri("node").push("uritest");
      chai.assert.isNotOk(fl.isProposedUri("node","uritest"));

    });
    it('* isProposedUri link *', function(){
      let fl = new AskomicsForceLayoutManager();

      chai.assert.isOk(fl.isProposedUri("link","uritest"));
      fl.getArrayForProposedUri("link").push("uritest");
      chai.assert.isNotOk(fl.isProposedUri("link","uritest"));

    });

    it('* fullsizeGraph *', function(){
      let fl = new AskomicsForceLayoutManager();
      fl.fullsizeGraph();
    });

    it('* normalsizeGraph *', function(){
      let fl = new AskomicsForceLayoutManager();
      fl.normalsizeGraph();
    });
    it('* fullsizeRightview *', function(){
      let fl = new AskomicsForceLayoutManager();
      fl.fullsizeRightview();
    });

    it('* normalsizeRightview *', function(){
      let fl = new AskomicsForceLayoutManager();
      fl.normalsizeRightview();
    });

    it('* unbindFullscreenButtons *', function(){
      let fl = new AskomicsForceLayoutManager();
      fl.unbindFullscreenButtons();
    });
    it('* colorSelectdObject *', function(){
      let fl = new AskomicsForceLayoutManager();
      fl.colorSelectdObject("prefix_test","id_test");
    });

    it('* updateInstanciateLinks *', function(){
      let json1 = { uri:"http://wwww.system/test1",_label:'',_id: 15,  _SPARQLid: "HelloWorldNode1", _suggested: false };
      var node1 = new GraphNode( json1 , 12.5,16.3);
      let json2 = { uri:"http://wwww.system/test2",_id: 16,  _SPARQLid: "HelloWorlNode2", _suggested: true };
      var node2 = new GraphNode(json2, 14.1,26.3);
      let link = new AskomicsLink({ uri:'<http://wwww.system/link1>'},node1,node2);

      let fl = new AskomicsForceLayoutManager();
      fl.updateInstanciateLinks([link]);

    });


/*
    it('* *', function(){
    });

*/
  });
});
