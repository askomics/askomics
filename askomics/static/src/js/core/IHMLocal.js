/*jshint esversion: 6 */

/* Management of all Askomics view/abstraction/ihm for the client application management */

let __ihm ;

class IHMLocal {
    constructor() {

      this.chunkSize        =      400000  ;
      this.sizeFileMaxAdmin =  4000000000  ; // 4Go
      this.sizeFileMaxUser  =     10000000 ; // 10 Mo
      /* Implement a Singleton */
      if ( __ihm !== undefined ) {
          return __ihm;
      }

      __ihm = this;

      this.init();
      this.startPointsByGraph = {} ;

      // A helper for handlebars
      Handlebars.registerHelper('nl2br', function(text) {
          var nl2br = (text + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
          return new Handlebars.SafeString(nl2br);
      });

      $('#full-screen-graph').click(function() {
        if ($('#icon-resize-graph').attr('value') == 'small') {
          __ihm.fullsizeGraph();
          return;
        }

        if ($('#icon-resize-graph').attr('value') == 'full') {
          __ihm.normalsizeGraph();
          return;
        }
      });

      $('#full-screen-attr').click(function() {
        if ($('#icon-resize-attr').attr('value') == 'small') {
          __ihm.fullsizeRightview();
          return;
        }

        if ($('#icon-resize-attr').attr('value') == 'full') {
          __ihm.normalsizeRightview();
          return;
        }
      });
    }

    init() {
      this.forceLayoutManager      = new AskomicsForceLayoutManager("svgdiv") ;
      this.graphBuilder            = new AskomicsGraphBuilder()               ;
      this.user                    = new AskomicsUser('')                     ;
      this.localUserAbstraction    = new AskomicsUserAbstraction()            ;
      this.galaxyService           = new AskomicsGalaxyService()              ;

      //TODO: Manage all view in a array with a generic way
      this.shortcutsView      = new  ShortcutsParametersView();
      this.menus = {} ;

      this.menus.menuFile = new AskomicsMenu("menuFile","buttonViewFile","viewMenuFile",fileFuncMenu,false);
      this.menus.menuGraph = new AskomicsMenu("menuGraph","buttonViewListGraph","viewListGraph",graphFuncMenu);
      this.menus.menuView = new AskomicsMenu("menuView","buttonViewListNodesAndLinks","viewListNodesAndLinks",entitiesAndRelationsFuncMenu);
      this.menus.menuShortcuts = new AskomicsMenu("menuShortcuts","buttonViewListShortcuts","viewListShortcuts",shortcutsFuncMenu);
    }

    getAbstraction() {
      return this.localUserAbstraction;
    }

    getGraphBuilder() {
      return this.graphBuilder;
    }

    getSVGLayout() {
      return this.forceLayoutManager;
    }

    loadAskomicsJsonFiles() {
      $('#uploadInput').change(function(event) {
        // Loading a sparql query file
        let uploadedFile = event.target.files[0];
        if (uploadedFile) {
          let fr = new FileReader();

          fr.onload = function(e) {
            __ihm.startSession(e.target.result);
          };
          fr.readAsText(uploadedFile);
        }
      });
    }

    start() {
      $("#init").show();
      $("#queryBuilder").hide();
      this.loadStartPoints();
    }

    startSession(contents) {

        //Following code is automatically executed at start or is triggered by the action of the user
        $('[data-toggle="tooltip"]').tooltip();
        $("#init").hide();
        $("#queryBuilder").show();

        /* load local abtraction  */
        this.localUserAbstraction.loadUserAbstraction();

        /* initializing SVG graph */
        __ihm.getSVGLayout().init();

        /* initialize menus */
        for (let m in this.menus) { this.menus[m].start(); }
        /* slide up when clicking in svgarea */
        $("#svgdiv").on('click', function(d) {
          for (let m in __ihm.menus) {
            __ihm.menus[m].slideUp();
          }
        });

        AskomicsObjectView.start();
        if ( contents === undefined ) {
        let uri = $('#spdiv input.start_point_radio:checked').attr('id');
        console.assert(uri != undefined ,"Can not get start point URI !" );
        let label = $('input.start_point_radio:checked').attr('value');
        console.assert(label != undefined ,"Can not get start point Label !" );
        let startPoint = {'uri': uri, 'label': label};
          __ihm.getSVGLayout().start(startPoint);
        } else {
          __ihm.getSVGLayout().startWithQuery(contents);
        }
    }

    stopSession() {

      // hide graph
      $("#queryBuilder").hide();
      __ihm.getSVGLayout().reset();

      //remove all rightviews
      AskomicsObjectView.removeAll();
      new AskomicsPanelViewBuilder().removeAll();

      //FL
      this.getSVGLayout().reset() ;
      this.graphBuilder.reset();

      //unbind fullscreen buttons
      // this.unbindFullscreenButtons();

      // removes menus
      for (let m in this.menus) {
        this.menus[m].reset();
      //  delete this.menus[m];
      //  this.menus = [];
      }

      // show the start point selector
      $("#init").show();
      this.loadStartPoints();
    }


    fullsizeGraph() {
      $('#viewDetails').hide();
      $('#PanelQuery').attr('class', 'col-md-12');

      $("#svg").attr("viewBox", this.curx +" " + this.cury +" " + $("#content_interrogation").width() + " " + this.maxh);
      $("#svg").attr('height', this.maxh);
      $("#svg").attr('width', $("#content_interrogation").width());

      //change icon
      $('#icon-resize-graph').attr('class', 'fa fa-compress');
      $('#icon-resize-graph').attr('value', 'full');
    }

    normalsizeGraph() {
      $('#viewDetails').show();
      $('#PanelQuery').attr('class', 'col-md-7');
      $("#svg").attr("viewBox", this.curx +" " + this.cury +" " + this.w + " " + this.h);
      $("#svg").attr('height', this.h);
      $("#svg").attr('width', this.w);

      //change icon
      $('#icon-resize-graph').attr('class', 'fa fa-expand');
      $('#icon-resize-graph').attr('value', 'small');
    }

    fullsizeRightview() {
      $('#PanelQuery').hide();
      $('#viewDetails').attr('class', 'col-md-12');
      $('.div-details').attr('class', 'div-details-max');

      //change icon
      $('#icon-resize-attr').attr('class', 'fa fa-compress');
      $('#icon-resize-attr').attr('value', 'full');
    }

    normalsizeRightview() {
      $('#PanelQuery').show();
      $('#viewDetails').attr('class', 'col-md-5');
      $('.div-details-max').attr('class', 'div-details');

      //change icon
      $('#icon-resize-attr').attr('class', 'fa fa-expand');
      $('#icon-resize-attr').attr('value', 'small');
    }

    unbindFullscreenButtons() {
      $('#full-screen-graph').unbind();
      $('#full-screen-attr').unbind();
    }

    manageErrorMessage(data) {
      // Remove last message
      $('#error_div').remove();
      // If there is an error message, how it
      if (data.error) {
          data.error.replace(/\n/g,'<br/>');
          let template = AskOmics.templates.error_message;
          let context = {message: data.error};
          let html = template(context);
          $('body').append(html);
          return false;
      }
      return true;
    }

    managelistErrorsMessage(listE) {
      // Remove last message
      $('#error_div').remove();
      // If there is an error message, how it
      for(let l in listE) {
          listE[l].replace(/\n/g,'<br/>');
          let template = AskOmics.templates.error_message;
          let context = {message: listE[l]};
          let html = template(context);
          $('body').append(html);
      }
    }

    loadStartPoints() {
        let service = new RestServiceJs('startpoints');
        service.getAll(function(start_points) {
            if (! __ihm.manageErrorMessage(start_points)) return;
            $("#init").empty();
            let template = AskOmics.templates.startpoints;
            let context = {startpoints: start_points.nodes};
            let html = template(context);
            $('#init').append(html);

            // Sort inputs
            let inputs = $("#spdiv");
            inputs.children().detach().sort(function(a, b) {
                return $(a).attr("id").localeCompare($(b).attr("id"));
            }).appendTo(inputs);

            // Filter --------------
            // list of all entities
            let list_entities = [];
            $.each($('.start_point_radio'), function(entity) {
                list_entities.push($(this).attr('value'));
            });
            // on input change
            $('#filter_entities').on('input', function() {
                let new_list = list_entities.slice();
                let filter = $('#filter_entities').val();
                if (filter.trim()) {
                    $.each(list_entities, function(index, value) {
                        if (!value.toLowerCase().match(filter.toLowerCase())) {
                            let index2splice = new_list.indexOf(value);
                            new_list.splice(index2splice, 1);
                        }
                    });
                    $.each($(".label_startpoints"), function() {
                        let label = $(this).attr('id');
                        if (new_list.indexOf(label) >= 0) {
                            //show
                            $(this).removeClass('hidden');
                        }else{
                            // hide
                            $(this).addClass('hidden');
                            // deselect it
                            if ($(".start_point_radio[value="+label+"]").is(':checked')) {
                                $(".start_point_radio[value="+label+"]").removeAttr('checked');
                                $('#starter').attr('disabled', 'disabled');
                            }
                        }
                    });
                }else{
                    // show all
                    $('.label_startpoints').removeClass('hidden');
                }
            });

            // on radio change, hide/show start button
            $('.start_point_radio').change(function() {
                $('#starter').removeAttr('disabled');
            });

            // Galaxy upload
            $('.import-galaxy-query').click(function(d) {
                console.log('Display galaxy form');
                __ihm.set_upload_galaxy_form(false, false);
            });

        });
    }


    loadNamedGraphs() {
        let service = new RestServiceJs('list_user_graph');
        service.getAll(function(data) {
            let template = AskOmics.templates.datasets;

            let context = {datasets: data};
            let html = template(context);
            $('#content_datasets').empty();
            $('#content_datasets').append(html);

            // check all
            $(".check_all_datasets").change(function () {
                $(".check_dataset").prop('checked', $(this).prop("checked"));
            });

            // hide delete button if no checkbox checked
            $(".check_ds").change(function(){
                if ($('.check_dataset:checked').length !== 0) {
                   $('#delete_datasets').removeAttr('disabled');
                }else{
                    $('#delete_datasets').attr('disabled', 'disabled');
                }
            });

            // Delete selected datasets
            $('#delete_datasets').click(function() {
                let selected = [];
                $('.check_dataset').each(function() {
                    if ($(this).is(':checked')) {selected.push($(this).attr('name'));}
                });
                let service2 = new RestServiceJs('delete_graph');
                let model = {'named_graph': selected};
                //show the spinner
                $('#spinner_delete').removeClass('hidden');
                service2.post(model, function(data) {
                    __ihm.loadNamedGraphs();
                    __ihm.stopSession();
                    __ihm.resetStats();
                });
            });

            if ( ! $.fn.dataTable.isDataTable( '.datasets-table' ) ) {
              // sorted dataTable
              $('.datasets-table').DataTable({
                'retrieve': true,
                'order': [[1, 'asc']],
                'columnDefs': [
                    { 'orderable': false, 'targets': 0 },
                    { type: 'date-euro', targets: 2 }
                ]
              });
            }
        });
    }

    loadEndpoints() {
      let service = new RestServiceJs('list_endpoints');
      service.getAll(function(data) {
          let template = AskOmics.templates.endpoints;
          let context = { admin: __ihm.user.isAdmin() , endpoints: data.askomics , endpoints_ext: data.external.endpoints};
          let html = template(context);

          $('#content_endpoints').empty();
          $('#content_endpoints').append(html);

          // hide delete button if no checkbox checked

          $(".check_ep").change(function(){
              if ($('.check_endpoint:checked').length !== 0) {
                 $('#delete_endpoints').removeAttr('disabled');
              }else{
                  $('#delete_endpoints').attr('disabled', 'disabled');
              }
          });

          // Delete selected datasets
          $('#delete_endpoints').click(function() {
              let selected = [];
              $('.check_endpoint').each(function() {
                  if ($(this).is(':checked')) {selected.push($(this).attr('name'));}
              });
              let service = new RestServiceJs('delete_endpoints');
              let model = {'endpoints': selected};
              //show the spinner
              $('#spinner_delete').removeClass('hidden');
              service.post(model, function(data) {
                  __ihm.loadEndpoints();
                  __ihm.stopSession();
                  __ihm.resetStats();
              });
          });

          // sorted dataTable
          $('#data-table-endpoints').DataTable({
              'order': [[1, 'asc']],
              'columnDefs': [
                  { 'orderable': false, 'targets': 0 },
                  { type: 'date-euro', targets: 2 }
              ]
          });
          $('#add_endpoint').off().click(function() {
              __ihm.get_add_endpoints_form();
          });

          $('input.enable-endpoint').click(function() {
            let service = new RestServiceJs('enable_endpoints');
            let model = {
              'id': $(this).closest( "tr" ).attr('id'),
              'enable' : $(this).is(":checked")
            };
            service.post(model, function() {
            });
          });
      });
    }

    get_add_endpoints_form() {

        console.log(" +++ get_add_endpoints_form +++");

        $('#modalTitle').text('Add Askomics endpoint');
        $('.modal-sm').css('width', '55%');
        $('.modal-body').show();

        $('#modal').modal('show');
        $('#modal').addClass('upload-modal');

        let template = AskOmics.templates.add_endpoint;
        let html = template();

        $('#modalMessage').html(html);

        $('#modalButton').click(function()
        {
          let service = new RestServiceJs('add_endpoint');
          let model = {
            name: $('#endpoint-name').val(),
            url:$('#endpoint-url').val(),
            auth: $('#endpoint-auth').val()
          };

          if (model.name == "" || model.url == "http://") {
            alert('Bad definition of AskOmics endpoint :'+ JSON.stringify(model));
            return ;
          }

          service.post(model, function(data) {
            __ihm.loadEndpoints();
          });
          $(this).unbind( "click" );
        }).text('Add');

    }

    graphname(graphn) {
      let date = graphn.substr(graphn.lastIndexOf('_') + 1);
      let new_name = graphn.substr(0,graphn.lastIndexOf('_'));
      return { 'date' : date , 'name' : new_name } ;
    }

    loadStatistics() {
        let service = new RestServiceJs('statistics');

        __ihm.displayModal('Loading statistics...', '', 'Close');
        service.getAll(function(stats) {

          $('#content_statistics').empty();
          let template = AskOmics.templates.stats;
          let context = {stats: stats};
          let html = template(context);
          $('#content_statistics').append(html);

          __ihm.hideModal();
        });
    }

    resetStats() {
      $('#statistics_div').empty();
    }

    displayModal(title, message, button) {
        $('#modalTitle').text(title);
        if (message === '') {
          $('.modal-body').hide();
          $('.modal-sm').css('width', '300px');
        }else{
          $('.modal-sm').css('width', '700px');
          $('.modal-body').show();
          $('#modalMessage').text(message);
        }
        $('#modalButton').text(button);
        $('#modal').modal('show');
        return $('#modal');
    }

    displayModalHtml(title, message, button) {
        $('#modalTitle').html(title);
        if (message === '') {
          $('.modal-body').hide();
          $('.modal-sm').css('width', '300px');
        }else{
          $('.modal-sm').css('width', '700px');
          $('.modal-body').show();
          $('#modalMessage').html(message);
        }
        $('#modalButton').html(button);
        $('#modal').modal('show');
    }

    hideModal(){
        $('#modal').modal('hide');
    }

    send_query_to_galaxy() {
        console.log('Send query to galaxy');
    }

    downloadTextAsFile(filename, text) {
        // Download text as file
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    get_uploaded_files() {
        let service = new RestServiceJs("get_uploaded_files");
        service.getAll(function(data) {
            let template = AskOmics.templates.uploaded_files;
            let context = { files: data.files, galaxy: data.galaxy };
            let html = template(context);
            $('#content_integration').empty();
            $('#content_integration').append(html);

            // check all
            $(".check_all_uploaded").change(function () {
                $(".check_one_uploaded").prop('checked', $(this).prop("checked"));
            });

            // Show/hide upload button
            $(".check_uploaded").change(function(){
                if ($('.check_one_uploaded:checked').length !== 0) {
                   $('.btn-uploaded').removeAttr('disabled');
                }else{
                    $('.btn-uploaded').attr('disabled', 'disabled');
                }
            });

            // Upload selected datasets
            $('#integrate_uploaded').click(function() {
                $("#spinner_uploaded").removeClass("hidden");
                let selected_files = [];
                $('.check_one_uploaded').each(function() {
                    if ($(this).is(':checked')) {selected_files.push($(this).attr('value'));}
                });
                let service = new RestServiceJs('source_files_overview');
                service.post(selected_files)
                .done(function(data) {
                    displayIntegrationForm(data);
                })
                .fail(function(value) {
                    $("#spinner_uploaded").addClass("hidden");
                });
            });

            // Delete selected datasets
            $("#delete_uploaded").click(function() {
                $("#spinner_uploaded").removeClass("hidden");
                let selected_files = [];
                $('.check_one_uploaded').each(function() {
                    if ($(this).is(':checked')) {selected_files.push($(this).attr('value'));}
                });
                let service = new RestServiceJs('delete_uploaded_files');
                service.post(selected_files)
                .done(function(data) {
                    __ihm.get_uploaded_files();
                })
                .fail(function(value) {
                    $("#spinner_uploaded").addClass("hidden");
                });
            });

            $('#upload_from_computer').click(function() {
                __ihm.set_upload_form();
            });

            $('#upload_from_galaxy').click(function() {
                __ihm.set_upload_galaxy_form(false, true);
            });

            // sorted dataTable
            $('.uploaded-data-table').DataTable({
                'order': [[1, 'asc']],
                'columnDefs': [
                    { 'orderable': false, 'targets': 0 },
                    { "type": "file-size", targets: 2 }
                ]
            });
        });
    }

    set_upload_galaxy_form(history_id, input, histories={}) {

        let title;
        let radio;
        let input_type;
        let allowed_files;
        if (input) {
            // Input file upload
            title = 'Get a dataset from Galaxy';
            radio = true;
            input_type = 'checkbox';
            allowed_files = ['tabular', 'ttl', 'gff', 'gff3', 'gff2', 'bed'];
        }else{
            // Query file upload
            title = 'Get a query from Galaxy';
            radio = false;
            input_type = 'radio';
            allowed_files = ['json'];
        }

        let template = AskOmics.templates.galaxy_datasets;
        let context = {datasets: {}, histories: histories, radio: radio, input_type: input_type};
        let html = template(context);

        $('#modalTitle').text(title);
        $('.modal-sm').css('width', '50%');
        $('.modal-body').show();
        $('#modalButton').text('Close');
        $('#modal').modal('show');
        $('#modalMessage').html(html);
        $('#spinner_loading_galaxy').removeClass('hidden');
        $('.galaxy-table').hide();

        if (typeof history_id === 'undefined' || history_id === null) {
            history_id = false;
        }

        // If a Galaxy instance is connected, show the form to get data from the Galaxy history
        let service = new RestServiceJs('get_data_from_galaxy');
        let model = {history: history_id, allowed_files: allowed_files};
        service.post(model, function(data) {
            if (!data.galaxy) return;
            let template = AskOmics.templates.galaxy_datasets;
            let context = {datasets: data.datasets, histories: data.histories, radio: radio, input_type: input_type};
            let html = template(context);

            $('#modalTitle').text(title);
            $('.modal-sm').css('width', '50%');
            $('.modal-body').show();
            $('#modalButton').text('Close');
            $('#modal').modal('show');
            $('#modalMessage').html(html);

            // sorted dataTable
            $('.galaxy-table').DataTable({
                'order': [[1, 'asc']],
                'columnDefs': [
                    { 'orderable': false, 'targets': 0 }//,
                    // { "type": "file-size", targets: 2 }
                ]
            });

            // check all
            $(".check_all_galaxy").change(function () {
                $(".check_one_galaxy").prop('checked', $(this).prop("checked"));
            });

            //Show/hide upload button
            $(".check_galaxy").change(function(){
                if ($('.check_one_galaxy:checked').length !== 0) {
                   $('#upload_galaxy').removeAttr('disabled');
                }else{
                    $('#upload_galaxy').attr('disabled', 'disabled');
                }
            });

            $('#upload_galaxy').click(function() {
                if (input) {
                    // Upload selected datasets
                    $("#spinner_galaxy-upload").removeClass("hidden");
                    let selected_datasets = [];
                    $('.check_one_galaxy').each(function() {
                        if ($(this).is(':checked')) {selected_datasets.push($(this).attr('value'));}
                    });
                    //upload files
                    let service2 = new RestServiceJs('upload_galaxy_files');
                    let model = {'datasets': selected_datasets};
                    service2.post(model, function(data) {
                        __ihm.manageErrorMessage(data);
                        $("#spinner_galaxy-upload").addClass("hidden");
                        __ihm.get_uploaded_files();
                    });
                }else{
                    // Import query file
                    console.log('upload query file');
                    // get the file's content
                    $("#spinner_galaxy-upload").removeClass("hidden");
                    let dataset = $('input[name=upload-galaxy]:checked').val();
                    let service2 = new RestServiceJs('get_galaxy_file_content');
                    let model = {'dataset': dataset};
                    service2.post(model, function(data) {
                        __ihm.startSession(data.json_query);
                    });
                }
            });

            // On select change, reload
            $('#change_history').on('change', function() {
                __ihm.set_upload_galaxy_form(this.value, input, histories=data.histories);
            });
        });
    }

    set_upload_form() {
        $('#modalTitle').text('Upload files');
        $('.modal-sm').css('width', '55%');
        $('.modal-body').show();
        $('#modalButton').text('Close');
        $('#modal').modal('show');
        $('#modal').addClass('upload-modal');

        let content = '#modalMessage';

        // Upload form
        let service = new RestServiceJs("up/");
        service.getAll(function(html) {
        let size_file_max = __ihm.user.isAdmin()?__ihm.sizeFileMaxAdmin:__ihm.sizeFileMaxUser;

        html.html = html.html.replace("___SIZE_UPLOAD____",(size_file_max/(1000*1000))+" Mo");
        $(content).html(html.html);

        // Initialize the jQuery File Upload widget
        $(content).find('#fileupload').fileupload({
            // Uncomment the following to send cross-domain cookies:
            //xhrFields: {withCredentials: true},
            url: 'up/file/',
            maxChunkSize: __ihm.chunkSize,
            maxFileSize: size_file_max
        });

        // Enable iframe cross-domain access via redirect option
        $(content).find('#fileupload').fileupload(
            'option',
            'redirect',
            window.location.href.replace(
                /\/[^\/]*$/,
                '/cors/result.html?%s'
            )
        ).bind('fileuploaddone', function () {__ihm.get_uploaded_files();});

      });
    }

    loadUsers() {
      let service = new RestServiceJs('get_users_infos');
      service.getAll(function(data) {
        $("#Users_adm").empty();
        let template = AskOmics.templates.admin_users;
        let context = {users: data.result};
        let html = template(context);

        $("#Users_adm").append(html);
        $('.lock_user').click(function() {
          __ihm.lockUser(this.id, true);
        });
        $('.unlock_user').click(function() {
          __ihm.lockUser(this.id, false);
        });
        $('.set_admin').click(function() {
          __ihm.setAdmin(this.id, true);
        });
        $('.unset_admin').click(function() {
          __ihm.setAdmin(this.id, false);
        });
        $('.del_user').click(function() {
          __ihm.delUser(this.id);
        });
        $('.table-user').DataTable();
      });

      this.shortcutsView.updateShortcuts(true);
    }

    delUser(username, reload=false, passwdconf=false) {
      // display confirmations buttons
      $('.del_user#' + username).hide();
      $('.div_confirm_del_user#' + username).removeClass('hidden').show();

      //if no, redisplay the trash
      $('.no_del_user#' + username).click(function() {
        $('.del_user#' + username).show();
        $('.div_confirm_del_user#' + username).hide();
        if (passwdconf) {
          $('.passwd2del-group').addClass('hidden');
        }
      });

      //if yes, delete user and all this data and reload the list
      $('.confirm_del_user#' + username).click(function(e) {
        // get the passwd if needed
        let passwd = '';
        if (passwdconf) {
          passwd = $('.passwd_del#' + username).val();
        }

        let service = new RestServiceJs('delete_user');
        let data = {'username': username, 'passwd': passwd, 'passwd_conf': passwdconf};
        // Don't send the request to the python server if passwd is empty
        if (passwdconf && passwd === '') {
          __ihm.manageErrorMessage({'error': 'Password is empty'});
          return;
        }

        // Show the spinner
        $('.spinner_del#' + username).removeClass('hidden');
        $('.div_confirm_del_user#' + username).addClass('hidden');

        service.post(data, function(d) {
          if (!__ihm.manageErrorMessage(d)) {
            return;
          }

          // Reload the page
          if (d == 'success') {
            __ihm.loadUsers();
          }else{
            __ihm.manageErrorMessage({'error': d});
            return;
          }
        });
      });
    }

    lockUser(username, lock) {
      let service = new RestServiceJs('lockUser');
      let data = {'username': username, 'lock': lock};

        // Show the spinner
      $('.spinner_lock#' + username).removeClass('hidden');
      if (lock) {
        $('.lock_user#' + username).addClass('hidden');
      }else{
        $('.unlock_user#' + username).addClass('hidden');
      }

      service.post(data, function(d) {
        // Reload users
        if (d == 'success') {
          __ihm.loadUsers();
        }else{
          __ihm.manageErrorMessage({'error': d});
          return;
        }
      });
    }


    setAdmin(username, admin) {
      let service = new RestServiceJs('setAdmin');
      let data = {'username': username, 'admin': admin};

      // Show the spinner
      $('.spinner_admin#' + username).removeClass('hidden');
      if (admin) {
        $('.set_admin#' + username).addClass('hidden');
      }else{
        $('.unset_admin#' + username).addClass('hidden');
      }

      service.post(data, function(d) {
        // Reload users
        if (d == 'success') {
          __ihm.loadUsers();
        }else{
          __ihm.manageErrorMessage({'error': d});
          return;
        }
      });
    }

    userForm() {
      let service = new RestServiceJs('get_my_infos');
      service.getAll(function(d) {
        // console.log(JSON.stringify(d));
        console.log('keys');
        console.log(d.apikeys);
        let template = AskOmics.templates.user_managment;
        let context = {user: d, keys: d.apikeys, galaxy: d.galaxy};
        let html = template(context);
        $('#content_user_info').empty();
        $('#content_user_info').append(html);
        $('.del_user#' + d.username).click(function() {
          $('.passwd2del-group').removeClass('hidden').show();
          __ihm.delUser(d.username, true, true);
        });
        $('.update_email#' + d.username).click(function() {
          __ihm.updateMail(d.username);
        });
        $('.update_passwd#' + d.username).click(function() {
          __ihm.updatePasswd(d.username);
        });
        $('.get_new_apikey#' + d.username).click(function() {
          __ihm.get_apikey(d.username, $('.new_apikey_name#' + d.username).val());
        });
        $('.add_galaxy#' + d.username).click(function() {
          __ihm.connect_galaxy($('.galaxy_url#' + d.username).val(), $('.galaxy_key#' + d.username).val());
        });

        // Active the tooltip
        $('[data-toggle="tooltip"]').tooltip();

        // Copy apikey
        $('.copy_key').click(function() {
          __ihm.copyToClipboard($('.apikey#' + this.id));

          // Change the message into the tooltip
          $(this).attr('title', 'Copied!')
                 .tooltip('fixTitle')
                 .tooltip('show')
                 .attr('title', "Copy to Clipboard")
                 .tooltip('fixTitle');
        });

        // Delete key
        $('.del_key').click(function() {
          __ihm.deleteApikey(this.id);
        });
      });
    }

    deleteApikey(key) {
      let service = new RestServiceJs('del_apikey');
      let data = {'key': key};
      service.post(data, function(d) {
        __ihm.userForm();
      });
    }

    copyToClipboard(elem) {
      let temp = $('<input>');
      $('body').append(temp);
      temp.val(elem.text()).select();
      document.execCommand("copy");
      temp.remove();
    }

    validateEmail(email) {
      if (email === '') {
        return false;
      }
      let regexp = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
      return regexp.test(email);
    }

    updatePasswd(username) {
      $('#tick_passwd').addClass('hidden');
      let passwd = $('.new_passwd#' + username).val();
      let passwd2 = $('.new_passwd2#' + username).val();
      let current_passwd = $('.current_passwd#'+ username).val();
      // check if the 2 passwd are identical
      if (passwd != passwd2) {
        __ihm.manageErrorMessage({'error': 'Passwords are not identical'});
        return;
      }

      // check if passwd is not empty
      if (passwd === '' || current_passwd === '') {
        __ihm.manageErrorMessage({'error': 'Password is empty'});
        return;
      }

      //if passwd are identical, send it to the python server
      let service = new RestServiceJs('update_passwd');
      let data = {'current_passwd': current_passwd, 'passwd': passwd, 'passwd2': passwd2, 'username': username};
      // display the spinning wheel
      $('#spiner_passwd').removeClass('hidden');
      $('#tick_passwd').addClass('hidden');
      // Post the service
      service.post(data, function(d) {
        if (!__ihm.manageErrorMessage(d)) {
          $('#spiner_passwd').addClass('hidden');
          return;
        }
        // It's ok, remove the spinning wheel and show the tick
        $('#spiner_passwd').addClass('hidden');
        $('#tick_passwd').removeClass('hidden');
        // empty the fields
        $('.new_passwd#' + username).val('');
        $('.new_passwd2#' + username).val('');
        $('.current_passwd#' + username).val('');
      });
    }

    updateMail(username) {
      $('#tick_mail').addClass('hidden');
      let email = $('.new_email#' + username).val();

      // check if email is valid (to avoid a useless request to the python server)
      if (!validateEmail(email)) {
        __ihm.manageErrorMessage({'error': 'not a valid email'});
        return;
      }

      // if email is ok, send it to the server
      let service = new RestServiceJs('update_mail');
      let data = {'username': username, 'email': email};
      $('#spiner_mail').removeClass('hidden');
      $('#tick_mail').addClass('hidden');

      service.post(data, function(d) {
        if (! __ihm.manageErrorMessage(d)) {
          $('#spiner_mail').addClass('hidden');
          return;
        }
        $('#spiner_mail').addClass('hidden');
        $('#tick_mail').removeClass('hidden');
        $('.new_email#' + username).val('').attr("placeholder", email);
      });
    }

    get_apikey(username, keyname) {
      let service = new RestServiceJs('api_key');
      let data = {'username': username, 'keyname': keyname};
      $('#spinner_apikey').removeClass('hidden');
      $('#tick_apikey').addClass('hidden');

      service.post(data, function(d) {
        if (!__ihm.manageErrorMessage(d)) {
          return;
        }
        // reload
        __ihm.userForm();
      });


    }

    connect_galaxy(url, key) {
      let service = new RestServiceJs('connect_galaxy');
      let data = {'url': url, 'key': key};
      // show a spinner
      $('#spinner_galaxy').removeClass('hidden');
      $('#tick_galaxy').addClass('hidden');
      $('#cross_galaxy').addClass('hidden');

      service.post(data, function(d) {
        if (!__ihm.manageErrorMessage(d)) {
          // show a red cross
          $('#spinner_galaxy').addClass('hidden');
          $('#tick_galaxy').addClass('hidden');
          $('#cross_galaxy').removeClass('hidden');
          return;
        }
        if (d.success == "deleted") {
            //show a green tick
            $('#spinner_galaxy').addClass('hidden');
            $('#tick_galaxy').removeClass('hidden');
            $('#cross_galaxy').addClass('hidden');
            // update the placeholder with default values
            $('.galaxy_url').attr('placeholder', 'Galaxy url');
            $('.galaxy_key').attr('placeholder', 'Galaxy api key');
            // Button name: add
            $('.add_galaxy').html('Add');
            return;
        }
        // Key updated
        // show a green tick
        $('#spinner_galaxy').addClass('hidden');
        $('#tick_galaxy').removeClass('hidden');
        $('#cross_galaxy').addClass('hidden');
        // update the placeholder
        $('.galaxy_url').attr('placeholder', url);
        $('.galaxy_key').attr('placeholder', key);
        // remove the values
        $('.galaxy_url').val('');
        $('.galaxy_key').val('');
      });
    }

    displayNavbar(loged, username, admin, blocked) {
        $("#navbar").empty();
        let template = AskOmics.templates.navbar;

        let context = {name: 'AskOmics', loged: loged, username: username, admin: admin, nonblocked: !blocked};
        let html = template(context);

        $("#navbar").append(html);

        // manage navbar button here
        //TODO: move this function into a navbar class?

        /*

          Click general GU Interface of Askomics :
          - manage navbar
          - show/hide content_{section}

        */

        // Get the overview of files to integrate
        $("#integration").click(function() {
            __ihm.get_uploaded_files();
        });

        // Visual effect on active tab (Ask! / Integrate / Credits)
        $('.nav li').click(function(e) {
          //$(this).off();

          //TODO : We can not defined nav li inside otherwise this function apply (define for the min nav ASKOMIS ).....
          // for now, to avoid a bad behaviours, we need to not defined id in sub nav tag
          if ( $(this).attr('id')=== undefined) return;

          $('.nav li.active').removeClass('active');

            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
            }

            //console.log("ID:"+ $(this).attr('id'));
            if ( ! ( $(this).attr('id') in { 'help' : '','admin':'', 'user_menu': '' }) ) {

              $('.container').hide();
              $('.container#navbar_content').show();
              //console.log("===>"+'.container#content_' + $(this).attr('id'));
              $('.container#content_' + $(this).attr('id')).show();
            } else {
              $('.container#navbar_content').show();
            }

            e.preventDefault();

        });

        // diplay signup/login form
        $('#show_signup').click(function(e) {
          $('#content_login').hide();
          $('#content_signup').show();
        });

        $('#show_login').click(function(e) {
          $('#content_signup').hide();
          $('#content_login').show();
        });

        // 'enter' key when password2 was filled !
        $('#signup_password2').off().keypress(function (e) {
          if(e.which == 13)  // the enter key code
          {
            $('#signup_button').click();
          }
        });

        $('#signup_button').off().click(function(e) {
          let username = $('#signup_username').val();
          let email = $('#signup_email').val();
          let password = $('#signup_password').val();
          let password2 = $('#signup_password2').val();

          let service = new RestServiceJs("signup");
          let model = { 'username': username,
                        'email': email,
                        'password': password,
                        'password2': password2  };
          $('#spinner_signup').removeClass('hidden');
          $('#tick_signup').addClass('hidden');
          $('#cross_signup').addClass('hidden');
          service.post(model, function(data) {
            __ihm.hideModal();
            if (data.error.length !== 0) {
              $('#signup_error').empty();
              for (let i = data.error.length - 1; i >= 0; i--) {
                $('#signup_error').append(data.error[i] + '<br/>');
              }

              // Error
              $('#signup_error').show();
              $('#spinner_signup').addClass('hidden');
              $('#tick_signup').addClass('hidden');
              $('#cross_signup').removeClass('hidden');
            }else{
              // Success
              $('#signup_error').hide();
              $('#spinner_signup').addClass('hidden');
              $('#tick_signup').removeClass('hidden');
              $('#cross_signup').addClass('hidden');
              __ihm.user = new AskomicsUser(data.username, data.admin);
              __ihm.user.logUser();
            }
          });

        });

        // log next a 'enter' key when password was filled !
        $('#login_password').keypress(function (e) {
          if(e.which == 13)  // the enter key code
          {
            $('#login_button').click();
          }
        });

        $('#login_button').click(function(e) {
          let username_email = $('#login_username-email').val();
          let password = $('#login_password').val();

          let service = new RestServiceJs('login');
          let model = {
            'username_email': username_email,
            'password': password
          };
          $('#spinner_login').removeClass('hidden');
          $('#tick_login').addClass('hidden');
          $('#cross_login').addClass('hidden');
          service.post(model, function(data) {
            if (data.error.length !== 0) {
              $('#login_error').empty();
              for (let i = data.error.length - 1; i >= 0; i--) {
                $('#login_error').append(data.error[i] + '<br>');
              }
              // Error
              AskomicsUser.errorHtmlLogin();
            }else{
              //Success
              AskomicsUser.cleanHtmlLogin();
              __ihm.user = new AskomicsUser(data.username, data.admin);
              __ihm.user.logUser();
            }
          });
        });

        $('#logout').click(function(e) {
          __ihm.user.logout();
        });

        // admin page
        $('#administration').click(function() {
          __ihm.loadUsers();
        });

        // admin page
        $('#user_info').click(function() {
          __ihm.userForm();
        });
    }
}
