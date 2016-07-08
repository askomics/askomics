/*jshint esversion: 6 */

askomicsInitialization = false;

function startRequestSessionAskomics() {
  if ( askomicsInitialization ) return ;
  // Initialize the graph with the selected start point.
  $("#init").hide();
  $("#queryBuilder").show();
  d3.select("svg").remove();

  /* To manage construction of SPARQL Query */
  graphBuilder = new AskomicsGraphBuilder();
  /* To manage information about current node */
  nodeView = new AskomicsNodeView();
  /* To manage Attribute view on UI */
  attributesView = new AskomicsAttributesView();
  /* To manage Attribute view on UI */
  linksView = new AskomicsLinksView();
  /* To manage the D3.js Force Layout  */
  forceLayoutManager = new AskomicsForceLayoutManager();
  /* To manage information about User Datasrtucture  */
  userAbstraction = new AskomicsUserAbstraction();
  /* To manage information about menu propositional view */
  menuView = new AskomicsMenuView();
  /* To manage information about File menu */
  menuFile = new AskomicsMenuFile();

  askomicsInitialization = true;
}

function startVisualisation() {
    //Following code is automatically executed at start or is triggered by the action of the user
    startRequestSessionAskomics();
    forceLayoutManager.start();
}

function loadStartPoints() {

  var service = new RestServiceJs("startpoints");
  $("#btn-down").prop("disabled", true);
  $("#showNode").hide();
  $("#deleteNode").hide();

  service.getAll(function(startPointsDict) {
      $("#startpoints").empty();

      $.each(startPointsDict.nodes, function(key, value) {

          $("#startpoints").append($("<option></option>").attr("data-value", JSON.stringify(value)).text(value.label));
      });
      $("#starter").prop("disabled", true);
      $("#startpoints").click(function(){
          if ($("#starter").prop("disabled")) {
              $("#starter").prop("disabled", false);
          }
      });
  });
}

function loadStatistics(modal) {

  if (modal) {
    displayModal('Please Wait', '', 'Close');
  }

  abstraction = new AskomicsUserAbstraction();
  abstraction.loadUserAbstraction();


  var service = new RestServiceJs("statistics");
  service.getAll(function(stats) {
    $('#content_statistics').empty();
    $('#content_statistics')
    .append($("<p></p>").text("Number of triples  : "+stats.ntriples))
    .append($("<p></p>").text("Number of entities : "+stats.nentities))
    .append($("<p></p>").text("Number of classes : "+stats.nclasses))
    .append($("<div id='deleteButtons'></div>"));

    $("#deleteButtons").append("<p><button id='btn-empty' onclick='emptyDatabase(\"confirm\")' class='btn btn-danger'>Empty database</button></p>");

    table=$("<table></table>").addClass('table').addClass('table-bordered');
    th = $("<tr></tr>").addClass("table-bordered").attr("style", "text-align:center;");
    th.append($("<th></th>").text("Class"));
    th.append($("<th></th>").text("Nb"));
    table.append(th);

    $.each(stats['class'], function(key, value) {
      tr = $("<tr></tr>")
            .append($("<td></td>").text(key))
            .append($("<td></td>").text(value.count));
      table.append(tr);
    });
    $('#content_statistics').append(table);

    var entities = abstraction.getEntities() ;

    table=$("<table></table>").addClass('table').addClass('table-bordered');
    th = $("<tr></tr>").addClass("table-bordered").attr("style", "text-align:center;");
    th.append($("<th></th>").text("Class"));
    th.append($("<th></th>").text("Relations"));
    table.append(th);

    for (var ent1 in entities ) {
      tr = $("<tr></tr>")
            .append($("<td></td>").text(abstraction.removePrefix(entities[ent1])));
            rels = "";
            var t = abstraction.getRelationsObjectsAndSubjectsWithURI(entities[ent1]);
            var subjectTarget = t[0];
            for ( var ent2 in subjectTarget) {
              for (var rel of subjectTarget[ent2]) {
                rels += abstraction.removePrefix(entities[ent1]) + " ----" + abstraction.removePrefix(rel) + "----> " + abstraction.removePrefix(ent2) + "</br>";
              }
            }

            tr.append($("<td></td>").html(rels));
      table.append(tr);
    }

    $('#content_statistics').append(table);


    table = $("<table></table>").addClass('table').addClass('table-bordered');
    th = $("<tr></tr>").addClass("table-bordered").attr("style", "text-align:center;");
    th.append($("<th></th>").text("Class"));
    th.append($("<th></th>").text("Attributes"));
    table.append(th);

    for (ent1 in entities ) {
    //$.each(stats['class'], function(key, value) {
      tr = $("<tr></tr>")
            .append($("<td></td>").text(abstraction.removePrefix(entities[ent1])));
            attrs = "";
            cats = "";
            var listAtt = abstraction.getAttributesEntity(entities[ent1]);
            for (var att of listAtt) {
                attrs += '- '+att.label +' :'+abstraction.removePrefix(att.type)+ "</br>";
            }
            tr.append($("<td></td>").html(attrs));
      table.append(tr);
    //});
    }
    if (modal) {
        hideModal();
    }

    $('#content_statistics').append(table);

  });
}

function emptyDatabase(value) {
    if (value == 'confirm') {
        $("#deleteButtons").empty();
        $("#deleteButtons")
        .append('<p>Delete all data ? ')
        .append("<button id='btn-empty' onclick='emptyDatabase(\"yes\")' class='btn btn-danger'>Yes</button> ")
        .append("<button id='btn-empty' onclick='emptyDatabase(\"no\")' class='btn btn-default'>No</button></p>");
        return;
    }

    if (value == 'no') {
        $("#deleteButtons").empty();
        $("#deleteButtons").append("<p><button id='btn-empty' onclick='emptyDatabase(\"confirm\")' class='btn btn-danger'>Clear database</button></p>");
        return;
    }

    if (value == 'yes') {
        displayModal('Please wait ...', '', 'Close');
        var service = new RestServiceJs("empty_database");
            service.getAll(function(empty_db){
              hideModal();
              if ('error' in empty_db ) {
                alert(empty_db.error);
              }
            loadStatistics(false);
        });
    }
}

function displayModal(title, message, button) {
    $('#modalTitle').text(title);
    if (message == '') {
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


$(function () {
  // TODO: move inside AskomicsMenuFile
    // Startpoints definition
    loadStartPoints();

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

    // Get the overview of files to integrate
    $("#integration").click(function() {
        var service = new RestServiceJs("up/");
        service.getAll(function(formHtmlforUploadFiles) {
          $('div#content_integration').html(formHtmlforUploadFiles.html);
        });
    });

    // Visual effect on active tab (Ask! / Integrate / Credits)
    $('.nav li').click(function(e) {
        $('.nav li.active').removeClass('active');
        var $this = $(this);
        if (!$this.hasClass('active')) {
            $this.addClass('active');
        }
        $('.container').hide();
        $('.container#navbar_content').show();
        $('.container#content_' + $this.attr('id')).show();
        e.preventDefault();
    });

    // A helper for handlebars
    Handlebars.registerHelper('nl2br', function(text) {
        var nl2br = (text + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
        return new Handlebars.SafeString(nl2br);
    });
});
