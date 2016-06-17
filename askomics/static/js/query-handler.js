/*jshint esversion: 6 */

function prepareQuery(exp, lim, roq) {
    //     Get JSON to ask for a SPARQL query corresponding to the graph
    //     and launch it according to given parameters.
    //
    //     :exp: 0 = results overview
    //           1 = complete results file generation
    //     :lim: LIMIT value in the SPARQL query
    //     :roq: bool, if true, don't launch the query, only return it
    var tab = graphBuilder.buildConstraintsGraph();
    return {
              'exp'                  : exp,
              'variates'             : tab[0],
              'constraintesRelations': tab[1],
              'constraintesFilters'  : tab[2],
              'limit'                : lim
           };
}

function viewQueryResults() {
    displayModal('Please wait', 'Close');

    var service = new RestServiceJs("sparqlquery");
    var jdata = prepareQuery(0, 30, false);
    service.post(jdata,function(data) {
        displayResults(data);
        hideModal();
    });
}

function generateResultFile(lim) {
    displayModal('Please wait', 'Close');
    $("#export").remove();
    $("#btn-file").text("Generate...");
    $("#btn-file").disabled = true;

    var service = new RestServiceJs("sparqlquery");
    var jdata = prepareQuery(1, lim, false);
    service.post(jdata, function(data) {
        provideDownloadLink(data);
        hideModal();
    });
}

function provideDownloadLink(data) {
    console.log("** provideDownloadLink **");
    $("#btn-file").text("Results file");
    $("#btn-down").prop("disabled", false);
    $("#form-down").attr("action", data.file).attr("method", "get");
}

function displayResults(data) {
    // to clear and print new results
    $("#results").empty();
    if (data.values.length > 0) {
       {
       /* new presentation by entity */
       var table = $('<table></table>').addClass('table').addClass('table-bordered');
       var head = $('<thead></thead>');
       var body = $('<tbody></tbody');

       var row = $('<tr></tr>');
       var activesAttributes = {} ;

       var nodeToDisplay = graphBuilder.nodesDisplaying();
       var i,k;
       var varEntity;

       for (i=0;i<nodeToDisplay.length;i++ ) {
         varEntity = nodeToDisplay[i];
         var nodeBuf = {name:varEntity};
         var label = nodeView.formatLabelEntity(nodeBuf);
         activesAttributes[varEntity] = graphBuilder.attributesDisplaying(varEntity);
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
            row.append($('<th></th>').addClass("success").addClass("table-bordered").text(activesAttributes[varEntity][att]));

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
