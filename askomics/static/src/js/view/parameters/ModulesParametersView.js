/*jshint esversion: 6 */
/*jshint multistr:true */

let instanceModulesParametersView  ;

class ModulesParametersView extends InterfaceParametersView {

  constructor() {
    super();
    /* Implement a Singleton */
    if ( instanceModulesParametersView !== undefined ) {
        return instanceModulesParametersView;
    }

    this.config = {};
    this.shortcuts = {};
    instanceModulesParametersView = this;
    this.updateModules();
  }

  updateModules() {
    let service = new RestServiceJs("modules");

    service.post({},function(data) {
      $("#Modules_adm").empty();

      let template = AskOmics.templates.modules;

      let context = { modules:data };
      let html = template(context);

      $("#Modules_adm").append(html);
    });
  }

  active(urimo,name,bool) {
    new AskomicsJobsViewManager().insertQueue(
      function(resolve,reject) {

        let service = new RestServiceJs("manage_module");

        let param = {
          'checked' : bool,
          'uri'     : urimo,
          'name'    : name
        } ;

        service.post(param,function(data) {
          if ('error' in data) {
            reject(data.error);
            return;
          }
          resolve("<p>Import "+name+" is done !</p>", { });
          new ModulesParametersView().updateModules();
        });
      }
    );
    new ModulesParametersView().updateModules();
  }

}
