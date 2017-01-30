/*jshint esversion: 6 */
/*jshint multistr:true */

describe('AskomicsUserAbstraction', function () {
  describe('#Constructor/JSON', function(){
    it('* constructor *', function(){
      let r = new AskomicsUserAbstraction();
    });
  });

  describe('#Accessors', function(){
      it('* getEntities *', function(){
        new AskomicsUserAbstraction().getEntities();
      });
      it('* getAttributesEntity *', function(){
        new AskomicsUserAbstraction().getAttributesEntity();
      });
      it('* getPositionableEntities *', function(){
        new AskomicsUserAbstraction().getPositionableEntities();
      });

  describe('#loadUserAbstraction', function(){
    it('* *', function(){
      new AskomicsUserAbstraction().loadUserAbstraction();

      console.log(location.pathname+":"+new AskomicsUserAbstraction().getEntities());
      console.log(location.pathname+":"+new AskomicsUserAbstraction().getAttributesEntity("transcript"));
      console.log(location.pathname+":"+JSON.stringify(new AskomicsUserAbstraction().getPositionableEntities()));
    });
  });
  });
});
