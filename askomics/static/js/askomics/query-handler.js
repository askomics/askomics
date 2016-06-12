/*jshint esversion: 6 */

/****************************************************************************/


/****************************************************************************/

function addFilterCat(id, value) {
    filter_cat.push({'id': id, 'value': value});
}

function addFilterNum(id, value,operator) {
    filter_num.push({'id': id, 'value': value , 'op' : operator});
}

function addFilterStr(id, value) {
    filter_str.push({'id': id, 'value': value});
}

function removeFilterGen(filterArray,id) {
    for (var i = filterArray.length-1; i >= 0; --i) {
        if (filterArray[i].id == id) {
            filterArray.splice(i,1);
        }
    }
}

function removeDisplay(id) {
    removeFilterGen(display,id);
}

function removeFilterCat(id) {
    removeFilterGen(filter_cat,id);
}

function removeFilterNum(id) {
    removeFilterGen(filter_num,id);
}

function removeFilterStr(id) {
    removeFilterGen(filter_str,id);
}

function removeConstraint(id, ignore) {
    ignore = (ignore ? ignore : []);

    for (var i = constraint.length-1; i >= 0; --i) {
        if (ignore.indexOf(constraint[i].type) < 0) {
            switch (constraint[i].type) {
                case 'node':
                    if (constraint[i].id == id)
                        constraint.splice(i,1);
                    break;
                case 'link':
                    if ((constraint[i].src == id) || (constraint[i].tg == id))
                        constraint.splice(i,1);
                    break;
                case 'attribute':
                    if (constraint[i].id == id)
                        constraint.splice(i,1);
                    break;
                case 'clause':
                    if (constraint[i].id == id)
                        constraint.splice(i,1);
                    break;
            }
        }
    }
}



function delFromQuery(id) {
    removeDisplay(id);
    removeConstraint(id);
    removeFilterCat(id);
    removeFilterNum(id);
    removeFilterStr(id);
}

function formatQuery() {
    $("input[type='checkbox']:checked").each(function() {
        addDisplay($(this).attr('name'));
    });
    launchQuery(0, 30, false);
}

function launchQuery(exp, lim, roq) {
    //     Get SPARQL query corresponding to the graph and launch it according
    //     to given parameters.
    //
    //     :exp: 0 = results overview
    //           1 = complete results file generation
    //     :lim: LIMIT value in the SPARQL query
    //     :roq: bool, if true, don't launch the query, only return it

    if (exp == 1) {
        $("#export").remove();
        $("#btn-file").text("Generating results file, please wait...");
        $("#btn-file").disabled = true;
    }

    if (!roq)
      $('#waitModal').modal('show');
/*
    var jdata = { 'display':display,
                  'constraint':constraint,
                  'filter_cat':filter_cat,
                  'filter_num':filter_num,
                  'filter_str':filter_str,
                  'export':exp,
                  'limit':lim,
                  'return_only_query':roq,
                  'uploaded':$("#uploadedQuery").text() };
*/
    var tab = graphBuilder.buildConstraintsGraph();
    var jdata = {
      'variates': tab[0],
      'constraintesRelations': tab[1],
      'constraintesFilters': []
    };
    var service = new RestServiceJs("sparqlquery");

    service.post(jdata,function(data) {
        if (roq) {
            $("a#btn-qdown").attr("href", "data:text/plain;charset=UTF-8," + encodeURIComponent(data.query));
        } else if (exp === 0) {
            displayResults(data);
            $('#waitModal').modal('hide');
        } else {
            provideDownloadLink(data);
            $('#waitModal').modal('hide');
        }
    });
}

function provideDownloadLink(data) {
    console.log("** provideDownloadLink **");
    $("#btn-file").text("Generate a results file (max 10000 lines)");
    $("#btn-down").prop("disabled", false);
    $("#form-down").attr("action", data.file).attr("method", "get");
}

function displayResults(data) {
    //graphBuilder.attributesDisplaying
    // to clear and print new results
    $("#results").empty();
    console.log("=================== DISPLAY RESULTS =============================");
    console.log(JSON.stringify(data));
    /*
    if (data.values.length > 0) {
      for(var i=0; i<data.values.length; i++) {
          $.each(data.values[i], function(key, value) {
            body.append(value);
          });
      }
    }
*/
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
         row.append($('<th></th>').addClass("success").addClass("table-bordered").text("Name"));

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
