/*jshint esversion: 6 */

/*

*/
var datalist_go_description_upload = false;

class GONodeView extends AskomicsObjectView {

  constructor(node) {
    super(node);
    this.upload_go_description();
  }

  display_help() {
    let help_title = 'todo';
    let help_str = 'todo';
    displayModal(help_title, help_str, 'ok');
  }

  upload_go_description() {
    /* load once time for all GO node */
    if (datalist_go_description_upload) return;

    displayModal('Please wait', '', 'Close');

    /* General datalist available for all GOnode */
    let datalist = $('<datalist>').attr('id','matchGoValue');

    let tab = this.objet.buildListOfGODescriptionsSPARQL();

    let service = new RestServiceJs("sparqlquery");
    let model = {
      'variates': tab[0],
      'constraintesRelations': tab[1],
      'limit' :-1,
      'export':false,
    };
    let gonode = this;
      service.post(model, function(d) {
        for (let v of d.values) {
             datalist.append($('<option>')
                     .attr('goid',v.goid)
                     .attr('oboid',v.oboid)
                     .attr('value',v.goid + " - " + v.description));
        }
        hideModal();
      });

    $("#viewDetails").append(datalist);
    datalist_go_description_upload = true;
  }

  create() {
    var details = this.divPanel() ;
    details.attr("nodeid", this.objet.id).addClass('div-details');

    let lab = $("<label></label>").attr("for",this.objet.uri).html("Description filtering");

    let sparqlId = "desc"+this.objet.SPARQLid;
    /* search input */
    let inp = $("<input/>")
              .addClass("form-control")
              .attr("type","text")
              .attr("placeholder","Search...")
              .attr('required', 'required')
              .attr('list','matchGoValue')
              .attr("id","goinput_"+sparqlId);

    /* button to add filter */
    let button_add = $("<input/>")
              .addClass("form-control")
              .attr("id",sparqlId)
              .attr("type","button")
              .attr("value","add to filter");
    /* Filter list */
    let titleFilter = $("<label></label>").html('Filters');
    let listFilter = $('<ul></ul>')
                     .addClass("list-group")
                     .attr("id","gofilterlist_"+sparqlId);

    button_add.on('click',function(e){
      let sparqlid = $(this).attr("id");
      if ( sparqlid === undefined ) {
        console.error("Can not find attribute ID ");
        return;
      }
      let valueSel = $('#goinput_'+sparqlid).val();
      if ( valueSel === undefined ) {
        console.error("Can not find input search text GO id: goinput_"+sparqlId);
        return;
      }
      let filterList = $("#gofilterlist_"+sparqlId);
      if ( filterList === undefined ) {
        console.error("Can not find Filter list id: gofilterlist_"+sparqlId);
        return;
      }
      let exp = /GO:\d+/i;
      let tabGO = exp.exec(valueSel);

      let goid = "";

      if ((tabGO !== null) && (tabGO.length>0)) {
        goid = tabGO[0];
      }

      if ( goid === "" ) {
        alert("Input expression have to contains a GO id.");
        return;
      }

      /* check if exist in the selected list */
      let goid_exist = filterList.find("li[goid='"+goid+"']").attr('goid');
      /* no need to add in the list */
      if ( goid_exist === goid ) return;

      /* set up the node */
      let nodeid   = $(this).parent().attr("nodeid");
      let oboid = $("#viewDetails").find("#matchGoValue option[goid='"+goid+"']").attr('oboid');
      if ( oboid === undefined ) {
        alert("GOID Unknown:"+goid);
        return;
      }
      let node = graphBuilder.getInstanciedNode(nodeid);
      node.addOboIdFilter(oboid);

      /* Add to Html Filter list */
      let li = $('<li></li>').addClass('list-group-item')
                    .attr('nodeid',nodeid)
                    .attr('goid',goid)   // need to know if the GO is selectioned previouly
                    .attr('oboid',oboid) // need to set up the filter to build sparql query
                    .html(valueSel);

      let iconRemove = $('<span></span>')
                          .attr('aria-hidden','true')
                          .addClass('glyphicon')
                          .addClass('glyphicon-remove-sign')
                          .addClass('display')
                          .on('click',function(e){
                            let nodeid   = $(this).parent().attr("nodeid");
                            let oboid   = $(this).parent().attr("oboid");
                            let node = graphBuilder.getInstanciedNode(nodeid);
                            node.deleteOboIdFilter(oboid);
                            $(this).parent().remove();
                          });
      li.append(iconRemove);
      filterList.append(li);
    });

    details.append(lab)
             .append(inp)
             .append(button_add)
             .append(titleFilter)
             .append(listFilter);

      $("#viewDetails").append(details);
  }
}
