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
      let source = $('#template-admin-modules').html();
      let template = Handlebars.compile(source);

      let context = { modules:data };
      let html = template(context);

      $("#Modules_adm").append(html);
    });
  }

  active(urimo,name,bool) {
    new AskomicsJobsViewManager().createModuleJob(bool,urimo,name);
    new ModulesParametersView().updateModules();
  }

}
