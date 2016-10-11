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

/*
      $.ajax({
        type: 'POST',
        url: "http://0.0.0.0:6543/startpoints",
        dataType: 'json',
        processData: false,
        contentType: 'application/json',
        success: function(msg){
              console.log("CHOUESTTE:"+JSON.stringify(msg));
            },
        error: function(req, status, ex) {
          console.log('Request has failed.');
          console.log('Request:'+JSON.stringify(req));
          console.log('Status:'+JSON.stringify(status));
          console.log('Ex:'+JSON.stringify(ex));
        },
        timeout:0
      });
*/

      $.ajax({
        type: 'POST',
        url: "http://0.0.0.0:6543/empty_database/",
        dataType: 'json',
        processData: false,
        contentType: 'application/json',
        success: function(msg){
              console.log("CHOUETTE:"+JSON.stringify(msg));
            },
        error: function(req, status, ex) {
          console.log('Request has failed.');
          console.log('Request:'+JSON.stringify(req));
          console.log('Status:'+JSON.stringify(status));
          console.log('Ex:'+JSON.stringify(ex));
        },
        timeout:0
      });

      $.ajax({
        type: 'POST',
        url: "http://0.0.0.0:6543/load_data_into_graph/",
        dataType: 'json',
        data: JSON.stringify({
          file_name: "toto",
          col_types : ['entity_start'],
          disabled_columns : []
        }),
        processData: false,
        contentType: 'application/json',
        success: function(msg){
              console.log("CHOUETTE:"+JSON.stringify(msg));
            },
        error: function(req, status, ex) {
          console.log('Request has failed.');
          console.log('Request:'+JSON.stringify(req));
          console.log('Status:'+JSON.stringify(status));
          console.log('Ex:'+JSON.stringify(ex));
        },
        timeout:0
      });

      new AskomicsUserAbstraction().loadUserAbstraction();

      console.log(location.pathname+":"+new AskomicsUserAbstraction().getEntities());
      console.log(location.pathname+":"+new AskomicsUserAbstraction().getAttributesEntity("transcript"));
      console.log(location.pathname+":"+JSON.stringify(new AskomicsUserAbstraction().getPositionableEntities()));
    });
  });
  });
});
