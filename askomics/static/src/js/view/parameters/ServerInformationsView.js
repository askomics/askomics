/*jshint esversion: 6 */
/*jshint multistr:true */

let instanceServerInformationsView  ;

class ServerInformationsView {

  constructor() {
    /* Implement a Singleton */
    if ( instanceServerInformationsView !== undefined ) {
        return instanceServerInformationsView;
    }

    instanceServerInformationsView = this;

  }

  update() {
    console.log("!!! update Server information !!!");

    let service = new RestServiceJs("serverinformations");

    service.getAll(function(data) {
      $("#Server_adm").empty();

      let template = AskOmics.templates.serverinformations;
      let context = {infos: data.values};
      let html = template(context);
      $("#Server_adm").append(html);
    });
  }

  cleanServer() {
    let service = new RestServiceJs("cleantmpdirectory");
    service.post({}).then( function() { instanceServerInformationsView.update();});
  }
}
