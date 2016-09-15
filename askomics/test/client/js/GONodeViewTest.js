/*jshint esversion: 6 */

describe('GONodeView', function(){
  describe('#Constructor/JSON', function(){
    it('* *', function(){
      let go = new GONode({ uri : '/test/uri/gonode' } ,0.0,0.0);
      let graphBuilder = new AskomicsGraphBuilder(new AskomicsUserAbstraction());
      let gov = new GONodeView(graphBuilder,go);
    });
  });
  describe('#configuration - static method', function(){
    it('* with good arg *', function(){
      chai.assert.notEqual(GONodeView.configuration('url_service'), 0);
      chai.assert.notEqual(GONodeView.configuration('number_char_search_allow'), 0);
    });
    it('* with bad arg *', function(){
      chai.expect(function () { GONodeView.configuration('TOTO');}).
        to.throw("GONodeView::configuration unkown keyword:TOTO");

    });
  });
});
