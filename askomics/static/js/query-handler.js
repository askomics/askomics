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

       let nodeToDisplay = graphBuilder.nodesDisplaying();
       let i,j,k;
       let varEntity;

       for (i=0;i<nodeToDisplay.length;i++ ) {
         varEntity = nodeToDisplay[i];
         var nodeBuf = {name:varEntity};
         var label = varEntity;
         let attr_disp = graphBuilder.attributesDisplaying(varEntity);
         activesAttributes[varEntity] = attr_disp.id;
         activesAttributesLabel[varEntity] = attr_disp.label;
         var nAttributes = activesAttributes[varEntity].length+1;
         /* Fomattage en indice du numero de l'entité */
         row.append($('<th></th>')
            .addClass("table-bordered")
            .addClass("active")
            .attr("style", "text-align:center;")
            .attr("colspan",nAttributes).append(label));

       }

       head.append(row);
       row = $('<tr></tr>');
       for (i=0;i<nodeToDisplay.length;i++ ) {
         varEntity = nodeToDisplay[i];
         row.append($('<th></th>').addClass("success").addClass("table-bordered").text("ID"));

         for (var att in activesAttributes[varEntity]) {
            row.append($('<th></th>').addClass("success").addClass("table-bordered").text(activesAttributesLabel[varEntity][att]));

         }
       }
      head.append(row);

      for (i=0;i<data.values.length;i++ ) {
        row = $('<tr></tr>');
        for (j=0;j<nodeToDisplay.length;j++ ) {
          varEntity = nodeToDisplay[j];
          //console.log(JSON.stringify(data.values[i]));
          row.append($('<td></td>').addClass("table-bordered").text(data.values[i][varEntity]));
          for (k in activesAttributes[varEntity]) {
            row.append($('<td></td>').text(data.values[i][activesAttributes[varEntity][k]]));
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
