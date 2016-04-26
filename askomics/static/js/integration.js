/**
 * Register event handlers for integration
 */
$(function () {

    // Generate preview data
    $("#content_integration").on('change', '.toggle_column', function(event) {
        previewTtl($(event.target).parent('.template-source_file'));
    });

    $("#content_integration").on('change', '.column_type', function(event) {
        previewTtl($(event.target).parent('.template-source_file'));
    });

    $("#content_integration").on('click', '.preview_button', function(event) {
        previewTtl($(event.target).parent('.template-source_file'));
    });

    $("#content_integration").on('click', '.load_data', function(event) {
        loadSourceFile($(event.target).parent('.template-source_file'));
    });
});

/**
 * Transform an array of column content to an array of row content
 */
function cols2rows(items) {
    var out = [];

    for(var i=0, l=items.length; i<l; i++) {
        for(var j=0, m=items[i].length; j<m; j++) {
            if (!(j in out))  {
                out[j] = []
            }
            out[j][i] = items[i][j];
        }
    }

    return out;
}

/**
 * Show preview data on the page
 */
function displayTable(data) {
    // Transform columns to rows
    for(var i=0, l=data.files.length; i<l; i++) {
        if ('preview_data' in data.files[i]) {
            data.files[i]['preview_data'] = cols2rows(data.files[i]['preview_data']);
        }
    }

    // display received data
    var template = $('#template-source_file-preview').html();

    var templateScript = Handlebars.compile(template);
    var html = templateScript(data);

    $("#content_integration").html(html);
}

/**
 * Get ttl representation of preview data
 */
function previewTtl(file_elem) {

    // Get column types
    file_name = file_elem.find('.file_name').text();

    col_types = file_elem.find('.column_type').map(function() {
        return $(this).val();
    }).get();

    var service = new RestServiceJs("preview_ttl");
    var model = { 'file_name': file_name,
                  'col_types': col_types };

    service.post(model, function(src) {
        $('#ttl_' + idValidName).html(turtle_template + src.attribute_code + src.relation_code + src.domain_code);
        for (var header of src.present_headers) {
            $('#' + idValidName + "_" + header).attr("bgcolor", "green");
        }
        for (var n_header of src.new_headers) {
            $('#' + idValidName + "_" + n_header).attr("bgcolor", "blue");
        }
    });


// FIXME debug
    return true;



    // Conversion to turtle
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
}

/**
 * Load a source_file into the triplestore
 */
function loadSourceFile(file_elem) {

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
