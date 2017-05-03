/*jshint esversion: 6 */
/**
 * Register event handlers for integration
 */
$(function () {

    // Generate preview data
    $("#content_integration").on('change', '.toggle_column_present', function(event) {
        var block = $(event.target).closest('.template-source_file');
        if (block.find('.preview_field').is(':visible')) {
            previewTtl(block);
        }
        checkData(block);
    });

    $("#content_integration").on('change', '.column_type', function(event) {
        var block = $(event.target).closest('.template-source_file');
        if (block.find('.preview_field').is(':visible')) {
            previewTtl(block);
        }
        checkData(block);
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
        loadSourceFile($(event.target).closest('.template-source_file'), false);
    });

    // Load the tsv file into the public graph
    $("#content_integration").on('click', '.load_data_tsv_public', function(event) {
        loadSourceFile($(event.target).closest('.template-source_file'), true);
    });

    $("#content_integration").on('click', '.load_data_gff', function() {
        let idfile = $(this).attr('id');
        loadSourceFileGff(idfile, false);
    });

    $("#content_integration").on('click', '.load_data_gff_public', function() {
        let idfile = $(this).attr('id');
        loadSourceFileGff(idfile, true);
    });

    $("#content_integration").on('click', '.load_data_ttl', function() {
        let idfile = $(this).attr('id');
        loadSourceFileTtl(idfile, false);
    });

    $("#content_integration").on('click', '.load_data_ttl_public', function() {
        let idfile = $(this).attr('id');
        loadSourceFileTtl(idfile, true);
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
    $("#content_integration").empty();
    if ( data.files === undefined ) return ;
    for (var i = data.files.length - 1; i >= 0; i--) {
        switch (data.files[i].type) {
            case 'tsv':
                displayTSVForm(data.files[i]);
            break;
            case 'gff':
                displayGffForm(data.files[i], data.taxons);
            break;
            case 'ttl':
                displayTtlForm(data.files[i]);
            break;
        }
    }
}

function getIdFile(file) {
  return file.name.split('.').join('_');
}

function displayTSVForm(file) {
    console.log('-+-+- displayTSVForm -+-+-');
    // tranform columns to rows
    if ('preview_data' in file) {
        file.preview_data = cols2rows(file.preview_data);
    }

    // User is admin if administration element is present in navbar
    let admin = false;
    if ($('#administration').length) {
        admin = true;
    }

    let source = $('#template-csv-form').html();
    let template = Handlebars.compile(source);

    let context = {idfile: getIdFile(file),file: file, admin: admin};
    let html = template(context);

    $("#content_integration").append(html);
    setCorrectType(file);
}

function displayGffForm(file, taxons) {
    console.log('-+-+- displayGffForm -+-+-');
    let source = $('#template-gff-form').html();

    let template = Handlebars.compile(source);

    // User is admin if administration element is present in navbar
    let admin = false;
    if ($('#administration').length) {
        admin = true;
    }

    let context = {idfile: getIdFile(file),file: file, taxons: taxons, admin: admin};
    let html = template(context);

    $("#content_integration").append(html);
}

function displayTtlForm(file) {
    console.log('--- displayTtlForm ---');
    let source = $('#template-ttl-form').html();
    let template = Handlebars.compile(source);

    // User is admin if administration element is present in navbar
    let admin = false;
    if ($('#administration').length) {
        admin = true;
    }

    let context = {idfile: getIdFile(file),file: file, admin: admin};
    let html = template(context);

    $('#content_integration').append(html);

    $('#source-file-ttl-' + getIdFile(file)).find(".preview_field").html(file.preview);
    $('#source-file-ttl-' + getIdFile(file)).find(".preview_field").show();
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
            var selectbox = $('div#content_integration form#source-file-tsv-' + getIdFile(file) + ' select.column_type:eq(' + i + ')');
            var values = selectbox.find("option").map(mapCallback);

            if ($.inArray(cols[i], ['start', 'end', 'numeric']) == -1) {
                $.each(['start', 'end', 'numeric'],getSelectCallback);
            }

            if ($.inArray( cols[i], values) >= 0) {
                selectbox.val(cols[i]);
            }

            // Check what is in the db
            checkData($('div#content_integration form#source-file-tsv-' + getIdFile(file)));
        }
    }


}

/**
 * Get ttl representation of preview data
 */
function previewTtl(file_elem) {
    console.log('---> previewTtl');

    var idfile = file_elem.find('.file_name').attr('id');

    // Get column types
    var col_types = file_elem.find('.column_type').map(function() {
        return $(this).val();
    }).get();

    // Find which column is disabled
    var disabled_columns = [];
    file_elem.find('.toggle_column_present').each(function( index ) {
        if (!$(this).is(':checked')) {
            disabled_columns.push(index + 1); // +1 to take into account the first non-disablable column
        }
    });

    let key_columns = [];
    file_elem.find('.toggle_column_key').each(function( index ) {
        if ($(this).is(':checked')) {
            key_columns.push(index); // +1 to take into account the first non-disablable column
        }
    });

    if ( key_columns.length <= 0 ) {
        __ihm.displayModal('Select one column to define a unique key', '', 'Close');
        return;
    }

    var service = new RestServiceJs("preview_ttl");
    var model = { 'file_name': $("#"+idfile).attr("filename"),
                  'col_types': col_types,
                  'key_columns' : key_columns,
                  'disabled_columns': disabled_columns };

    service.post(model, function(data) {
        if (data == 'forbidden') {
          __ihm.showLoginForm();
          return;
        }
        if (data == 'blocked') {
          __ihm.displayBlockedPage();
          return;
        }
        file_elem.find(".preview_field").html(data);
        file_elem.find(".preview_field").show();
    });
}

function hidePreview(file_elem) {
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
function checkData(file_elem) {

    let idfile = file_elem.find('.file_name').attr('id');
    let file_name = $("#"+idfile).attr("filename");

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
    file_elem.find('.toggle_column_present').each(function( index ) {
        if (!$(this).is(':checked')) {
            disabled_columns.push(index + 1); // +1 to take into account the first non-disablable column
        }
    });

    let key_columns = [];
    file_elem.find('.toggle_column_key').each(function( index ) {
        if ($(this).is(':checked')) {
            key_columns.push(index); // +1 to take into account the first non-disablable column
        }
    });

    if ( key_columns.length <= 0 ) {
        __ihm.displayModal('Select one column to define a unique key', '', 'Close');
        return;
    }
}

/**
 * Load a source_file into the triplestore
 */
function loadSourceFile(file_elem, pub) {
    console.log('---> loadSourceFile');

    let idfile = file_elem.find('.file_name').attr('id');

    // Get column types
    let col_types = file_elem.find('.column_type').map(function() {
        return $(this).val();
    }).get();

    // Find which column is disabled
    let disabled_columns = [];
    file_elem.find('.toggle_column_present').each(function( index ) {
        if (!$(this).is(':checked')) {
            disabled_columns.push(index + 1); // +1 to take into account the first non-disablable column
        }
    });

    let key_columns = [];
    file_elem.find('.toggle_column_key').each(function( index ) {
        if ($(this).is(':checked')) {
            key_columns.push(index); // +1 to take into account the first non-disablable column
        }
    });

    if ( key_columns.length <= 0 ) {
        __ihm.displayModal('Select one column to define a unique key', '', 'Close');
        return;
    }

    __ihm.displayModal('Please wait', '', 'Close');

    var service = new RestServiceJs("load_data_into_graph");
    var model = { 'file_name': $("#"+idfile).attr("filename"),
                  'col_types': col_types,
                  'disabled_columns': disabled_columns,
                  'key_columns':key_columns,
                  'public': pub};

    service.post(model, function(data) {
        __ihm.hideModal();

        if (data == 'forbidden') {
          showLoginForm();
          return;
        }
        if (data == 'blocked') {
          displayBlockedPage($('.username').attr('id'));
          return;
        }

        var insert_status_elem = file_elem.find(".insert_status").first();
        var insert_warning_elem = file_elem.find(".insert_warning").first();
        if (data.status != "ok") {
            insert_warning_elem.empty();
            insert_warning_elem.removeClass('hidden alert-success')
                              .addClass('show alert-danger');

            insert_warning_elem.append($('<span class="glyphicon glyphicon glyphicon-exclamation-sign"></span>')).
                               append($('<p></p>').html(data.error).addClass('show alert-danger'));
            if ('url' in data) {
                insert_warning_elem.append("<br>ttl file are available here: <a href=\""+data.url+"\">"+data.url+"</a>");
            }

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
            checkData(file_elem);
        });
    });

    __ihm.resetStats();
}

/**
 * Load a GFF source_file into the triplestore
 */
function loadSourceFileGff(idfile, pub) {
    console.log('-----> loadSourceFileGff <----- :');
    // get taxon
    let taxon = '';

    let file_elem = $("#source-file-gff-" + idfile);

    // get the taxon in the selector or in the input field
    taxon = $('#' + idfile + '-selector').val();
    if ( taxon === null || taxon === undefined) {
        taxon = $('#tax-'+idfile).val();
    }

    // get entities
    let entities = [];

    $("#"+idfile+" > label > input").each(function() {
        if ($(this).is(":checked")) {
            entities.push($(this).attr('id'));
        }
    });

    __ihm.displayModal('Please wait', '', 'Close');

    let service = new RestServiceJs("load_gff_into_graph");

    let model = { 'file_name': $("#"+idfile).attr("filename"),
                  'taxon': taxon,
                  'entities': entities,
                  'public': pub  };

    service.post(model, function(data) {
        if (data == 'forbidden') {
          showLoginForm();
          return;
        }
        if (data == 'blocked') {
          displayBlockedPage($('.username').attr('id'));
          return;
        }
        // Show a success message isertion is OK
        let div_entity = $("#" + idfile);
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

        let insert_status_elem = file_elem.find(".insert_status").first();
        let insert_warning_elem = file_elem.find(".insert_warning").first();

        //TODO: check if insertion is ok and then, display the success message or a warning message
        if (data.error) {
            insert_status_elem.html('<strong><span class="glyphicon glyphicon-exclamation-sign"></span> ERROR:</strong> ' + JSON.stringify(data.error))
                              .removeClass('hidden alert-success')
                              .removeClass('hidden alert-warning')
                              .addClass('show alert-danger');
        }else{
            insert_status_elem.html('<span class="glyphicon glyphicon-ok"></span> ' + entities_string + ' inserted with success.')
                                                  .removeClass('hidden alert-danger')
                                                  .removeClass('hidden alert-warning')
                                                  .addClass('show alert-success');
        }

        __ihm.hideModal();
    });
}

function loadSourceFileTtl(idfile, pub) {
    console.log('--- loadSourceFileTtl ---');
    __ihm.displayModal('Please wait', '', 'Close');

    let file_elem = $("#source-file-ttl-" + idfile);

    let service = new RestServiceJs('load_ttl_into_graph');
    let model = {
      'file_name' : $("#"+idfile).attr("filename"),
      'public': pub
    };

    service.post(model, function(data) {
        console.log('---> ttl insert');
        if (data == 'forbidden') {
          showLoginForm();
          return;
        }
        if (data == 'blocked') {
          displayBlockedPage($('.username').attr('id'));
          return;
        }

        let insert_status_elem = file_elem.find(".insert_status").first();
        let insert_warning_elem = file_elem.find(".insert_warning").first();

        if (data.error) {
            insert_status_elem.html('<strong><span class="glyphicon glyphicon-exclamation-sign"></span> ERROR:</strong> ' + JSON.stringify(data.error))
                              .removeClass('hidden alert-success')
                              .removeClass('hidden alert-warning')
                              .addClass('show alert-danger');
        }else{
            insert_status_elem.html('<span class="glyphicon glyphicon-ok"></span> ' + idfile + ' inserted with success.')
                                                  .removeClass('hidden alert-danger')
                                                  .removeClass('hidden alert-warning')
                                                  .addClass('show alert-success');
        }
        __ihm.hideModal();
    });
}
