/*jshint esversion: 6 */

/* Management of all Askomics view/abstraction/ihm for the client application management */

let __ihm ;

class IHMLocal {
    constructor() {

      this.chunkSize        =      400000 ;
      this.sizeFileMaxAdmin =  4000000000 ; // 4Go
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

      // Loading a sparql query file
      $(".uploadBtn").change( function(event) {
        var uploadedFile = event.target.files[0];
        if (uploadedFile) {
            var fr = new FileReader();
            fr.onload = function(e) {
              __ihm.startSession(e.target.result);
            };
            fr.readAsText(uploadedFile);
        }
      });
    }

    init() {
      this.forceLayoutManager      = new AskomicsForceLayoutManager("svgdiv") ;
      this.graphBuilder            = new AskomicsGraphBuilder()               ;
      this.user                    = new AskomicsUser('')                     ;
      this.localUserAbstraction    = new AskomicsUserAbstraction()            ;

      //TODO: Manage all view in a array with a generic way
      this.shortcutsView      = new  ShortcutsParametersView();
      this.moduleView      = new  ModulesParametersView();

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

    start() {
      $("#init").show();
      $("#queryBuilder").hide();

      this.user.checkUser();
      this.loadStartPoints();
    }

    startSession(contents) {

        //Following code is automatically executed at start or is triggered by the action of the user
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
          /* Get information about start point to bgin query */
          let startPoint = $('#startpoints').find(":selected").data("value");

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
      this.unbindFullscreenButtons();

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
      $('#icon-resize-graph').attr('class', 'glyphicon glyphicon-resize-small');
      $('#icon-resize-graph').attr('value', 'full');
    }

    normalsizeGraph() {
      $('#viewDetails').show();
      $('#PanelQuery').attr('class', 'col-md-7');
      $("#svg").attr("viewBox", this.curx +" " + this.cury +" " + this.w + " " + this.h);
      $("#svg").attr('height', this.h);
      $("#svg").attr('width', this.w);

      //change icon
      $('#icon-resize-graph').attr('class', 'glyphicon glyphicon-resize-full');
      $('#icon-resize-graph').attr('value', 'small');
    }

    fullsizeRightview() {
      $('#PanelQuery').hide();
      $('#viewDetails').attr('class', 'col-md-12');
      $('.div-details').attr('class', 'div-details-max');

      //change icon
      $('#icon-resize-attr').attr('class', 'glyphicon glyphicon-resize-small');
      $('#icon-resize-attr').attr('value', 'full');
    }

    normalsizeRightview() {
      $('#PanelQuery').show();
      $('#viewDetails').attr('class', 'col-md-5');
      $('.div-details-max').attr('class', 'div-details');

      //change icon
      $('#icon-resize-attr').attr('class', 'glyphicon glyphicon-resize-full');
      $('#icon-resize-attr').attr('value', 'small');
    }

    unbindFullscreenButtons() {
      $('#full-screen-graph').unbind();
      $('#full-screen-attr').unbind();
    }

    manageErrorMessage(data) {
      console.log("manageErrorMessage - error inside => "+JSON.stringify('error' in data));
      // Remove last message
      $('#error_div').remove();
      // If there is an error message, how it
      if (data.error) {
          data.error.replace(/\n/g,'<br/>');
          let source = $('#template-error-message').html();
          let template = Handlebars.compile(source);
          let context = {message: data.error};
          let html = template(context);
          $('body').append(html);
          return false;
      }
      return true;
    }

    managelistErrorsMessage(listE) {
      console.log("managelistErrorsMessage - error inside => "+JSON.stringify(listE));
      // Remove last message
      $('#error_div').remove();
      // If there is an error message, how it
      for(let l in listE) {
          listE[l].replace(/\n/g,'<br/>');
          let source = $('#template-error-message').html();
          let template = Handlebars.compile(source);
          let context = {message: listE[l]};
          let html = template(context);
          $('body').append(html);
      }
    }

    loadStartPoints() {
      console.log('---> loadStartPoints');

      var service = new RestServiceJs("startpoints");
      $("#btn-down").prop("disabled", true);
      $("#showNode").hide();
      $("#deleteNode").hide();

      service.getAll(function(startPointsDict) {
          if (! __ihm.manageErrorMessage(startPointsDict)) return;

          $("#startpoints").empty();
          $('#graph_startpoints').empty();

          for (let g in __ihm.startPointsByGraph ) {
            delete __ihm.startPointsByGraph[g];
          }
          __ihm.startPointsByGraph = {} ;

          $.each(startPointsDict.nodes, function(key, value) {
            let textGraph;

            if (value.public) {
              textGraph = $('<em></em>').attr('class', 'text-warning')
                                   .append($('<i></i>').attr('class', 'fa fa-globe'))
                                   .append(' ' + __ihm.graphname(value.g).name);
            } else if (value.private) {
              textGraph = $('<em></em>').attr('class', 'text-primary')
                                   .append($('<i></i>').attr('class', 'fa fa-lock'))
                                   .append(' ' + __ihm.graphname(value.g).name);
            } else {
               throw "unknwon access ";
            }

            if ( ! (value.g in __ihm.startPointsByGraph) ) {
                  $('#graph_startpoints').append(
                      $('<option></option>')
                                      .attr('data-value', JSON.stringify(value.g))
                                      .click(function(){
                                        $('#startpoints').empty();
                                        for (let idxOption in __ihm.startPointsByGraph[value.g] ) {
                                          let val = __ihm.startPointsByGraph[value.g][idxOption];
                                          let text = "";
                                          if (val.public) {
                                            text = $('<em></em>').attr('class', 'text-warning')
                                                                 .append($('<i></i>').attr('class', 'fa fa-globe'))
                                                                 .append(' ' + val.label);
                                          } else if (val.private) {
                                            text = $('<em></em>').attr('class', 'text-primary')
                                                                 .append($('<i></i>').attr('class', 'fa fa-lock'))
                                                                 .append(' ' + val.label);
                                          }  else {
                                             throw "unknwon access ";
                                          }

                                          $('#startpoints').append($('<option></option>')
                                                                        .attr('data-value', JSON.stringify(val))
                                                                        .append(text));
                                        }
                                      })
                                      .append(textGraph));
                  __ihm.startPointsByGraph[value.g]=[];
            }
            __ihm.startPointsByGraph[value.g].push( value );
          });
          $('#graph_startpoints').find(":selected").click();

          $("#starter").prop("disabled", true);
          $("#startpoints").click(function(){
              if ($("#starter").prop("disabled")) {
                  $("#starter").prop("disabled", false);
              }
          });
      });
    }


    loadNamedGraphs() {
        var select = $('#dropNamedGraphSelected');
        select.empty();
        __ihm.manageDelGraphButton();

        var serviceNamedGraphs = new RestServiceJs('list_private_graphs');
        serviceNamedGraphs.getAll(function(namedGraphs) {
            if (namedGraphs == 'forbidden') {
              __ihm.showLoginForm();
              return;
            }
            if (namedGraphs == 'blocked') {
              __ihm.displayBlockedPage($('.username').attr('id'));
            }
            if (namedGraphs.length === 0) {
              __ihm.disableDelButton();
              return;
            }else{
              __ihm.enableDelButton();
            }
            for (let graphName in namedGraphs){
                select.append($("<option></option>").attr("value", namedGraphs[graphName].g)
                                                    .append(__ihm.formatGraphName(namedGraphs[graphName])));
            }
        });
    }


    unselectGraphs() {
      $('#dropNamedGraphSelected option:selected').removeAttr("selected");
      __ihm.manageDelGraphButton();
    }

    manageDelGraphButton() {
      let graphs = $('#dropNamedGraphSelected').val();
      if (graphs === null) {
        $('#btn-empty-graph').prop('disabled', true);
      }else{
        $('#btn-empty-graph').prop('disabled', false);
      }
    }

    disableDelButton() {
      $('#btn-empty').prop('disabled', true);
    }

    enableDelButton() {
      $('#btn-empty').prop('disabled', false);
    }

    graphname(graphn) {
      let date = graphn.substr(graphn.lastIndexOf('_') + 1);
      let new_name = graphn.substr(0,graphn.lastIndexOf('_'));
      return { 'date' : date , 'name' : new_name } ;
    }

    formatGraphName(graph) {
      /*
      Transform the name of the graph into a readable string
      */
      let ret = __ihm.graphname(graph.g);
      return "<em>"+ret.name+"</em> (<strong>date="+ret.date+", ntriplets="+graph.count+"</strong>)";
    }

    showLoginForm() {
      $(".container:not(#navbar_content)").hide();
      $('#content_login').show();
      $('.nav li.active').removeClass('active');
      $("#login").addClass('active');
      __ihm.displayNavbar(false, '');
    }

    loadStatistics() {
        console.log('-+-+- loadStatistics -+-+-');

        let service = new RestServiceJs('statistics');

        __ihm.displayModal('Loading statistics...', '', 'Close');
        service.getAll(function(stats) {
          if (stats == 'forbidden') {
            __ihm.showLoginForm();
            return;
          }
          if (stats == 'blocked') {
              __ihm.displayBlockedPage($('.username').attr('id'));
              return;
          }

          $('#content_statistics').empty();
          let source = $('#template-stats').html();
          let template = Handlebars.compile(source);
          let context = {stats: stats};
          let html = template(context);
          $('#content_statistics').append(html);

          __ihm.hideModal();
        });
    }


    emptyDatabase(value) {
        if (value == 'confirm') {
            $("#btn-del").empty();
            $("#btn-del")//.append('Confirm')
                          .append($('<button></button>')
                                .attr('type', 'button')
                                .attr('class', 'btn btn-danger')
                                .attr('onclick', '__ihm.emptyDatabase(\"yes\")')
                                .append('Yes')
                          ).append($('<button></button>')
                                .attr('type', 'button')
                                .attr('class', 'btn btn-default')
                                .attr('onclick', '__ihm.emptyDatabase(\"no\")')
                                .append('No')
                              );
            return;
        }

        if (value == 'no') {
            $("#btn-del").empty();
            $("#btn-del").append("<button id='btn-empty' onclick='__ihm.emptyDatabase(\"confirm\")' class='btn btn-danger'>Delete all</button>");
            return;
        }

        if (value == 'yes') {
            __ihm.displayModal('Please wait ...', '', 'Close');
            var service = new RestServiceJs("empty_user_database");
                service.getAll(function(empty_db){
                  if (empty_db == 'forbidden') {
                    __ihm.showLoginForm();
                  }
                  __ihm.hideModal();
                  if ('error' in empty_db ) {
                    alert(empty_db.error);
                  }
                $('#statistics_div').empty();
                $('#btn-del').empty();
                $("#btn-del").append("<button id='btn-empty' onclick='__ihm.emptyDatabase(\"confirm\")' class='btn btn-danger'>Delete all</button>");
                $('#btn-del').append(' All triples deleted!');
                __ihm.stopSession();
                __ihm.resetStats();
                __ihm.loadNamedGraphs();
            });
        }
    }


    deleteNamedGraph(graphs) {
        __ihm.displayModal('Please Wait', '', 'Close');
        var service = new RestServiceJs("delete_graph");
        let data = {'namedGraphs':graphs };
            service.post(data, function(d){
              if (d == 'forbidden') {
                __ihm.showLoginForm();
                return;
              }
              if (d == 'blocked') {
                __ihm.displayBlockedPage($('.username').attr('id'));
                return;
              }
            __ihm.stopSession();
            __ihm.resetStats();
            __ihm.hideModal();
            __ihm.loadNamedGraphs();
        });
    }

    resetStats() {
      $('#btn-del').empty();
      $("#btn-del").append("<button id='btn-empty' onclick='__ihm.emptyDatabase(\"confirm\")' class='btn btn-danger'>Delete all</button>");
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


    setUploadForm(content,titleForm,route_overview,callback) {
      var service = new RestServiceJs("up/");
      service.getAll(function(formHtmlforUploadFiles) {
        let sizeFileMax = __ihm.user.isAdmin()?__ihm.sizeFileMaxAdmin:__ihm.sizeFileMaxUser;

        formHtmlforUploadFiles.html = formHtmlforUploadFiles.html.replace("___TITLE_UPLOAD___",titleForm);
        formHtmlforUploadFiles.html = formHtmlforUploadFiles.html.replace("___SIZE_UPLOAD____",(sizeFileMax/(1000*1000))+" Mo");

        $(content).html(formHtmlforUploadFiles.html);
        /*

              MAIN UPLOAD Third party => copy from /static/js/third-party/upload/main.js (thi file is disbale in askomics)

        */
        // Initialize the jQuery File Upload widget
        $(content).find('#fileupload').fileupload({
            // Uncomment the following to send cross-domain cookies:
            //xhrFields: {withCredentials: true},
            url: 'up/file/',
            maxChunkSize: __ihm.chunkSize,
            maxFileSize: sizeFileMax
        });

        // Enable iframe cross-domain access via redirect option
        $(content).find('#fileupload').fileupload(
            'option',
            'redirect',
            window.location.href.replace(
                /\/[^\/]*$/,
                '/cors/result.html?%s'
            )
        );

        // Load existing files
        $(content).find('#fileupload').addClass('fileupload-processing');
        $.ajax({
            // Uncomment the following to send cross-domain cookies:
            //xhrFields: {withCredentials: true},
            url: $(content).find('#fileupload').fileupload('option', 'url'),
            dataType: 'json',
            context: $(content).find('#fileupload')[0]
        }).always(function () {
            $(this).removeClass('fileupload-processing');
        }).done(function (result) {
            $(this).fileupload('option', 'done')
                .call(this, $.Event('done'), {result: result});
        });

        // Integrate button
        $('.integrate-button').click(function() {
            __ihm.displayModal('Please Wait', '', 'Close');
            var service = new RestServiceJs(route_overview);
            service.getAll(function(data) {
                callback(data);
                __ihm.hideModal();
            });

        });
      });
    }

    displayBlockedPage(username) {
      console.log('-+-+- displayBlockedPage -+-+-');
      $('#content_blocked').empty();
      let source = $('#template-blocked').html();
      let template = Handlebars.compile(source);

      let context = {name: username};
      let html = template(context);

      __ihm.hideModal();

      $('.container').hide();
      $('.container#navbar_content').show();
      $('#content_blocked').append(html).show();
    }

    loadUsers() {
      console.log('-+-+- loadUsers -+-+-');

      // __ihm.displayModal('Please wait', '', 'Close');

      let service = new RestServiceJs('get_users_infos');
      service.getAll(function(data) {
        $("#Users_adm").empty();
        let source = $('#template-admin-users').html();
        let template = Handlebars.compile(source);

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
        // __ihm.hideModal();
      });

      this.shortcutsView.updateShortcuts(true);
    }

    delUser(username, reload=false, passwdconf=false) {
      console.log('-+-+-delUser ' + username + ' -+-+-');
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
        console.log('CONFIRM DELETE USER ' + username);
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
          if (d == 'forbidden') {
            __ihm.showLoginForm();
            return;
          }
          if (d == 'blocked') {
            __ihm.displayBlockedPage($('.username').attr('id'));
            return;
          }
          if (reload) {
            location.reload();
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
      console.log('-+-+- lockUser -+-+-');
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
        if (d == 'forbidden') {
          __ihm.showLoginForm();
          return;
        }
        if (d == 'blocked') {
          __ihm.displayBlockedPage($('.username').attr('id'));
          return;
        }
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
      console.log('-+-+- setAdmin -+-+-');
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
        if (d == 'forbidden') {
          __ihm.showLoginForm();
          return;
        }
        if (d == 'blocked') {
          __ihm.displayBlockedPage($('.username').attr('id'));
          return;
        }
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
      console.log('-+-+- userForm -+-+-');

      let service = new RestServiceJs('get_my_infos');
      service.getAll(function(d) {
        // console.log(JSON.stringify(d));
        console.log('keys');
        console.log(d.apikeys);
        let source = $('#template-user-managment').html();
        let template = Handlebars.compile(source);
        let context = {user: d, keys: d.apikeys};
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
          console.log('888');
          __ihm.get_apikey(d.username, $('.new_apikey_name#' + d.username).val());
        });

        // Active the tooltip
        $('[data-toggle="tooltip"]').tooltip();

        // Copy apikey
        $('.copy_key').click(function() {
          console.log(this);
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
          console.log(this);
          __ihm.deleteApikey(this.id);
        });
      });
    }

    deleteApikey(key) {
      console.log('delete ' + key);
      let service = new RestServiceJs('del_apikey');
      let data = {'key': key};
      service.post(data, function(d) {
        console.log(data);
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
      console.log('-+-+-+ updatePasswd -+-+-+');
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
      console.log('-+-+- updateMail -+-+-');
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
      console.log('-+-+- get_apikey -+-+-+');
      console.log('for ' + username);
      console.log('keyname: ' + keyname);
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

    displayNavbar(loged, username, admin, blocked) {
        console.log('-+-+- displayNavbar -+-+-');
        $("#navbar").empty();
        let source = $('#template-navbar').html();
        let template = Handlebars.compile(source);

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
            __ihm.setUploadForm('div#content_integration',"Upload User Files","source_files_overview",displayIntegrationForm);
        });

        // Visual effect on active tab (Ask! / Integrate / Credits)
        $('.nav li').click(function(e) {

          //TODO : We can not defined nav li inside otherwise this function apply (define for the min nav ASKOMIS ).....
          // for now, to avoid a bad behaviours, we need to not defined id in sub nav tag
          if ( $(this).attr('id')=== undefined) return;

          $('.nav li.active').removeClass('active');

            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
            }


            if ( ! ( $(this).attr('id') in { 'help' : '','admin':'', 'user_menu': '' }) ) {

              $('.container').hide();
              $('.container#navbar_content').show();
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
        $('#signup_password2').keypress(function (e) {
          if(e.which == 13)  // the enter key code
          {
            $('#signup_button').click();
          }
        });

        $('#signup_button').click(function(e) {
          let username = $('#signup_username').val();
          let email = $('#signup_email').val();
          let password = $('#signup_password').val();
          let password2 = $('#signup_password2').val();

          let service = new RestServiceJs("signup");
          let model = { 'username': username,
                        'email': email,
                        'password': password,
                        'password2': password2  };

          service.post(model, function(data) {
            __ihm.hideModal();
            if (data.error.length !== 0) {
              $('#login_error').empty();
              for (let i = data.error.length - 1; i >= 0; i--) {
                $('#login_error').append(data.error[i] + '<br>');
              }
              $('#login_success').hide();
              $('#login_error').show();
            }else{
              $('#login_error').hide();
              $('#login_success').empty();
              $('#login_success').append('Account successfuly created!');
              $('#login_success').show();
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

          __ihm.displayModal('Please wait', '', 'Close');

          service.post(model, function(data) {
            __ihm.hideModal();
            if (data.error.length !== 0) {
              $('#login_error').empty();
              for (let i = data.error.length - 1; i >= 0; i--) {
                $('#login_error').append(data.error[i] + '<br>');
              }
              $('#login_success').hide();
              $('#login_error').show();
            }else{
              $('#login_error').hide();
              $('#login_success').empty();
              $('#login_success').append('You are logged now');
              $('#login_success').show();
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
