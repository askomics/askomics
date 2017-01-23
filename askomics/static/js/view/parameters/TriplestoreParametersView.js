/*jshint esversion: 6 */
/*jshint multistr:true */

let instanceTriplestoreParametersView  ;

class TriplestoreParametersView extends InterfaceParametersView {

  constructor() {
    super();
    /* Implement a Singleton */
    if ( instanceTriplestoreParametersView !== undefined ) {
        return instanceTriplestoreParametersView;
    }

    this.config = {
      endpoint  : 'http://localhost:8890/sparql'     ,
      usergraph : 'askomics:user:graph:'             ,
      max_content_size_to_update_database : '500000' ,
      max_results_size : '2000' ,
      tpsname   : 'virtuoso'
    };

    instanceTriplestoreParametersView = this;
  }

  createShortCutsManagement() {
    // get Shortcuts list
    let div = $("<div></div>").addClass("row");
    let lab = $("<label></label>").html("SHORTCUTS");
    let form = $("<form></form>").addClass("form-horizontal")
            .append(
               $("<fieldset></fieldset>")
                                         .append($("<span></sdpan>")
                                                   .addClass("glyphicon glyphicon-erase display")
                                                   /*.click(function(d) {
                                                     //unselect list
                                                   }))*/
                                         .append($("<select></select>")
                                                   .attr("multiple","multiple")
                                                   .addClass("form-control")
                                                  /* .change(function(d) {
                                                     //manage list selected
                                                   }) */)
             )
           );
    div.append(lab);
    div.append(form);
    return div ;
  }

  configurationView() {

    /* if the content have ever been created */
    if ( $("#content_triplestore_parameters").length>0) return;

    /* build otherwise */
    let container = $("<div></div>").addClass("container").attr("id","content_triplestore_parameters");
    let lab = $("<h3></h3>").html("Triplestore configuration");

    container.append($('<hr/>'))
             .append(lab)
             .append($('<hr/>'))
             .append(this.createInput("ENDPOINT",'endpoint'))
             .append($('<hr/>'))
             .append(this.createInput("GRAPH NAME",'usergraph'))
             .append($('<hr/>'))
             .append(this.createInput("LIMIT UPLOAD SIZE (Ko)",'max_content_size_to_update_database'))
             .append($('<hr/>'))
             .append(this.createSelect("TRIPLESTORE",'tpsname',['virtuoso','fuseki'],['virtuoso','fuseki']))
             .append($('<hr/>'))
             .append(this.createInput("MAX RESULTS",'max_results_size'))
             .append($('<hr/>'))
             .append(this.createShortCutsManagement());

    /* add to the main document */
    $('body').append(container);
  }

}
