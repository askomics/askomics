/*jshint esversion: 6 */

function prepareQuery(exp, lim, roq) {
    //     Get JSON to ask for a SPARQL query corresponding to the graph
    //     and launch it according to given parameters.
    //
    //     :exp: false = results overview
    //           true = complete results file generation
    //     :lim: LIMIT value in the SPARQL query
    //     :roq: bool, if true, don't launch the query, only return it
    var tab = graphBuilder.buildConstraintsGraph();
    return {
              'export'               : exp,
              'variates'             : tab[0],
              'constraintesRelations': tab[1],
              'constraintesFilters'  : tab[2],
              'limit'                : lim
           };
}

function viewQueryResults() {
    $("#btn-down").prop("disabled", false);
    displayModal('Please wait', '', 'Close');

    let time = $.now();
    let service = new RestServiceJs("sparqlquery");
    let jdata = prepareQuery(false, 30, false);
    service.post(jdata,function(data) {
      hideModal();
      let new_time = $.now();
      let exec_time = new_time - time;
      console.log('===> query executed in '+exec_time+' ms');
      if ('error' in data) {
        alert(data.error);
        return;
      }
      displayResults(data);
      //resize graph if fullscreen
      if ($('#icon-resize-graph').attr('value') == 'full') {
        forceLayoutManager.normalsizeGraph();
      }
    });
}

function downloadResultsFile(lim) {
    displayModal('Generating results file ...', '', 'Close');
    var service = new RestServiceJs("sparqlquery");
    var jdata = prepareQuery(true, lim, false);
    service.post(jdata, function(data) {
        hideModal();
        window.location.href = data.file;
    });
}

function displayResults(data) {
    // to clear and print new results
    $("#results").empty();
    if (data.values.length > 0) {
       {
       /* new presentation by entity */
       let table = $('<table></table>').addClass('table').addClass('table-bordered').addClass('table-results');
       let head = $('<thead></thead>');
       let body = $('<tbody></tbody');

       let row = $('<tr></tr>');
       let activesAttributes = {} ;
       let activesAttributesLabel = {};

       for (let i=0;i<graphBuilder.nodes().length;i++ ) {
         let node = graphBuilder.nodes()[i];
         if ( ! node.actif ) continue;
         let attr_disp = node.getAttributesDisplaying();
         activesAttributes[node.id] = attr_disp.id;
         activesAttributesLabel[node.id] = attr_disp.label;
         let nAttributes = activesAttributes[node.id].length;
         /* Fomattage en indice du numero de l'entité */
         row.append($('<th></th>')
            .addClass("table-bordered")
            .addClass("active")
            .attr("style", "text-align:center;")
            .attr("colspan",nAttributes).append(node.label));

       }

       head.append(row);
       row = $('<tr></tr>');
       for (let i=0;i<graphBuilder.nodes().length;i++ ) {
         let node = graphBuilder.nodes()[i];
         if ( ! node.actif ) continue;
         for (let label in activesAttributes[node.id]) {
            row.append($('<th></th>')
               .addClass("success")
               .addClass("table-bordered").text(activesAttributesLabel[node.id][label]));
         }
       }
      head.append(row);
      for (let i=0;i<data.values.length;i++ ) {
        row = $('<tr></tr>');
        for (let j=0;j<graphBuilder.nodes().length;j++ ) {
          let node = graphBuilder.nodes()[j];
          if ( ! node.actif ) continue;
          for (let sparqlId in activesAttributes[node.id]) {
            row.append($('<td></td>').text(data.values[i][activesAttributes[node.id][sparqlId]]));
          }
        }
        body.append(row);
      }

       $("#results").append(table.append(head).append(body));
      }
    } else {
        $("#results").append("No results have been found for this query.");
    }
}
