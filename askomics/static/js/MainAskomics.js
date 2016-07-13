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
  /* To manage the D3.js Force Layout  */
  forceLayoutManager = new AskomicsForceLayoutManager();
  /* To manage information about User Datasrtucture  */
  userAbstraction = new AskomicsUserAbstraction();
  /* To manage information about menu propositional view */
  menuView = new AskomicsMenuView();
  /* To manage information about File menu */
  menuFile = new AskomicsMenuFile();

  AskomicsObjectView.defineClickMenu();

  askomicsInitialization = true;
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

  // delete the svg
  d3.select("svg").remove();

  // show the start point selector
  $("#init").show();

  loadStartPoints();
  askomicsInitialization = false;
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

function loadStatistics() {


  displayModal('Please Wait', '', 'Close');


  abstraction = new AskomicsUserAbstraction();
  abstraction.loadUserAbstraction();


  var service = new RestServiceJs("statistics");
  service.getAll(function(stats) {
    $('#statistics_div').empty();
    $('#statistics_div')
    .append($("<p></p>").text("Number of triples  : "+stats.ntriples))
    .append($("<p></p>").text("Number of entities : "+stats.nentities))
    .append($("<p></p>").text("Number of classes : "+stats.nclasses))
    .append($("<p></p>").text("Number of graphs: "+stats.ngraphs));

    table=$("<table></table>").addClass('table').addClass('table-bordered');
    th = $("<tr></tr>").addClass("table-bordered").attr("style", "text-align:center;");
    th.append($("<th></th>").text("Graph"));
    th.append($("<th></th>").text("Load Date"));
    th.append($("<th></th>").text("Username"));
    th.append($("<th></th>").text("Server"));
    th.append($("<th></th>").text("AskOmics Version"));
    table.append(th);

    $.each(stats.metadata, function(key) {
        tr = $("<tr></tr>")
            .append($("<td></td>").text(stats.metadata[key].filename))
            .append($("<td></td>").text(stats.metadata[key].loadDate))
            .append($("<td></td>").text(stats.metadata[key].username))
            .append($("<td></td>").text(stats.metadata[key].server))
            .append($("<td></td>").text(stats.metadata[key].version));
        table.append(tr);
    });

    $('#content_statistics').append(table);

    var form = $("<form class='form-horizontal'><fieldset class='form-group'><label>Choose what graph you want to delete</label><select class='form-control' id='dropNamedGraphSelected' multiple='multiple' ></select></fieldset><button id='dropNamedGraphButton' type='button' onclick='deleteNamedGraph($(\"#dropNamedGraphSelected\").val())' class='btn btn-primary'>Delete</button></form>");
    var select = form.find('select');

    var serviceNamedGraphs = new RestServiceJs('list_named_graphs');
    serviceNamedGraphs.getAll(function(namedGraphs) {
        for (let graphName in namedGraphs){
            select.append($("<option></option>").attr("value", namedGraphs[graphName]).append(namedGraphs[graphName]));
        }
    });

    $('#content_statistics').append(form);

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
    $('#statistics_div').append(table);

    var entities = abstraction.getEntities() ;

    table=$("<table></table>").addClass('table').addClass('table-bordered');
    th = $("<tr></tr>").addClass("table-bordered").attr("style", "text-align:center;");
    th.append($("<th></th>").text("Class"));
    th.append($("<th></th>").text("Relations"));
    table.append(th);

    for (var ent1 in entities ) {
      console.log(abstraction.getAttrib(entities[ent1],'rdfs:label'));
      tr = $("<tr></tr>")
            .append($("<td></td>").text(abstraction.getAttrib(entities[ent1],'rdfs:label')));
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

    $('#statistics_div').append(table);


    table = $("<table></table>").addClass('table').addClass('table-bordered');
    th = $("<tr></tr>").addClass("table-bordered").attr("style", "text-align:center;");
    th.append($("<th></th>").text("Class"));
    th.append($("<th></th>").text("Attributes"));
    table.append(th);

    for (ent1 in entities ) {
    //$.each(stats['class'], function(key, value) {
      tr = $("<tr></tr>")
            .append($("<td></td>").text(abstraction.getAttrib(entities[ent1],'rdfs:label')));
            attrs = "";
            cats = "";
            var listAtt = abstraction.getAttributesEntity(entities[ent1]);
            for (var att of listAtt) {
                attrs += '- '+att.label +"</br>";
            }
            tr.append($("<td></td>").html(attrs));
      table.append(tr);
    //});
    }

    hideModal();


    $('#statistics_div').append(table);

  });
}

function emptyDatabase(value) {
    if (value == 'confirm') {
        $("#btn-del").empty();
        $("#btn-del").append('Are you sure ? ')
                    .append($('<div></div>')
                                .attr('class', 'btn-group')
                                .attr('role', 'group')
                                .attr('aria-label', '...')
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
                                )
                          );
        return;
    }

    if (value == 'no') {
        $("#btn-del").empty();
        $("#btn-del").append("<button id='btn-empty' onclick='emptyDatabase(\"confirm\")' class='btn btn-danger'>Clear database</button>");
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
            $('#statistics_div').empty();
            $('#btn-del').empty();
            $("#btn-del").append("<button id='btn-empty' onclick='emptyDatabase(\"confirm\")' class='btn btn-danger'>Clear database</button>");
            $('#btn-del').append(' All triples deleted!');
            resetGraph();
        });
    }
}


function deleteNamedGraph(graphs) {
    displayModal('Please wait during deletion', 'Close');
    var service = new RestServiceJs("delete_graph");
    let data = {'namedGraphs':graphs };
        service.post(data, function(){
        hideModal();
        loadStatistics(false);
    });
}

function resetStats() {
  $('#btn-del').empty();
  $("#btn-del").append("<button id='btn-empty' onclick='emptyDatabase(\"confirm\")' class='btn btn-danger'>Clear database</button>");
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
