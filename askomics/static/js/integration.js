/*jshint esversion: 6 */
/**
 * Register event handlers for integration
 */
$(function () {

    // Generate preview data
    $("#content_integration").on('change', '.toggle_column', function(event) {
        var block = $(event.target).closest('.template-source_file');
        if (block.find('.preview_field').is(':visible')) {
            previewTtl(block);
        }
        checkExistingData(block);
    });

    $("#content_integration").on('change', '.column_type', function(event) {
        var block = $(event.target).closest('.template-source_file');
        if (block.find('.preview_field').is(':visible')) {
            previewTtl(block);
        }
        checkExistingData(block);
    });

    $("#content_integration").on('click', '.preview_button', function(event) {
        var block = $(event.target).closest('.template-source_file');
        if (block.find('.preview_field').is(':visible')) {
            hidePreview(block);
        }else{
            previewTtl(block);
        }
    });

    $("#content_integration").on('click', '.load_data_tsv', function(event) {
        loadSourceFile($(event.target).closest('.template-source_file'));
    });

    $("#content_integration").on('click', '.load_data_gff', function() {
        let filename = $(this).attr('id');
        loadSourceFileGff(filename);
    });

    // $('.taxon-selector').change(function() {
    //     console.log('---> ' + $(this).val);
    // });
});

/**
 * Transform an array of column content to an array of row content
 */
function cols2rows(items) {
    var out = [];

    for(var i=0, l=items.length; i<l; i++) {
        for(var j=0, m=items[i].length; j<m; j++) {
            if (!(j in out))  {
                out[j] = [];
            }
            out[j][i] = items[i][j];
        }
    }

    return out;
}

function displayIntegrationForm(data) {
    console.log('--- displayIntegrationForm ---');
    $("#content_integration").empty();
    for (var i = data.files.length - 1; i >= 0; i--) {
        switch (data.files[i].type) {
            case 'tsv':
                displayTSVForm(data.files[i]);
            break;
            case 'gff':
                displayGffForm(data.files[i], data.taxons);
            break;
        }
    }
}


function displayTSVForm(file) {
    console.log('-+-+- displayTSVForm -+-+-');
    // tranform columns to rows
    if ('preview_data' in file) {
        file.preview_data = cols2rows(file.preview_data);
    }

    let source = $('#template-csv-form').html();
    let template = Handlebars.compile(source);

    let context = {file: file};
    let html = template(context);

    $("#content_integration").append(html);
    setCorrectType(file);
}

function displayGffForm(file, taxons) {
    console.log('-+-+- displayGffForm -+-+-');
    let source = $('#template-gff-form').html();
    let template = Handlebars.compile(source);

    let context = {file: file, taxons: taxons};
    let html = template(context);

    $("#content_integration").append(html);
}

function setCorrectType(file) {
    console.log('--- setCorrectType ---');

    function mapCallback() {
        return $(this).val();
    }

    function getSelectCallback(index, value) {
        selectbox.find("option[value="+value+"]").hide();
    }

    if ('column_types' in file) {
        var cols = file.column_types;
        for(let i=0; i<cols.length; i++) {
            var selectbox = $('div#content_integration form#source-file-' + file.name + ' select.column_type:eq(' + i + ')');
            var values = selectbox.find("option").map(mapCallback);

            if ($.inArray(cols[i], ['start', 'end', 'numeric']) == -1) {
                $.each(['start', 'end', 'numeric'],getSelectCallback);
            }

            if ($.inArray(cols[i], ['entityGoterm']) == -1) {
                $.each(['entityGoterm'],getSelectCallback);
            }

            if ($.inArray( cols[i], values) >= 0) {
                selectbox.val(cols[i]);
            }

            // Check what is in the db
            checkExistingData($('div#content_integration form#source-file-' + file.name));
        }
    }


}


/**
 * Insert TTL file
 * FIXME: change function's name
 */
function displayTableRDF(data) {
  let info = "";//$('<div></div>');
  for(let i=0;i<data.files.length;i++) {
    info+="Insertion of "+ data.files[i].filename+".\n";
  }
  displayModal(info, '', 'Close');
  if (data.error !== undefined ) alert(JSON.stringify(data.error));
}


/**
 * Get ttl representation of preview data
 */
function previewTtl(file_elem) {

    var file_name = file_elem.find('.file_name').text();

    // Get column types
    var col_types = file_elem.find('.column_type').map(function() {
        return $(this).val();
    }).get();

    // Find which column is disabled
    var disabled_columns = [];
    file_elem.find('.toggle_column').each(function( index ) {
        if (!$(this).is(':checked')) {
            disabled_columns.push(index + 1); // +1 to take into account the first non-disablable column
        }
    });

    var service = new RestServiceJs("preview_ttl");
    var model = { 'file_name': file_name,
                  'col_types': col_types,
                  'disabled_columns': disabled_columns };

    service.post(model, function(data) {
        file_elem.find(".preview_field").html(data);
        file_elem.find(".preview_field").show();
    });
}

function hidePreview(file_elem) {
    var file_name = file_elem.find('.file_name').text();
    file_elem.find(".preview_field").hide();
}

// Function to find if array contain all values of a list

function containAll(Array1,Array2){
    for(let i = 0 ; i<Array2.length ; i++){
        if($.inArray(Array2[i], Array1) == -1) {
            return false;
        }
    }
    return true;
}

// Function to find if array contain any values of a list

 function containAny(Array1,Array2){
    for(let i = 0;i< Array2.length; i++){
        if($.inArray(Array2[i], Array1) != -1) {
            return true;
        }
    }
    return false;
}

/**
 * Compare the user data and what is already in the triple store
 */
function checkExistingData(file_elem) {

    var file_name = file_elem.find('.file_name').text();

    // Get column types
    var col_types = file_elem.find('.column_type').map(function() {
        return $(this).val();
    }).get();

    // check if all positionable attributes are set
    var warning_elem = file_elem.find(".warning-message").first();

    if (containAll(col_types,['start', 'end'])) {//positionable entity with all attributes
        warning_elem.html("").removeClass("show").addClass("hidden");
    }else{
        if (containAny(col_types,['start', 'end', 'ref', 'taxon'])) { //positionable entity with missing attributes
            warning_elem.html('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> Missing positionable attributes for '+file_name)
                                .removeClass('hidden')
                              .addClass("show alert alert-danger");
        }else{ //not a positionable entity
            warning_elem.html("").removeClass("show").addClass("hidden");
        }
    }

    // Find which column is disabled
    var disabled_columns = [];
    file_elem.find('.toggle_column').each(function( index ) {
        if (!$(this).is(':checked')) {
            disabled_columns.push(index + 1); // +1 to take into account the first non-disablable column
        }
    });

    var service = new RestServiceJs("check_existing_data");
    var model = { 'file_name': file_name,
                  'col_types': col_types,
                  'disabled_columns': disabled_columns };

    service.post(model, function(data) {
        file_elem.find('.column_header').each(function( index ) {
            if (data.headers_status[index-1] == 'present') {
                $(this).find("#relation_present").first().show();
                $(this).find("#relation_new").first().hide();
            }
            else {
                $(this).find("#relation_present").first().hide();
                $(this).find("#relation_new").first().show();
            }
        });

        var insert_warning_elem = file_elem.find(".insert_warning").first();
        if (data.missing_headers.length > 0) {
            insert_warning_elem.html("<strong>The following columns are missing:</strong> " + data.missing_headers.join(', '))
                              .removeClass("hidden alert-success")
                              .removeClass("hidden alert-danger")
                              .addClass("show alert-warning");
        }
    });
}

/**
 * Load a source_file into the triplestore
 */
function loadSourceFile(file_elem) {

    var file_name = file_elem.find('.file_name').text();

    // Get column types
    var col_types = file_elem.find('.column_type').map(function() {
        return $(this).val();
    }).get();

    // Find which column is disabled
    var disabled_columns = [];
    file_elem.find('.toggle_column').each(function( index ) {
        if (!$(this).is(':checked')) {
            disabled_columns.push(index + 1); // +1 to take into account the first non-disablable column
        }
    });

    displayModal('Please wait', '', 'Close');

    var service = new RestServiceJs("load_data_into_graph");
    var model = { 'file_name': file_name,
                  'col_types': col_types,
                  'disabled_columns': disabled_columns  };

    service.post(model, function(data) {
        hideModal();
        var insert_status_elem = file_elem.find(".insert_status").first();
        var insert_warning_elem = file_elem.find(".insert_warning").first();
        if (data.status != "ok") {
            alert(data.error);
            insert_warning_elem.append('<span class="glyphicon glyphicon glyphicon-exclamation-sign"></span>')
                               .html(data.error);

            if ('url' in data) {
                insert_warning_elem.append("<br>You can view the ttl file here: <a href=\""+data.url+"\">"+data.url+"</a>");
            }
            insert_status_elem.removeClass('hidden alert-success')
                              .addClass('show alert-danger');
        }
        else {
            if($.inArray('entitySym', col_types) != -1) {
                if (data.expected_lines_number*2 == data.total_triple_count) {
                    insert_status_elem.html('<strong><span class="glyphicon glyphicon-ok"></span> Success:</strong> inserted '+ data.total_triple_count + " lines of "+(data.expected_lines_number*2))
                                      .removeClass('hidden alert-danger')
                                      .removeClass('hidden alert-warning')
                                      .addClass('show alert-success');

                }else{
                    insert_status_elem.html('<strong><span class="glyphicon glyphicon-exclamation-sign"></span> Warning:</strong> inserted '+ data.total_triple_count*2 + " lines of "+data.expected_lines_number)
                                      .removeClass('hidden alert-success')
                                      .removeClass('hidden alert-warning')
                                      .addClass('show alert-danger');
                }
            }else{
                if (data.expected_lines_number == data.total_triple_count) {
                    insert_status_elem.html('<strong><span class="glyphicon glyphicon-ok"></span> Success:</strong> inserted '+ data.total_triple_count + " lines of "+data.expected_lines_number)
                                      .removeClass('hidden alert-danger')
                                      .removeClass('hidden alert-warning')
                                      .addClass('show alert-success');
                }else{
                    insert_status_elem.html('<strong><span class="glyphicon glyphicon-exclamation-sign"></span> Warning:</strong> inserted '+ data.total_triple_count + " lines of "+data.expected_lines_number)
                                      .removeClass('hidden alert-success')
                                      .removeClass('hidden alert-warning')
                                      .addClass('show alert-danger');
                }

            }
        }

        // Check what is in the db now
        $('.template-source_file').each(function( index ) {
            checkExistingData($(this));
        });
    });

    // when user upload a file, reset the stats and clear the results table
    // (it no longer reflects reality)
    if (!$('#results').is(':empty')){
        $("#results").empty();
    }
    resetStats();
}

/**
 * Load a GFF source_file into the triplestore
 */
function loadSourceFileGff(filename) {
    console.log('-----> loadSourceFileGff <-----');
    // get taxon
    let taxon = '';

    // get the taxon in the selector or in the input field
    if ($('#' + filename + '-selector').val() === null || $('#' + filename + '-selector').val() === undefined) {
        taxon = $('#tax-'+filename).val();
    }else{
        taxon = $('#' + filename + '-selector').val();
    }

    // get entities
    let entities = [];

    $("#"+filename+" > label > input").each(function() {
        if ($(this).is(":checked")) {
            entities.push($(this).attr('id'));
        }
    });

    displayModal('Please wait', '', 'Close');

    let service = new RestServiceJs("load_gff_into_graph");
    let model = { 'file_name': filename,
                  'taxon': taxon,
                  'entities': entities  };

    service.post(model, function(data) {
        // Show a success message isertion is OK
        let div_entity = $("#" + filename);
        let entities_string = '';
        for (var i = 0; i < entities.length; i++) {
            entities_string += '<b>' + entities[i] + '</b>';
            if (i != entities.length - 2 && i != entities.length -1) {
                entities_string += ', ';
            }
            if (i == entities.length - 2) {
                entities_string += ' and ';
            }
        }

        let success_div = $('<div></div>').attr('class', 'alert alert-success')
                                          .attr('role', 'alert')
                                          .append($('<span></span>').attr('class', 'glyphicon glyphicon-ok'))
                                          .append(' ' + entities_string + ' inserterd with success.');

        div_entity.append(success_div);

        hideModal();
    });
}
