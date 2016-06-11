/*jshint esversion: 6 */

/*
  Manage The creation, update and deletaion inside the Attributes Graph view
*/

var AskomicsAttributesView = function () {

  var prefix = "view_";

  AskomicsAttributesView.prototype.remove = function (node) {
    $("#"+prefix+node.SPARQLid).remove();
  };

  AskomicsAttributesView.prototype.show = function (node) {
    $("#"+prefix+node.SPARQLid).show();
  };

  AskomicsAttributesView.prototype.hide = function (node) {
    $("#"+prefix+node.SPARQLid).hide();
  };

  AskomicsAttributesView.prototype.hideAll = function (node) {
    $("div[id*='"+ prefix +"']" ).hide();
  };

  AskomicsAttributesView.prototype.create = function (node) {
      // Add attributes of the selected node on the right side of AskOmics

      var elemUri = node.uri,
          elemId  = node.SPARQLid,
          nameDiv = prefix+node.SPARQLid ;

      var details = $("<div></div>").attr("id",nameDiv).addClass('div-details');

      var nameLab = $("<label></label>").attr("for",elemId).text("Name");
      var nameInp = $("<input/>").attr("id", "lab_" + elemId).addClass("form-control");

      details.append(nameLab).append(nameInp);

      nameInp.change(function(d) {
        var value = $(this).val();
        removeFilterCat(elemId);
        removeFilterNum(elemId);
        removeFilterStr(elemId);
        if (value === "") {
            return;
        }
        addFilterStr(elemId,value);
      });


      attributes = userAbstraction.getAttributesWithURI(node.uri);
      $.each(attributes, function(i) {

          attribute = graphBuilder.buildAttributeOrCategoryForNode(attributes[i],node);

          var id = attribute.id;

          var lab = $("<label></label>").attr("for",attribute.label).text(attribute.label);
          var inp = $("<select/>").attr("id",id).addClass("form-control").attr("multiple","multiple");
          // **********************************************************************************************
          // TODO: A COMMENCER ICI LE DEV POUR GESTION DES CATEGORIES !!!
          // **********************************************************************************************

          if (attribute.type.indexOf("http://www.w3.org/2001/XMLSchema#") < 0) {
              var tab = graphBuilder.buildConstraintsGraph();
              //var tab = [ [] , [] ];
              var labelSparqlVarId = attribute.SPARQLid;
              $('#waitModal').modal('show');
              inp.attr("list", "opt_" + id);
              //console.log(JSON.stringify(nameDiv));
              var service = new RestServiceJs("sparqlquery");
              var model = {
                'variates': [ "?"+labelSparqlVarId ],
                'constraintesRelations': tab[1],
                'constraintesFilters': []
              };

            //  console.log(attribute.uri);

              service.post(model, function(d) {
                  inp.append($("<option></option>").attr("value", "").attr("selected", "selected"));
                  var sizeSelect = 3 ;
                  if ( d.value.length<3 ) sizeSelect = d.value.length;
                  if ( d.value.length === 0 ) sizeSelect = 1;
                  inp.attr("size",sizeSelect);

                  if ( d.value.length > 1 ) {
                    for (var v of d.value) {
                      console.log("OOOOOOOOOOOOOOOOOOOOOOOOO  =>"+JSON.stringify(v));
                      inp.append($("<option></option>").attr("value", v[labelSparqlVarId]).append(v[labelSparqlVarId]));
                    }
                  } else if (d.value.length == 1) {
                    inp.append($("<option></option>").attr("value", d.value[0][labelSparqlVarId]).append(d.value[0][labelSparqlVarId]));
                  }
                $('#waitModal').modal('hide');
              });
          } else {
              if (attribute.type.indexOf("decimal") >= 0) {
                inp = $("<table></table>");

                v = $("<select></select>").attr("id", "sel_" + id).addClass("form-control");
                v.append($("<option></option>").attr("value", '=').append('='));
                v.append($("<option></option>").attr("value", '<').append('<'));
                v.append($("<option></option>").attr("value", '<=').append('<='));
                v.append($("<option></option>").attr("value", '>').append('>'));
                v.append($("<option></option>").attr("value", '>=').append('>='));
                v.append($("<option></option>").attr("value", '!=').append('!='));

                tr = $("<tr></tr>");
                tr.append($("<td></td>").append(v));
                v = $("<input/>").attr("id",id).attr("type", "text").addClass("form-control");
                tr.append($("<td></td>").append(v));
                inp.append(tr);
              } else {
                inp = $("<input/>").attr("id",id).attr("type", "text").addClass("form-control");
              }
          }
          // =============================================================================================
          //    Manage Attribute variate when eye is selected or deselected
          //

          var icon = $('<span></span>')
                  .attr('id', 'display_' + id)
                  .attr('aria-hidden','true')
                  .addClass('glyphicon')
                  .addClass('glyphicon-eye-open')
                  .addClass('display');

          icon.click(function() {
              if (icon.hasClass('glyphicon-eye-close')) {

                  icon.removeClass('glyphicon-eye-close');
                  icon.addClass('glyphicon-eye-open');
                  graphBuilder.activeAttributeFronNode(attribute.uri,node);
              } else {
                  icon.removeClass('glyphicon-eye-open');
                  icon.addClass('glyphicon-eye-close');
                  graphBuilder.unActiveAttributeFronNode(attribute.uri,node);
              }
          });

          details.append(lab).append(icon).append(inp);

          //$('#waitModal').modal('hide');
      });
      $("#nodeDetails").append(details);
  };
};
