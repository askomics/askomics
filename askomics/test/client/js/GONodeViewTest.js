/*jshint esversion: 6 */

describe('GONodeView', function(){
  describe('#Constructor', function(){
    it('* *', function(){
      let go = new GONode({ uri : '/test/uri/gonode' } ,0.0,0.0);
      let gov = new GONodeView(go);
    });
  });

  describe('#upload_go_description', function(){
    it('* *', function(){
      let go = new GONode({ uri : '/test/uri/gonode' } ,0.0,0.0);
      let gov = new GONodeView(go);
      gov.upload_go_description("aaaaaaaaaaaaaaa");
    });
  });
});
