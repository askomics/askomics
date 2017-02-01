/*jshint esversion: 6 */

/* Manage theses variables with a Singleton Classes */
var askomicsInitialization = false;
var forceLayoutManager ;

function startRequestSessionAskomics() {
  console.log('---> startRequestSessionAskomics');

  if ( askomicsInitialization ) return ;
  // Initialize the graph with the selected start point.
  $("#init").hide();
  $("#queryBuilder").show();
  d3.select("svg").remove();

  /* To manage construction of SPARQL Query */
  //graphBuilder = new AskomicsGraphBuilder(new AskomicsUserAbstraction());

  /* To manage the D3.js Force Layout  */
  forceLayoutManager = new AskomicsForceLayoutManager();
  askomicsInitialization = true;

  AskomicsObjectView.defineClickMenu();
}

function startVisualisation() {
    //Following code is automatically executed at start or is triggered by the action of the user
    startRequestSessionAskomics();
    forceLayoutManager.start();
}

function resetGraph() {
  if ( ! askomicsInitialization ) return ;

  // hide graph
  $("#queryBuilder").hide();

  // hide results table
  $("#results").empty();

  //remove all rightviews
  AskomicsObjectView.removeAll();

  new AskomicsPanelViewBuilder().removeAll();

  //FL
  forceLayoutManager.reset() ;
  new AskomicsGraphBuilder().reset();

  // delete the svg
  d3.select("svg").remove();

  // show the start point selector
  $("#init").show();
  loadStartPoints();

  askomicsInitialization = false;
}

function managePythonErrorEvent(data) {
  if (data.error) {
    $("#main_warning_display").html('<strong><span class="glyphicon glyphicon-exclamation-sign"></span> ERROR:</strong> ' +
                       data.error.replace(/\n/g,'<br/>'))//.replace('\\n',"&#13;")
                      .removeClass('hidden alert-success')
                      .removeClass('hidden alert-warning')
                      .addClass('show alert-danger');
    return false;
  }
  //otherwise empty last message !
  $("#main_warning_display").empty();
  return true;
}

function loadStartPoints() {
  console.log('---> loadStartPoints');

  var service = new RestServiceJs("startpoints");
  $("#btn-down").prop("disabled", true);
  $("#showNode").hide();
  $("#deleteNode").hide();

  service.getAll(function(startPointsDict) {
      if (! managePythonErrorEvent(startPointsDict)) return;

      console.log(JSON.stringify(startPointsDict));

      $("#startpoints").empty();

      $.each(startPointsDict.nodes, function(key, value) {

        let text;

        if (value.public && value.private) {
          text = $('<em></em>').append($('<strong></strong>').attr('class', 'text-warning')
                               .append($('<i></i>').attr('class', 'fa fa-globe text-warning'))
                               .append(' ')
                               .append($('<i></i>').attr('class', 'fa fa-lock text-primary'))
                               .append(' ' + value.label));
        }

        if (value.public && !value.private) {
          text = $('<em></em>').attr('class', 'text-warning')
                               .append($('<i></i>').attr('class', 'fa fa-globe'))
                               .append(' ' + value.label);
        }

        if (!value.public && value.private) {
          text = $('<strong></strong>').attr('class', 'text-primary')
                               .append($('<i></i>').attr('class', 'fa fa-lock'))
                               .append(' ' + value.label);
        }

        $('#startpoints').append($('<option></option>').attr('data-value', JSON.stringify(value))
                                                         .append(text));

      });
      $("#starter").prop("disabled", true);
      $("#startpoints").click(function(){
          if ($("#starter").prop("disabled")) {
              $("#starter").prop("disabled", false);
          }
      });
  });
}

function loadNamedGraphs() {

    new AskomicsUserAbstraction().loadUserAbstraction();

    var select = $('#dropNamedGraphSelected');
    select.empty();
    manageDelGraphButton();

    var serviceNamedGraphs = new RestServiceJs('list_private_graphs');
    serviceNamedGraphs.getAll(function(namedGraphs) {
        if (namedGraphs == 'forbidden') {
          showLoginForm();
          return;
        }
        if (namedGraphs == 'blocked') {
          displayBlockedPage($('.username').attr('id'));
        }
        if (namedGraphs.length === 0) {
          disableDelButton();
          return;
        }else{
          enableDelButton();
        }
        for (let graphName in namedGraphs){
            select.append($("<option></option>").attr("value", namedGraphs[graphName])
                                                .append(formatGraphName(namedGraphs[graphName])));
        }
    });
}

function unselectGraphs() {
  $('#dropNamedGraphSelected option:selected').removeAttr("selected");
  manageDelGraphButton();
}

function manageDelGraphButton() {
  let graphs = $('#dropNamedGraphSelected').val();
  if (graphs === null) {
    $('#btn-empty-graph').prop('disabled', true);
  }else{
    $('#btn-empty-graph').prop('disabled', false);
  }
}

function disableDelButton() {
  $('#btn-empty').prop('disabled', true);
}

function enableDelButton() {
  $('#btn-empty').prop('disabled', false);
}

function formatGraphName(name) {
  /*
  Transform the name of the graph into a readable string
  */
  let date = name.substr(name.lastIndexOf('/') + 1);
  let new_name = name.substr(0,name.lastIndexOf('/'));
  return new_name+" ("+date+")";
}

function showLoginForm() {
  $(".container:not(#navbar_content)").hide();
  $('#content_login').show();
  $('.nav li.active').removeClass('active');
  $("#login").addClass('active');
  displayNavbar(false, '');
}

function loadStatistics() {
    console.log('-+-+- loadStatistics -+-+-');

    let service = new RestServiceJs('statistics');

    displayModal('Loading statistics...', '', 'Close');
    service.getAll(function(stats) {
      if (stats == 'forbidden') {
        showLoginForm();
        return;
      }
      if (stats == 'blocked') {
          displayBlockedPage($('.username').attr('id'));
          return;
      }

      $('#content_statistics').empty();
      let source = $('#template-stats').html();
      let template = Handlebars.compile(source);
      let context = {stats: stats};
      let html = template(context);
      $('#content_statistics').append(html);

      hideModal();
    });
}


function emptyDatabase(value) {
    if (value == 'confirm') {
        $("#btn-del").empty();
        $("#btn-del")//.append('Confirm')
                      .append($('<button></button>')
                            .attr('type', 'button')
                            .attr('class', 'btn btn-danger')
                            .attr('onclick', 'emptyDatabase(\"yes\")')
                            .append('Yes')
                      ).append($('<button></button>')
                            .attr('type', 'button')
                            .attr('class', 'btn btn-default')
                            .attr('onclick', 'emptyDatabase(\"no\")')
                            .append('No')
                          );
        return;
    }

    if (value == 'no') {
        $("#btn-del").empty();
        $("#btn-del").append("<button id='btn-empty' onclick='emptyDatabase(\"confirm\")' class='btn btn-danger'>Delete all</button>");
        return;
    }

    if (value == 'yes') {
        displayModal('Please wait ...', '', 'Close');
        var service = new RestServiceJs("empty_user_database");
            service.getAll(function(empty_db){
              if (empty_db == 'forbidden') {
                showLoginForm();
              }
              hideModal();
              if ('error' in empty_db ) {
                alert(empty_db.error);
              }
            $('#statistics_div').empty();
            $('#btn-del').empty();
            $("#btn-del").append("<button id='btn-empty' onclick='emptyDatabase(\"confirm\")' class='btn btn-danger'>Delete all</button>");
            $('#btn-del').append(' All triples deleted!');
            resetGraph();
            resetStats();
            loadNamedGraphs();
        });
    }
}


function deleteNamedGraph(graphs) {
    displayModal('Please Wait', '', 'Close');
    var service = new RestServiceJs("delete_graph");
    let data = {'namedGraphs':graphs };
        service.post(data, function(d){
          if (d == 'forbidden') {
            showLoginForm();
            return;
          }
          if (d == 'blocked') {
            displayBlockedPage($('.username').attr('id'));
            return;
          }
        resetGraph();
        resetStats();
        hideModal();
        loadNamedGraphs();
    });
}

function resetStats() {
  $('#btn-del').empty();
  $("#btn-del").append("<button id='btn-empty' onclick='emptyDatabase(\"confirm\")' class='btn btn-danger'>Delete all</button>");
  $('#statistics_div').empty();
}

function displayModal(title, message, button) {
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

function displayModalHtml(title, message, button) {
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

function hideModal(){
    $('#modal').modal('hide');
}

function downloadTextAsFile(filename, text) {
    // Download text as file
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


function setUploadForm(content,titleForm,route_overview,callback) {
  var service = new RestServiceJs("up/");
  service.getAll(function(formHtmlforUploadFiles) {
    formHtmlforUploadFiles.html = formHtmlforUploadFiles.html.replace("___TITLE_UPLOAD___",titleForm);

    $(content).html(formHtmlforUploadFiles.html);
    /*

          MAIN UPLOAD Third party => copy from /static/js/third-party/upload/main.js (thi file is disbale in askomics)

    */
    // Initialize the jQuery File Upload widget
    $(content).find('#fileupload').fileupload({
        // Uncomment the following to send cross-domain cookies:
        //xhrFields: {withCredentials: true},
        url: '/up/file/'
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
        displayModal('Please Wait', '', 'Close');
        var service = new RestServiceJs(route_overview);
        service.getAll(function(data) {
            callback(data);
            hideModal();
        });

    });
  });
}

function displayBlockedPage(username) {
  console.log('-+-+- displayBlockedPage -+-+-');
  $('#content_blocked').empty();
  let source = $('#template-blocked').html();
  let template = Handlebars.compile(source);

  let context = {name: username};
  let html = template(context);

  hideModal();

  $('.container').hide();
  $('.container#navbar_content').show();
  $('#content_blocked').append(html).show();
}

function loadUsers() {
  console.log('-+-+- loadUsers -+-+-');

  displayModal('Please wait', '', 'Close');

  let service = new RestServiceJs('get_users_infos');
  service.getAll(function(data) {
    $("#Users_adm").empty();
    let source = $('#template-admin-users').html();
    let template = Handlebars.compile(source);

    let context = {users: data.result};
    let html = template(context);

    $("#Users_adm").append(html);
    $('.lock_user').click(function() {
      lockUser(this.id, true);
    });
    $('.unlock_user').click(function() {
      lockUser(this.id, false);
    });
    $('.set_admin').click(function() {
      setAdmin(this.id, true);
    });
    $('.unset_admin').click(function() {
      setAdmin(this.id, false);
    });
    hideModal();
  });

  new ShortcutsParametersView().updateShortcuts(true);
}

function lockUser(username, lock) {
  console.log('-+-+- lockUser -+-+-');
  let service = new RestServiceJs('lockUser');
  let data = {'username': username, 'lock': lock};
  service.post(data, function(d) {
    if (d == 'forbidden') {
      showLoginForm();
      return;
    }
    if (d == 'blocked') {
      displayBlockedPage($('.username').attr('id'));
      return;
    }
    // Reload the page
    if (d == 'success') {
      loadUsers();
    }
  });
}


function setAdmin(username, admin) {
  console.log('-+-+- setAdmin -+-+-');
  let service = new RestServiceJs('setAdmin');
  let data = {'username': username, 'admin': admin};
  service.post(data, function(d) {
    if (d == 'forbidden') {
      showLoginForm();
      return;
    }
    if (d == 'blocked') {
      displayBlockedPage($('.username').attr('id'));
      return;
    }
    // Reload the page
    if (d == 'success') {
      loadUsers();
    }
  });
}


function displayNavbar(loged, username, admin, blocked) {
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
        setUploadForm('div#content_integration',"Upload User Files","source_files_overview",displayIntegrationForm);
    });

    // $("#integration_ttl").click(function() {
    //     setUploadForm('div#content_integration_ttl',"Upload User TTL Files","insert_files_rdf",displayTableRDF);
    // });

    // $("#integration_gff").click(function() {
    //     setUploadForm('div#content_integration_gff', 'Upload User GFF3 Files', "source_files_overview_gff", displayGffForm);
    // });

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
          if (data.error.length !== 0) {
            $('#signup_error').empty();
            for (let i = data.error.length - 1; i >= 0; i--) {
              $('#signup_error').append(data.error[i] + '<br>');
            }
            $('#signup_success').hide();
            $('#signup_error').show();
          }else{
            $('#signup_error').hide();
            $('#signup_success').empty();
            $('#signup_success').append('Account successfully created!');
            $('#signup_success').show();
            // User is logged, show the special button
            console.log(data);
            let user = new AskomicsUser(data.username, data.admin, data.blocked);
            user.checkUser();
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

      displayModal('Please wait', '', 'Close');

      service.post(model, function(data) {
        hideModal();
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
          let user = new AskomicsUser(data.username, data.admin);
          user.logUser();
        }
      });
    });

    $('#logout').click(function(e) {
      let user = new AskomicsUser();
      user.logout();
      // $('.container#content_interrogation').show();
    });

    // admin page
    $('#administration').click(function() {
      loadUsers();
    });

}

$(function () {
  // TODO: move inside AskomicsMenuFile
    new ShortcutsParametersView().updateShortcuts();
    // Startpoints definition
    loadStartPoints();
    // check if a user is loged in
    let user = new AskomicsUser('');
    user.checkUser();

    // Loading a sparql query file
    $(".uploadBtn").change( function(event) {
      var uploadedFile = event.target.files[0];
      if (uploadedFile) {
          var fr = new FileReader();
          fr.onload = function(e) {
            var contents = e.target.result;
            startRequestSessionAskomics();
            forceLayoutManager.startWithQuery(contents);
          };
          fr.readAsText(uploadedFile);
      }
    });

    // A helper for handlebars
    Handlebars.registerHelper('nl2br', function(text) {
        var nl2br = (text + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
        return new Handlebars.SafeString(nl2br);
    });
});
