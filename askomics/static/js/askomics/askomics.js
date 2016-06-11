var graph;

function startVisualisation() {
    // Initialize the graph with the selected start point.
    $("#init").hide();
    $("#queryBuilder").show();
    d3.select("svg").remove();

    //Following code is automatically executed at start or is triggered by the action of the user
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
    forceLayoutManager.start();

    //addConstraint('node',startPoint.id,startPoint.uri);

    //graph = new myGraph(graphBuilder,userAbstraction);

    //graph.addNode(startPoint);
    //addDisplay(startPoint.id);

    // Save initial query in the download button
    //launchQuery(0, 0, true);
}

function loadStartPoints() {

  var service = new RestServiceJs("startpoints");
  $("#btn-down").prop("disabled", true);
  $("#showNode").hide();
  $("#deleteNode").hide();

  service.getAll(function(startPointsDict) {
      $("#svgdiv").data({
        last_counter: startPointsDict.last_new_counter });

      $("#startpoints").empty();

      console.log("STARTS:"+JSON.stringify(startPointsDict));

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
  $('#waitModal').modal('show');

  var service = new RestServiceJs("statistics");
  service.getAll(function(stats) {
    $('#content_statistics').empty();
    $('#content_statistics')
    .append($("<p></p>").text("Number of triples  : "+stats.ntriples))
    .append($("<p></p>").text("Number of entities : "+stats.nentities))
    .append($("<p></p>").text("Number of classes : "+stats.nclasses));

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


    table=$("<table></table>").addClass('table').addClass('table-bordered');
    th = $("<tr></tr>").addClass("table-bordered").attr("style", "text-align:center;");
    th.append($("<th></th>").text("Class"));
    th.append($("<th></th>").text("Relations"));
    table.append(th);

    $.each(stats['class'], function(key, value) {
      tr = $("<tr></tr>")
            .append($("<td></td>").text(key));
            rels = "";
            $.each(value.relations, function(key_rel, value_rel) {
                rels += value_rel.source_id + " ----" + value_rel.relation_label + "----> " + value_rel.target_id + " ";
            });
            tr.append($("<td></td>").text(rels));
      table.append(tr);
    });
    $('#content_statistics').append(table);


    table = $("<table></table>").addClass('table').addClass('table-bordered');
    th = $("<tr></tr>").addClass("table-bordered").attr("style", "text-align:center;");
    th.append($("<th></th>").text("Class"));
    th.append($("<th></th>").text("Attributes"));
    table.append(th);

    $.each(stats['class'], function(key, value) {
      tr = $("<tr></tr>")
            .append($("<td></td>").text(key));
            attrs = "";
            $.each(value.attributes, function(key_attr, value_attr) {
                attrs += value_attr.label+", ";
            });
            tr.append($("<td></td>").text(attrs));
      table.append(tr);
    });

    $('#waitModal').modal('hide');
    $('#content_statistics').append(table);

  });
}


$(function () {
    /* To manage information about User Datasrtucture  */
    userAbstraction = new AskomicsUserAbstraction();
    userAbstraction.loadUserAbstraction();

    // Startpoints definition
    loadStartPoints();

    // Loading a sparql query file
    $(".uploadBtn").change(function(event) {
        var uploadedFile = event.target.files[0];
        if (uploadedFile) {
            var fr = new FileReader();
            fr.onload = function(e) {
                var contents = e.target.result;
                $("#init").hide();
                $("#svgdiv").hide();
                $("#nodeDetails").hide();
                $("#queryBuilder").show();
                $("#graph").attr("class", "col-md-12");
                $("#uploadedQuery").show();
                $("#uploadedQuery").text(contents);
                $("a#btn-qdown").attr("href", "data:text/plain;charset=UTF-8," + encodeURIComponent(contents));
            };
            fr.readAsText(uploadedFile);
        }
    });

    // Update of the query to download if an uploaded query is edited in AskOmics
    $("#uploadedQuery").bind("DOMSubtreeModified", function() {
        $("a#btn-qdown").attr("href", "data:text/plain;charset=UTF-8," + encodeURIComponent($("#uploadedQuery").text()));
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

    // Switch between close and open eye icon for unselected / selected attributes
  /*  $("#showNode").click(function() {
        var id = $("#nodeName").text();
        if ($(this).hasClass('glyphicon-eye-close')) {
            $(this).removeClass('glyphicon-eye-close');
            $(this).addClass('glyphicon-eye-open');

            addDisplay(id);
        } else {
            $(this).removeClass('glyphicon-eye-open');
            $(this).addClass('glyphicon-eye-close');
            removeDisplay(id);
        }
    });*/

    // Node deletion
    /*
    $("#deleteNode").click(function() {
        graph.removeNode($("#nodeName").text());
    });
*/
    // A helper for handlebars
    Handlebars.registerHelper('nl2br', function(text) {
        var nl2br = (text + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
        return new Handlebars.SafeString(nl2br);
    });
});
