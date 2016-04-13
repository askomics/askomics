
function formatValidIdNameFile(filename) {
  var idValidName = filename.replace(".","_dot_");
  return idValidName;
}

function displayTable(src) {
    // Create the tables giving an overview of the tabulated files to convert.
    $('div#content_integration').empty().data({ turtle_template: src.turtle_template });
    var htmlCode = "";

    $.each(src.sourceFiles, function(key, value) {

        var idValidName = formatValidIdNameFile(value.name);
        for (var line of src.html_template.slice(0,8)) {
            htmlCode += line.replace(/#FILENAME#/g, value.name);
        }
        var cpt = 0;
        //var headers = [];
        for (var line of value.content) {
            if (cpt == 1) {
                htmlCode += "                            <tr id='colType_" + idValidName + "'>";// style='display: none'
            } else {
                htmlCode += "                            <tr>";
            }
            var colCpt = 0;
            for (var cell of line) {
                if (cpt === 0) {
                    htmlCode += "<td id=\"" + idValidName + "_" + cell + "\"><label>";
                    // If First Colonne (Entity)
                    if (colCpt === 0) {
                        // we hide the checkbox
                        htmlCode += "<input type='checkbox' style='display:none' id='header_" + idValidName + "_" + colCpt + "' value=" + colCpt + " onchange='fillTtl(\"" + value.name + "\")' checked /> ";
                    } else {
                        htmlCode += "<input type='checkbox' id='header_" + idValidName + "_" + colCpt + "' value=" + colCpt + " onchange='fillTtl(\"" + value.name + "\")' checked /> ";
                    }
                    htmlCode += cell + "</label></td>";
                } else if (cpt == 1) {
                  //  $('input[name=radioName]:checked').val()
                      // The first colonne is the Entity, so only possibility:  Entity , Entity (Start)
                      if (colCpt === 0) {
                        htmlCode += "<td><select id='type_" + idValidName + "_" + colCpt + "' onchange='fillTtl(\"" + value.name + "\")'><optgroup label='Relationship'><option>Entity (Start)</option><option>Entity</option></optgroup></select></td>".replace(cell, " selected" + cell);
                      } else {
                        htmlCode += "<td><select id='type_" + idValidName + "_" + colCpt + "' onchange='fillTtl(\"" + value.name + "\")'><optgroup label='Attributes'><option>Numeric</option><option>Text</option><option>Category</option></optgroup><optgroup label='Relationship'><option>Entity</option></optgroup></optgroup></select></td>".replace(cell, " selected" + cell);
                      }
                } else {
                    htmlCode += "<td>" + cell + "</td>";
                }
                colCpt++;
            }
            htmlCode += "</tr>\n";
            cpt++;
        }

        for (var line of src.html_template.slice(8,12)) {
            htmlCode += line.replace(/#FILENAME#/g, value.name);
        }
        for (var line of src.turtle_template) {
            htmlCode += line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        for (var line of src.html_template.slice(12,19)) {
            htmlCode += line.replace(/#FILENAME#/g, value.name);
        }
    });
    $('div#content_integration').html(htmlCode);
}

function fillTtl(file_name, limit) {

    var idValidName = formatValidIdNameFile(file_name);
    // Conversion to turtle
    if (typeof limit === 'undefined') { limit = true; }
    var turtle_template = "";
    for (var line of $("#content_integration").data().turtle_template) {
        turtle_template += line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    var rawLength = ($("#colType_" + idValidName).html().match(/<td>/g) || []).length;
    var col_types = {};

    for (var i = 0; i < rawLength; i++) {
        if ($('#header_' + idValidName + '_' + i).prop('checked')) {
            col_types[i] = ($('#type_' + idValidName + '_' + i).find(":selected").html());
        }
    }

    if (! limit)
      $('#waitModal').modal('show');

    var service = new RestServiceJs("load_data_into_graph");
    var model = { 'file_name': file_name,
                  'col_types': col_types,
                  'limit': limit };

    service.post(model, function(src) {
        $('#ttl_' + idValidName).html(turtle_template + src.attribute_code + src.relation_code + src.domain_code);
        for (var header of src.present_headers) {
            $('#' + idValidName + "_" + header).attr("bgcolor", "green");
        }
        for (var n_header of src.new_headers) {
            $('#' + idValidName + "_" + n_header).attr("bgcolor", "blue");
        }

        if (! limit) {
          $('#waitModal').modal('hide');

          var serviceClean = new RestServiceJs("clean_ttl_directory");
          var modelClean = { 'files_to_delete' : src.temp_ttl_file};
          serviceClean.post(modelClean, function(src) {
              console.log("clean ttl directory...");
            });
        }
    });
}
