/*jshint esversion: 6 */
/*jshint multistr:true */
/*

*/
//var datalist_go_description_upload = false;

class GONodeView extends AskomicsObjectView {

  constructor(node) {
    super(node);
    this.lastValueFiler = "";
  }

  display_help() {
    let help_title = 'todo';
    let help_str = 'todo';
    displayModal(help_title, help_str, 'ok');
  }

  upload_go_description(id_input,filterStr) {
    /* load once time for all GO node */
    if ( filterStr === undefined ) return ;
    if ( filterStr.length < new GOParametersView().config.number_char_search_allow.length ) return;

    $('#matchGoValue').remove();
    /* General datalist available for all GOnode */
    let datalist = $('<datalist>').attr('id','matchGoValue');

    //let tab = this.objet.buildListOfGODescriptionsSPARQL(filterStr);
    let spq = $.sparql(new TriplestoreParametersView().configuration('endpoint'));

    spq.prefix("","http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#")
        .prefix("displaySetting","http://www.irisa.fr/dyliss/rdfVisualization/display")
        .prefix("rdfs","http://www.w3.org/2000/01/rdf-schema#")
        .prefix("rdfg","http://www.w3.org/2004/03/trix/rdfg-1/")
        .prefix("xsd","http://www.w3.org/2001/XMLSchema#")
        .prefix("owl","http://www.w3.org/2002/07/owl#")
        .prefix("dc","http://purl.org/dc/elements/1.1/")
        .prefix("rdf","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
        .prefix("prov","http://www.w3.org/ns/prov#")
        .select(["?goid","?description","?oboid"])
        .service(new GOParametersView().configuration('url_service'))
                  .where("?oboid","rdfs:label","?description")
                  .where("<http://www.geneontology.org/formats/oboInOwl#id>", "?goid")
                  .filter("regex(str(?description), \""+filterStr+"\", \"i\" ) ")
                  .limit(100);

      let query = spq.serialiseQuery();
      console.log(query);
      spq.execute(function(results) {
      datalist.empty();
      for ( let elt in results ) {

          datalist.append($('<option>')
                  .attr('goid',results[elt].goid)
                  .attr('oboid',results[elt].oboid.uri)
                  .attr('value',results[elt].goid + " - " + results[elt].description));
      }
    });

  $("#viewDetails").append(datalist);
  $("#viewDetails").show();
  }

  createDivGlobalSearch() {
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
              .attr("id","button_go_"+sparqlId)
              .attr("sparqlId",sparqlId)
              .attr("type","button")
              .attr("value","add to filter");
    /* Filter list */
    let titleFilter = $("<label></label>").html('Filters');
    let listFilter = $('<ul></ul>')
                     .addClass("list-group")
                     .attr("id","gofilterlist_"+sparqlId);

    let currentView = this;

    inp.keyup(function(d) {
      // when arrow is pressed, no action to avoid querying for nothing...
      //if (d.keyCode >= 37 && d.keyCode <= 40) return;

      let valueFilter = $(this).val();
      if ( currentView.lastValueFiler === valueFilter ) return;
      currentView.lastValueFiler = valueFilter;
      if ( valueFilter === undefined || valueFilter.length < new GOParametersView().config.number_char_search_allow ) {
        $("#button_go_"+sparqlId).attr('disable',true);
        return;
      }

      currentView.upload_go_description("#button_go_"+sparqlId,valueFilter);
      $("#button_go_"+sparqlId).attr('disable',false);
    });

    button_add.on('click',function(e){
      let sparqlid = $(this).attr("sparqlid");
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
      let node = new AskomicsGraphBuilder().getInstanciedNode(nodeid);
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
                            let node = new AskomicsGraphBuilder().getInstanciedNode(nodeid);
                            node.deleteOboIdFilter(oboid);
                            $(this).parent().remove();
                          });
      li.append(iconRemove);
      filterList.append(li);
    });

    let div = $("<div></div>").attr("id","globalSearch_go")
                              .attr("gonodeid",this.objet.id);

    div.append(lab)
             .append(inp)
             .append(button_add)
             .append(titleFilter)
             .append(listFilter);

    div.show();

    return div;
  }

  createDivJsTreeSearch() {
    /***********************************************/
    /* JSTree */

    let div_jstree = $("<div>").attr("id","jstree_go").attr("gonodeid",this.objet.id);

    div_jstree.on('changed.jstree', function (e, data) {
       var i, j, r = [];

       // Only one select when expand a node tree
       for(i = 0, j = data.selected.length; i < j; i++) {
         // no need to expand (already done)
         if ( data.instance.get_node(data.selected[i]).children !== undefined &&
              data.instance.get_node(data.selected[i]).children.length>0) continue;

         let spq = $.sparql(new TriplestoreParametersView().configuration('endpoint'));

         spq.prefix("rdfs","http://www.w3.org/2000/01/rdf-schema#")
           .prefix("rdf","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
           .prefix("xsd","http://www.w3.org/2001/XMLSchema#")
           .select(["?goid_child","?label_child"])
           .service(new GOParametersView().configuration('url_service'))
                     .where("?oboid_root","<http://www.geneontology.org/formats/oboInOwl#id>", "?goid_root")
                     .values("?goid_root",["\""+data.instance.get_node(data.selected[i]).id+"\"^^xsd:string"])
                     .where("?oboid_child","rdfs:subClassOf","?oboid_root")
                     .where("rdfs:label","?label_child")
                     .where("<http://www.geneontology.org/formats/oboInOwl#id>", "?goid_child")
                     .distinct()
                     ;

         let query = spq.serialiseQuery();
         //console.log(query);
         spq.execute(expand_jtree,data.instance.get_node(data.selected[i]).id);

         // unselect parent
         //console.log(JSON.stringify(data.instance.get_node(data.selected[i])));
         if ( data.instance.get_node(data.selected[i]).parents !== undefined )
          data.instance.deselect_node(data.instance.get_node(data.selected[i]).parents[0]);
         //unselect current node because first click load child GO terms
         //data.instance.deselect_node(data.instance.get_node(data.selected[i]));
       }

       $('#event_result').html('Selected: ' + r.join(', '));
   //************************************************************************************************************************************
     }).on('select_node.jstree deselect_node.jstree', function (e, data) {
             let gonodeid = $("#jstree_go").attr("gonodeid");
             let gonode = new AskomicsGraphBuilder().getInstanciedNode(gonodeid);
             //console.log(JSON.stringify(gonode));
             gonode.filterOnOboId.splice(0,gonode.filterOnOboId.length);
             for(let i = 0, j = data.selected.length; i < j; i++) {
               let node_sel = data.instance.get_node(data.selected[i]);
               gonode.filterOnOboId.push("http://purl.obolibrary.org/obo/"+node_sel.id.replace(":","_"));
             }
 //************************************************************************************************************************************
     }).jstree({
                 "checkbox": {
                   "keep_selected_style": false,
                   "tie_selection" : true,
                   "three_state" : false,
                   "whole_node" : false,
                   //"checked_parent_open": true,
                 },
                 "plugins": ["checkbox","wholerow","search"],
                 'core' : {
                   "check_callback" : true,
                   "open_parents": true,
                   "load_open": true,
                   'data' : [
                     { "id" : "GO:0008150", "parent" : "#", "text" : "biological process" },
                     { "id" : "GO:0003674", "parent" : "#", "text" : "molecular function" },
                     { "id" : "GO:0005575", "parent" : "#", "text" : "cellular component" }
                   ]
     } });

    //by default
    div_jstree.hide();
    return div_jstree;
  }

  // dedicated to String entry
  makeFilterStringOrJstreeIcon() {
    var icon = $('<span></span>')
            .attr('aria-hidden','true')
            .addClass('glyphicon')
            .addClass('glyphicon-search')
            .addClass('display');

    let mythis = this;

    icon.click(function(d) {
        if (icon.hasClass('glyphicon-search')) {
              icon.removeClass('glyphicon-search');
              icon.addClass('glyphicon-list');
              $("#jstree_go[gonodeid='"+mythis.objet.id+"']").show();
              $("#globalSearch_go[gonodeid='"+mythis.objet.id+"']").hide();

        } else {
              icon.removeClass('glyphicon-list');
              icon.addClass('glyphicon-search');
              $("#jstree_go[gonodeid='"+mythis.objet.id+"']").hide();
              $("#globalSearch_go[gonodeid='"+mythis.objet.id+"']").show();
        }
    });
    return icon;
  }

  create() {
    this.divPanel() ;

    this.details.append($('<div></div>').append(this.makeFilterStringOrJstreeIcon())
                                        .append(this.createDivGlobalSearch())
                                        .append(this.createDivJsTreeSearch()));


      $("#viewDetails").append(this.details);
  }
}

function expand_jtree(results,expand_id) {
  for ( let elt in results ) {
      let node = {"id":results[elt].goid_child,"text": results[elt].label_child } ;
      $('#jstree_go').jstree().create_node(expand_id, node , 'last') ;
  }
}
