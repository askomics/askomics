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
        // get headers
        let headers = [];
        let form = $(event.target).closest('.template-source_file');
        form.find($('.header-text')).each(function(){
            headers.push($(this).val());
        });
        loadSourceFile($(event.target).closest('.template-source_file'), false, headers);
        // disable the button and add a message
        $(this).addClass("disabled", true);
        form.find($('.alert-info')).html("Loading tsv in private graph").removeClass("hidden");
    });

    // Load the tsv file into the public graph
    $("#content_integration").on('click', '.load_data_tsv_public', function(event) {
        // get headers
        let headers = [];
        let form = $(event.target).closest('.template-source_file');
        form.find($('.header-text')).each(function(){
            headers.push($(this).val());
        });
        loadSourceFile($(event.target).closest('.template-source_file'), true, headers);
        // disable the button and add a message
        $(this).addClass("disabled", true);
        form.find($('.alert-info')).html("Loading tsv in public graph").removeClass("hidden");
    });

    $("#content_integration").on('click', '.load_data_gff', function() {
        let idfile = $(this).attr('id');
        loadSourceFileGff(idfile, false);
        // disable the button and add a message
        $(this).addClass("disabled", true);
        form.find($('.alert-info')).html("Loading gff in private graph").removeClass("hidden");
    });

    $("#content_integration").on('click', '.load_data_gff_public', function() {
        let idfile = $(this).attr('id');
        loadSourceFileGff(idfile, true);
        // disable the button and add a message
        $(this).addClass("disabled", true);
        form.find($('.alert-info')).html("Loading gff in public graph").removeClass("hidden");
    });

    $("#content_integration").on('click', '.load_data_ttl', function() {
        let idfile = $(this).attr('id');
        loadSourceFileTtl(idfile, false);
        // disable the button and add a message
        $(this).addClass("disabled", true);
        form.find($('.alert-info')).html("Loading ttl in private graph").removeClass("hidden");
    });

    $("#content_integration").on('click', '.load_data_ttl_public', function() {
        let idfile = $(this).attr('id');
        loadSourceFileTtl(idfile, true);
        // disable the button and add a message
        $(this).addClass("disabled", true);
        form.find($('.alert-info')).html("Loading ttl in public graph").removeClass("hidden");
    });

    $("#content_integration").on('click', '.load_data_bed', function() {
        let idfile = $(this).attr('id');
        loadSourceFileBed(idfile, false);
        // disable the button and add a message
        $(this).addClass("disabled", true);
        form.find($('.alert-info')).html("Loading bed in private graph").removeClass("hidden");
    });

    $("#content_integration").on('click', '.load_data_bed_public', function() {
        let idfile = $(this).attr('id');
        loadSourceFileBed(idfile, true);
        // disable the button and add a message
        $(this).addClass("disabled", true);
        form.find($('.alert-info')).html("Loading bed in public graph").removeClass("hidden");
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
                out[j] = [];
            }
            // only 205 first chars. if more, append "..."
            if (items[i][j].length > 25) {
               items[i][j] = items[i][j].substring(0, 25) + "...";
            }
            out[j][i] = items[i][j];
        }
    }

    return out;
}

function displayIntegrationForm(data) {
    $("#content_integration").empty();
    if ( 'error' in data ) {
      let template = AskOmics.templates.error_message;
      let context = { message: data.error };
      let html = template(context);
      $("#content_integration").append(html);
    }

    if ( data.files === undefined ) return ;

    let dataprefix = updatePrefixListFromDatabase();

    for (var i = data.files.length - 1; i >= 0; i--) {
        switch (data.files[i].type) {
            case 'tsv':
                displayTSVForm(data.files[i]);
                updatePrefixListUriCsvForm(data.files[i],dataprefix);
            break;
            case 'gff':
                displayGffForm(data.files[i], data.taxons);
            break;
            case 'ttl':
                displayTtlForm(data.files[i]);
            break;
            case 'bed':
                displayBedForm(data.files[i], data.taxons);
            break;
        }
    }
}

function getIdFile(file) {
    // replace non a-z A-Z 0-9 char to _
    return file.name.replace(/[^a-zA-Z0-9]/g, '_');
}

function updatePrefixListFromDatabase() {
  console.log('----> updatePrefixListFromDatabase <---- ');
  // we proposed all uri finded in database
  let service = new RestServiceJs("prefix_uri");
  let model = { };
  let results ;

  service.postsync(model, function(data) {
      results = data ;
  });
  return results;
}

function displayTSVForm(file) {
    console.log('diplay tsv form for file ' + file.name);
    // tranform columns to rows
    if ('preview_data' in file) {
        file.preview_data = cols2rows(file.preview_data);
    }

    let admin = __ihm.user.admin;

    let template = AskOmics.templates.csv_form;

    let context = {idfile: getIdFile(file),file: file, admin: admin};
    let html = template(context);

    $("#content_integration").append(html);
    setCorrectType(file);
}

function displayGffForm(file, taxons) {
    let template = AskOmics.templates.gff_form;

    let admin = __ihm.user.admin;

    if ( ! ('entities' in file) ) {
      let template = AskOmics.templates.error_message;

      let context = {} ;
      if ( 'error' in file ) {
        context = { message: '['+file.name +']: '+file.error };
      }
      else
        context = { message: '['+file.name +']: None entities are defined in this Gff File ' };

      let html = template(context);
      $("#content_integration").append(html);
      return;
    }

    file.entities = file.entities.sort();

    let context = {idfile: getIdFile(file),file: file, taxons: taxons.sort(), admin: admin};
    let html = template(context);

    $("#content_integration").append(html);
}

function displayTtlForm(file) {
    let template = AskOmics.templates.ttl_form;

    let admin = __ihm.user.admin;

    let context = {idfile: getIdFile(file),file: file, admin: admin};
    let html = template(context);

    $('#content_integration').append(html);

    $('#source-file-ttl-' + getIdFile(file)).find(".preview_field").html(file.preview);
    $('#source-file-ttl-' + getIdFile(file)).find(".preview_field").show();
}

function displayBedForm(file, taxons) {
    let template = AskOmics.templates.bed_form;

    let admin = __ihm.user.admin;

    file.label = file.name.replace(/\.[^/.]+$/, "");

    let context = {idfile: getIdFile(file),file: file, taxons: taxons.sort(), admin: admin};
    let html = template(context);

    $('#content_integration').append(html);
}

function updatePrefixListUriCsvForm(file,data) {
  if ( data.length <= 0 ) {
    throw Exception("Bad use of updatePrefixListUriCsvForm  data ==>"+JSON.stringify(data));
  }

  let idfile = getIdFile(file) ;
  let filter = 'div#content_integration ';
    filter += 'form#source-file-tsv-' + idfile ;
    filter += ' select.uri_entity' ;

  let selectbox = $( filter ).each(function(i) {
  let curSelect = $(this);
  curSelect.empty();

  /*
    special input tag for the first column which defined the entity
    user can choose from the database list or create a new one.
    we use the autocomplete functionnality from jquery-ui
  */


  if ( i === 0 ) {
      let inp = $('<input type="text"/>')
                     .attr("id","def-uri-entity-"+idfile)
                     .addClass('uri_entity')
                     .addClass('form-control')
                     .addClass('input-sm');

      curSelect.after(inp);
      curSelect.remove();

      let availableTags = [];
      let listAvailableTags = {} ;

      let base = data.__default__;
      availableTags.push(base);

      listAvailableTags[base] = 0;
      inp.val(base);

      for (let key in data ) {
        if (key == '__default__') continue;
        for (let element in data[key] ) {
          if (! (data[key][element] in listAvailableTags) ) {
            let v = data[key][element];
            listAvailableTags[v] = 0;
            availableTags.push(v);
          }
        }
      }

      inp.autocomplete({
        source: availableTags
      }).change(function() {
        let val = $(this).val();
        if (val.trim().substring(0, 7) != "http://")
          $(this).val( "http://" + val.trim()) ;
      }).click(function() {
      /* add potential */
        $('input[id^="def-uri-entity"]').map(function() {
          if ( !( $(this).val() in listAvailableTags) ) {
            listAvailableTags[$(this).val()] = 0;
            availableTags.push($(this).val());
          }
          $(this).autocomplete({
            source: availableTags
          });
        });
      });

    } else {
      if ( file.column_types[i] != 'entity_start' &&
           file.column_types[i] != 'entity' &&
           file.column_types[i] != 'entitySym') {
        curSelect.attr('disabled', true);
        curSelect.hide();
        return ;
      }
      let entity = file.headers[i].substring(file.headers[i].indexOf("@")+1);

      if (entity in data ) {
          data[entity].forEach(function(element) {
            curSelect.append($("<option></option>").val(element).html(element));
          });
      } else { // this entity does not exist in database
         curSelect.append($("<option></option>").val(data.__default__).html(data.__default__));
      }
      /* if same type entity than the first column maybe a new uri exist... */
      // modif Mars 2018 => URI modified by user in first column is available on the other 'relation' column
      let first_entity = file.headers[0].substring(file.headers[0].indexOf("@")+1);
      //if (first_entity == entity ) {
        curSelect.click(function() {
          /* check input uri tag of the current entity definition and propose  */
          let newuri = $('#def-uri-entity-' +idfile).val();
          /* remove unconsistent uri */
          curSelect.find('option[volatile="true"]').map(function() {
            if ( $(this).val() != newuri ) $(this).remove();
          });

          let exist = false ;
          curSelect.find('option').map(function() {
            if ($(this).val() == newuri ) exist = true ;
          });
          if (! exist ) {
            curSelect.append($("<option></option>").val(newuri)
                                                   .html(newuri)
                                                   .attr('volatile','true'));
          }
        });
      //}
    }
  });
}

function setCorrectType(file) {

    if ('column_types' in file) {

      /* set the associate column type in IHM and remove numeric type as proposition if needed */
      /* ----------- */
      let idfile = getIdFile(file) ;
      let filter = 'div#content_integration ';
      filter += 'form#source-file-tsv-' + idfile ;
      filter += ' select.column_type' ;

      let selectbox = $( filter ).each(function(i) {
        let typ = file.column_types[i];
        if (! (typ in ['start', 'end', 'numeric']) ){
          $(this).find("option[value=start][value=end][value=numeric]").hide();
        }
        $(this).val(typ);
      });
      // Check what is in the db
      checkData($('div#content_integration form#source-file-tsv-' + idfile));
    }
}

function getIhmTtlElements(file_elem) {
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

  // custom uri
  let uri = file_elem.find('#def-uri-entity-'+idfile).val();

  let uri_def = {} ;
  file_elem.find('.uri_entity').map(function(idx) {
    let v = $(this).val() ;
    uri_def[idx] = v;
  });

  if ( key_columns.length <= 0 ) {
    __ihm.displayModal('Select one column to define a unique key', '', 'Close');
    return;
  }

  return {
        idfile: idfile,
        col_types: col_types,
        disabled_columns: disabled_columns,
        key_columns: key_columns,
        uris: uri_def
    };
}

/**
 * Get ttl representation of preview data
 */
function previewTtl(file_elem) {
    let idfile,col_types,disabled_columns,key_columns,uri;
    let tags = getIhmTtlElements(file_elem);

    let service = new RestServiceJs("preview_ttl");
    let model = { 'file_name': $("#"+tags.idfile).attr("filename"),
                  'col_types': tags.col_types,
                  'key_columns' : tags.key_columns,
                  'disabled_columns': tags.disabled_columns,
                  'uris': tags.uris };

    service.post(model, function(data) {
        let insert_warning_elem = file_elem.find(".insert_warning").first();
        if (data.error) {

            insert_warning_elem.removeClass('hidden alert-success')
                               .addClass('show alert-danger');

            insert_warning_elem.html('<strong><span class="glyphicon glyphicon-exclamation-sign"></span> ERROR:</strong> ' + JSON.stringify(data.error))
                              .removeClass('hidden alert-success')
                              .removeClass('hidden alert-warning')
                              .addClass('show alert-danger');
            return ;
        }

        insert_warning_elem.removeClass('hidden alert-danger');

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

    if (containAll(col_types,['start', 'end', 'strand', 'ref'])) {//positionable entity with all attributes
        warning_elem.html("").removeClass("show").addClass("hidden");
    }else{
        if (containAny(col_types,['start', 'end', 'ref', 'taxon', 'strand'])) { //positionable entity with missing attributes
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
function loadSourceFile(file_elem, pub, headers) {
    let idfile,col_types,disabled_columns,key_columns,uri;
    let tags = getIhmTtlElements(file_elem);

    let service = new RestServiceJs("load_data_into_graph");
    let model = { 'file_name': $("#"+tags.idfile).attr("filename"),
                  'headers': headers,
                  'col_types': tags.col_types,
                  'disabled_columns': tags.disabled_columns,
                  'key_columns':tags.key_columns,
                  'public': pub,
                  'uris': tags.uris};

    service.post(model, function(data) {
      new AskomicsJobsViewManager().loadjob().then(function () {
        new AskomicsJobsViewManager().update_jobview ();
      });
    });

    __ihm.resetStats();
}

/**
 * Load a GFF source_file into the triplestore
 */
function loadSourceFileGff(idfile, pub) {

  console.log('-----> loadSourceFileGff <----- ');
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

  // custom uri
  let typeR = file_elem.find('input[name="radio-uri-'+idfile+'"]:checked').val();

  let uri = null;
  if (typeR == "custom") {
    uri = file_elem.find('#custom-uri-'+idfile).val();
    uri = uri.replace("http://","");
    uri = "http://"+uri;
  }

  let service = new RestServiceJs("load_gff_into_graph");

  let model = { 'file_name': $("#"+idfile).attr("filename"),
                  'taxon': taxon,
                  'entities': entities,
                  'public': pub,
                  'uri': uri};

  service.post(model, function(data) {
    new AskomicsJobsViewManager().loadjob().then(function () {
      new AskomicsJobsViewManager().update_jobview ();
    });
  });
}

function loadSourceFileTtl(idfile, pub) {

  let file_elem = $("#source-file-ttl-" + idfile);

  let service = new RestServiceJs('load_ttl_into_graph');
  let model = {
      'file_name' : $("#"+idfile).attr("filename"),
      'public': pub
  };

  service.post(model, function(data) {
    new AskomicsJobsViewManager().loadjob().then(function () {
      new AskomicsJobsViewManager().update_jobview ();
    });
  });
}

function loadSourceFileBed(idfile, pub) {
  // get taxon
  let taxon = '';

  let file_elem = $("#source-file-bed-" + idfile);

  // get the taxon in the selector or in the input field
  taxon = $('#' + idfile + '-selector').val();
  if ( taxon === null || taxon === undefined) {
      taxon = $('#tax-'+idfile).val();
  }

  // get entity name
  let entity = $('#entity-' + idfile).val();
  // custom uri
  let uri = file_elem.find('#def-uri-entity-'+idfile).val();

  let service = new RestServiceJs("load_bed_into_graph");

  let model = { 'file_name': $("#"+idfile).attr("filename"),
                'taxon': taxon,
                'entity_name': entity,
                'public': pub,
                'uri': uri};

  service.post(model, function(data) {
    new AskomicsJobsViewManager().loadjob().then(function () {
      new AskomicsJobsViewManager().update_jobview ();
    });
  });
}
