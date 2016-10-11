/*jshint esversion: 6 */

describe('GOParameterView', function(){
  describe('#Constructor', function(){
    it('* *', function(){
      let gop = new GOParametersView();
    });
  });
  describe('#configuration - static method', function(){
    it('* with good arg *', function(){
      chai.assert.notEqual(new GOParametersView().configuration('url_service'), 0);
      chai.assert.notEqual(new GOParametersView().configuration('number_char_search_allow'), 0);
    });
    it('* with bad arg *', function(){
      chai.expect(function () { new GOParametersView().configuration('TOTO');}).
        to.throw("GOParametersView::configuration unkown keyword:TOTO");

    });
  });
});
