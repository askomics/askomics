/*jshint esversion: 6 */

/*
  Manage Menu View to select and unselect proposition of element/link
*/
var AskomicsMenuFile = function () {

  AskomicsMenuFile.prototype.start = function() {

    //$("#uploadedQuery")
    $("#dwl-query").on('click', function(d) {
      var date = new Date().getTime();
      $(this).attr("href", "data:application/octet-stream," + encodeURIComponent(graphBuilder.getInternalState())).attr("download", "query-" + date + ".json");
    });


    $("#dwl-query-sparql").on('click', function(d) {
      var service = new RestServiceJs("getSparqlQueryInTextFormat");
      var jdata = prepareQuery(false,0, false);
      var date = new Date().getTime();
      var current = this;
      var query = "" ;
      service.postsync(jdata,function(data) {
        query = data.query;
      });
      $(this).attr("href", "data:application/sparql-query," + encodeURIComponent(query)).attr("download", "query-" + date + ".sparql");
    });
  };

};
