/*jshint esversion: 6 */
function set_varglob() {
  graphBuilder = new AskomicsGraphBuilder();
  /* To manage the D3.js Force Layout  */
  //forceLayoutManager = new AskomicsForceLayoutManager();
  /* To manage information about User Datasrtucture  */
  //userAbstraction = new AskomicsUserAbstraction();
  /* To manage information about menu propositional view */
  //menuView = new AskomicsMenuView();
  /* To manage information about File menu */
  //menuFile = new AskomicsMenuFile();
}

set_varglob();

describe('AskomicsLink', function(){

  let json1 = { uri:"http://wwww.system/test1",_label:'',_id: 15,  _SPARQLid: "HelloWorldNode1", _suggested: false };
  var node1 = new GraphNode( json1 , 12.5,16.3);
  let json2 = { uri:"http://wwww.system/test2",_id: 16,  _SPARQLid: "HelloWorlNode2", _suggested: true };
  var node2 = new GraphNode(json2, 14.1,26.3);
  node1.setjson(json1);
  node2.setjson(json2);
  /*
  var link = new AskomicsLink({ uri:'http://wwww.system/link1'},node1,node2);
  var link2 = new AskomicsLink({ uri:'http://wwww.system/link2'},null,node2);
  var link3 = new AskomicsLink({ uri:'http://wwww.system/link3'},node1,null);
  */

  describe('#Constructor/JSON', function(){
    it('*  *', function(){
      graphBuilder.nodes().push(node1);
      graphBuilder.nodes().push(node2);
      let linkJSON ;
      let link = new AskomicsLink({ uri:'http://wwww.system/link1'},node1,node2);
      chai.expect(function () { link.setjson({});}).
        to.throw("Devel error: setjson : obj have no _source/_target property : {}");
      chai.expect(function () { link.setjson({_source: {} , _target: {}});}).
        to.throw("Devel error: setjson : obj._source have no id property : {\"_source\":{},\"_target\":{}}");

      let resAtt = {
        "_source":
          {"_id":15,"_SPARQLid":"HelloWorldNode1","_suggested":false,"_label":"","_nlink":{"16":1}},
        "_target":
          {"_id":16,"_SPARQLid":"HelloWorlNode2","_suggested":true,"_nlink":{"15":1}},
        "_transitive":false,
        "_negative":false
      } ;
      link.setjson(resAtt);
      //chai.assert.deepEqual(link, resAtt);
    });
  });
  describe('#getPanelView', function(){
    it('* test type *', function(){
      let link = new AskomicsLink({ uri:'<http://wwww.system/link1>'},node1,node2);
      let panel = link.getPanelView();
      chai.expect(panel).to.be.an.instanceof(AskomicsLinkView);
    });
  });
  describe('#buildConstraintsSPARQL', function(){
    it('* simple build *', function(){
      let link = new AskomicsLink({ uri:'<http://wwww.system/link1>'},node1,node2);
      let constraints;

      link.transitive = false ;
      link.negative = false ;
      constraints = link.buildConstraintsSPARQL();
      chai.assert.deepEqual(constraints, [["?URIHelloWorldNode1 <http://wwww.system/link1> ?URIHelloWorlNode2"],""]);
      link.transitive = true ;
      link.negative = false ;
      constraints = link.buildConstraintsSPARQL();
      chai.assert.deepEqual(constraints, [["?URIHelloWorldNode1 <http://wwww.system/link1>+ ?URIHelloWorlNode2"],""]);
      link.transitive = false ;
      link.negative = true ;
      constraints = link.buildConstraintsSPARQL();
      chai.assert.deepEqual(constraints, [[["?URIHelloWorldNode1 <http://wwww.system/link1> ?URIHelloWorlNode2"],"FILTER NOT EXISTS"],""]);
      link.transitive = true ;
      link.negative = true ;
      constraints = link.buildConstraintsSPARQL();
      chai.assert.deepEqual(constraints, [[["?URIHelloWorldNode1 <http://wwww.system/link1>+ ?URIHelloWorlNode2"],"FILTER NOT EXISTS"],""]);
    });
  });
  describe('#instanciateVariateSPARQL', function(){
    it('* empty *', function(){
      let link = new AskomicsLink({ uri:'http://wwww.system/link1'},node1,node2);
      let variates = [];
      link.instanciateVariateSPARQL(variates);
      chai.assert.deepEqual(variates, []);
    });
  });
});
