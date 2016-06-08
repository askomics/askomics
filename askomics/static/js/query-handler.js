var display = [];
var constraint = [];
var filter_cat = [];
var filter_num = [];
var filter_str = [];

/****************************************************************************/

// take a string and return an entity with a sub index
function formatLabelEntity(varEntity) {
  var re = new RegExp(/(\d+)$/);
  var indiceEntity = varEntity.match(re);
  var labelEntity = varEntity.replace(re,"");
  return $('<em></em>').text(labelEntity).append($('<sub></sub>').text(indiceEntity[0]));
}

/****************************************************************************/

function addDisplay(id) {
    if (isDisplayed(id)) return;
    display.push({'id': id});
}

function addConstraint(type, src, uri, tg) {
    // The constraint table contains triples defining the WHERE clauses of the user's query
    if (hasConstraint(src,tg)) return;

    if (type == 'node') {
        constraint.push({'type': 'node',
                    'id': src,
                    'uri': uri});
    } else if (type == 'link') {
        constraint.push({'type': 'link',
                    'src': src,
                    'uri': uri,
                    'tg': tg});
    } else if (type == 'attribute') {
        constraint.push({'type': 'attribute',
                    'id': src,
                    'uri': uri,
                    'parent': tg});
    } else if (type == 'clause') {
        constraint.push({'type': 'clause',
                    'relation': src,
                    'clause':uri});
    }
}

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

function isDisplayed(id) {
    for (dis of display) {
        if (dis.id == id) {
            return true;
        }
    }
    return false;
}

function hasConstraint(src, tg, ignore) {
    ignore = (ignore ? ignore : []);

    for (cst of constraint) {
        if (ignore.indexOf(cst.type) < 0) {
            if (tg === undefined) {
                if ((cst.type == 'node') && (cst.id == src) ) {
                    return true;
                }
            } else if (cst.type == 'link') {
                if ((cst.src == src) && (cst.tg == tg)) {
                    return true;
                }
            } else if (cst.type == 'attribute') {
                if ((cst.id == src) || ((!src) && (cst.parent == tg))) {
                    return true;
                }
            } else if (cst.type == 'clause') {
                if ((cst.clause == src) && (cst.relation == tg)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function hasFilter(id) {
    for (fil of filter_cat) {
        if (fil.id == id) {
            return true;
        }
    }
    for (fil of filter_num) {
        if (fil.id == id) {
            return true;
        }
    }
    for (fil of filter_str) {
        if (fil.id == id) {
            return true;
        }
    }
    return false;
}

function delFromQuery(id) {
    removeDisplay(id);
    removeConstraint(id);
    removeFilterCat(id);
    removeFilterNum(id);
    removeFilterStr(id);
}




function prepareQuery(exp, lim, roq) {
    //     Get JSON to ask for a SPARQL query corresponding to the graph
    //     and launch it according to given parameters.
    //
    //     :exp: 0 = results overview
    //           1 = complete results file generation
    //     :lim: LIMIT value in the SPARQL query
    //     :roq: bool, if true, don't launch the query, only return it
    return { 'display':display,
              'constraint':constraint,
              'filter_cat':filter_cat,
              'filter_num':filter_num,
              'filter_str':filter_str,
              'export':exp,
              'limit':lim,
              'return_only_query':roq,
              'uploaded':$("#uploadedQuery").text()
          };
}

function viewQueryResults() {
    displayModal('Please wait', 'Close');

    var service = new RestServiceJs("results");
    var jdata = prepareQuery(0, 30, false);
    service.post(jdata,function(data) {
        displayResults(data);
        hideModal();
    });
}

function generateResultFile(lim) {
    displayModal('Please wait', 'Close');
    $("#export").remove();
    $("#btn-file").text("Generating results file, please wait...");
    $("#btn-file").disabled = true;

    var service = new RestServiceJs("results");
    var jdata = prepareQuery(1, lim, false);
    service.post(jdata, function(data) {
        provideDownloadLink(data);
        hideModal();
    });
}

function provideDownloadLink(data) {
    console.log("** provideDownloadLink **");
    $("#btn-file").text("Generate a results file (max 10000 lines)");
    $("#btn-down").prop("disabled", false);
    $("#form-down").attr("action", data.file).attr("method", "get");
}

function displayResults(data) {
    // to clear and print new results
    $("#results").empty();

    if (data.results_entity_name.length > 0) {
      for(i=0; i<data.results_entity_name.length; i++) {
          $.each(data.results_entity_name[i], function(key, value) {
            body.append(value);
          });
      }
    }

    if (data.results.length > 0) {
       {
       /* new presentation by entity */
       var table = $('<table></table>').addClass('table').addClass('table-bordered');
       var head = $('<thead></thead>');
       var body = $('<tbody></tbody');

       var row = $('<tr></tr>');
       /* print Entity name */
       var listEntitySorted = Array();

      /* print Entity results in the selection order  */
       for (i=0;i < constraint.length; i++ ) {
         /* Peux etre un noeud mais pas une Entity !! */
         if ( constraint[i].type == "node" && data.results_entity_attributes[constraint[i].id] !== undefined )  {
           listEntitySorted.push(constraint[i].id);
         }
       }

       for (i=0;i<listEntitySorted.length;i++ ) {
         var varEntity = listEntitySorted[i];
         var label = formatLabelEntity(varEntity);

         /* Calcul du nombre de colonne ncessaire à cet entity */
         var nAttributes = 1;
         for (j in data.results_entity_attributes[varEntity]) {
           if ( isDisplayed(j) ) nAttributes++;
         }
         /* Fomattage en indicie du numero de l'entité */
         row.append($('<th></th>').addClass("table-bordered").addClass("active").attr("style", "text-align:center;").attr("colspan",nAttributes).append(label));

       }

       head.append(row);
       row = $('<tr></tr>');
       for (i=0;i<listEntitySorted.length;i++ ) {
         var varEntity = listEntitySorted[i];
         row.append($('<th></th>').addClass("success").addClass("table-bordered").text("Name"));

         for (j in data.results_entity_attributes[varEntity]) {
           if ( isDisplayed(j) ) {
             row.append($('<th></th>').addClass("success").addClass("table-bordered").text(data.results_entity_attributes[varEntity][j]));
           }
         }
       }
      head.append(row);

      for (i=0;i<data.results.length;i++ ) {
        row = $('<tr></tr>');
        for (j=0;j<listEntitySorted.length;j++ ) {
          var varEntity = listEntitySorted[j];
          row.append($('<td></td>').addClass("table-bordered").text(data.results[i][varEntity]));
          for (k in data.results_entity_attributes[varEntity]) {
            if ( isDisplayed(k) ) {
                row.append($('<td></td>').text(data.results[i][k]));
            }
          }
        }
        body.append(row);
      }

       $("#results").append(table.append(head).append(body));
      }
      /*
        var table = $('<table></table>').addClass('table').addClass('table-hover');
        var head = $('<thead></thead>');
        var body = $('<tbody></tbody');

        for(i=0; i<data.results.length; i++){
            var row = $('<tr></tr>');

            $.each(data.results[i], function(key, value) {
                if (i == 0) {
                    var column = $('<th></th>').addClass("tableHeader").text(key);
                    head.append(column);
                }

                var val = $('<td></td>').text(value);
                row.append(val);
            });

            if (i == 0) {
                table.append(head);
            }

            body.append(row);
        }

        $("#results").append(table.append(head).append(body));
        */
    } else {
        $("#results").append("No results have been found for this query.");
    }
}
