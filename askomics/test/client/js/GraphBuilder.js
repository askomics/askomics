
describe('true', function () {
       it('should be true', function () {
          var v = new AskomicsGraphBuilder();
          true.should.equal(true);
          chai.assert.isOk(v.IDgeneration === 0);
       });
   });
