/*jshint esversion: 6 */

class AskomicsResultsView {
  constructor(data) {
    this.data = data ;
    this.activesAttributes      = {} ; // Attributes id by Node Id to Display
    this.activesAttributesLabel = {} ; // Attributes label by Node Id to Display
  }

  setActivesAttributes() {
    for (let i=0;i<graphBuilder.nodes().length;i++ ) {
      let node = graphBuilder.nodes()[i];
      if ( ! node.actif ) continue;
      let attr_disp = node.getAttributesDisplaying();
      this.activesAttributes[node.id] = attr_disp.id;
      this.activesAttributesLabel[node.id] = attr_disp.label;
      if (this.activesAttributes[node.id].length != this.activesAttributesLabel[node.id].length ) {
        throw "Devel: Error node.getAttributesDisplaying give array with different size:"+str(this.activesAttributes[node.id].length)+","+str(this.activesAttributesLabel[node.id].length);
      }
    }
  }

  displayResults() {
      // to clear and print new results
      $("#results").empty();
      this.setActivesAttributes();

      if (this.data.values.length <= 0) {
        $("#results").append("No results have been found for this query.");
        return ;
      }

      /* new presentation by entity */
      let table = $('<table></table>')
                    .addClass('table')
                    .addClass('table-bordered')
                    .addClass('table-results');

      $("#results")
        .append(table.append(this.build_header_results())
        .append(this.build_subheader_results(graphBuilder.nodes()))
        .append(this.build_body_results(graphBuilder.nodes())));
  }

  build_header_results() {
    let head = $('<thead></thead>');
    let row = $('<tr></tr>');

    /* set Entity Header */
    for (let i=0;i<graphBuilder.nodes().length;i++ ) {
      let node = graphBuilder.nodes()[i];
      if ( ! node.actif ) continue;
      let nAttributes = this.activesAttributes[node.id].length;
      /* Fomattage en indice du numero de l'entité */
      row.append($('<th></th>')
                      .addClass("table-bordered")
                      .addClass("active")
                      .addClass("entityHeaderResults")
                      .attr("id", node.id)
                      .attr("style", "text-align:center;")
                      .attr("colspan",nAttributes).append(node.formatInHtmlLabelEntity())
                    );
    }

    let currentView = this ;
    row.sortable({   // allow to change order of display
         placeholder: "ui-state-highlight",
         start: function (event, ui) {
           ui.item.toggleClass("highlight");
           // modify ui.placeholder however you like
           //ui.placeholder.attr("colspan",ui.item.attr("colspan"));
           //ui.placeholder.css("width",0);
         },
         stop: function (event, ui) {
                ui.item.toggleClass("highlight");
               },
         update: function (event, ui) {
           let nodeList = [];
           $(".entityHeaderResults").each(function( index ) {
             nodeList.push($(this).attr("id"));
           });
           let lNodes = graphBuilder.nodes(nodeList,'id');
           $(this).parent().parent().find("thead:eq(1)").remove();
           $(this).parent().parent().find("tbody").remove();

           $(this).parent().parent().append(currentView.build_subheader_results(lNodes));
           $(this).parent().parent().append(currentView.build_body_results(lNodes));
         }
       }).disableSelection();

    head.append(row);
    return head;
  }

  build_subheader_results(nodeList) {
    let head = $('<thead></thead>');
    let row = $('<tr></tr>');
    for (let i=0;i<nodeList.length;i++ ) {
      let node = nodeList[i];
      if ( ! node.actif ) continue;
      for (let sparqlid in this.activesAttributes[node.id]) {
        row.append($('<th></th>')
           .addClass("success")
           .addClass("attributesHeaderResults")
           .attr("sparqlid",this.activesAttributes[node.id][sparqlid])
           .attr("nodeid",node.id)
           .addClass("table-bordered").text(this.activesAttributesLabel[node.id][sparqlid]));
      }
    }
    let currentView = this ;
    row.sortable({   // allow to change order of display
         placeholder: "ui-state-highlight",
         items: ":not(.ui-state-disabled)",
         cancel: '.ui-state-disabled',
         start: function (event, ui) {
           console.log("start");
           $(".attributesHeaderResults").css({width: $(ui.item).width()});
           // unactive cells associated with other node
           let currentCell = $(".attributesHeaderResults:eq("+ui.item.index()+")");
           let nodeid = currentCell.attr("nodeid");
           // unselcted other element
           //$('.attributesHeaderResults').not(":eq("+ui.item.index()+")").addClass('ui-state-disabled');
           //unallow to place the cell in an other node id
           $('.attributesHeaderResults[nodeid!='+nodeid+']').addClass('ui-state-disabled');
         },
         stop: function (event, ui) {
           console.log("stop");
           $('.attributesHeaderResults').removeClass('ui-state-disabled');
         },
         update: function (event, ui) {

           let nodeList = [];
           $(".entityHeaderResults").each(function( index ) {
             nodeList.push($(this).attr("id"));
           });
           let lNodes = graphBuilder.nodes(nodeList,'id');

           let attList = [];
           $(".attributesHeaderResults").each(function( index ) {
             let obj = {};
             obj.sparqlid = $(this).attr("sparqlid");
             obj.nodeid = $(this).attr("nodeid");
             attList.push(obj);
           });
           /*
              rebuild activesAttributesLabel activesAttributes
           */
           console.log("AVANT:"+JSON.stringify(currentView.activesAttributes));
           currentView.activesAttributes = {};
           for (let ielt in attList) {
              let elt = attList[ielt];
              if (!(elt.nodeid in currentView.activesAttributes))
                currentView.activesAttributes[elt.nodeid] = [];
              currentView.activesAttributes[elt.nodeid].push(elt.sparqlid);
           }
           console.log("APRES:"+JSON.stringify(currentView.activesAttributes));
           $(this).parent().parent().parent().find("tbody").remove();
           $(this).parent().parent().append(currentView.build_body_results(lNodes));
         }
       }).disableSelection();

    head.append(row);
    console.log("HEAD");
    console.log(JSON.stringify(head));
    return head;
  }

  build_body_results(nodeList) {
    let body = $('<tbody></tbody');
    for (let i=0;i<this.data.values.length;i++ ) {
      let row = $('<tr></tr>');
      for (let j=0;j<nodeList.length;j++ ) {
        let node = nodeList[j];
        if ( ! node.actif ) continue;
        for (let sparqlId in this.activesAttributes[node.id]) {
          row.append($('<td></td>').text(this.data.values[i][this.activesAttributes[node.id][sparqlId]]));
        }
      }
      body.append(row);
    }
    console.log(JSON.stringify(body));
    return body;
  }

}
