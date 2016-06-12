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
    console.log("======> SHOW ATTRIBUTE VIEW");
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

      var nameLab = $("<label></label>").attr("for",elemId).text("ID");
      var nameInp = $("<input/>").attr("nodeid", node.id).attr("sparqlid", node.SPARQLid).addClass("form-control");

      details.append(nameLab).append(nameInp);

      nameInp.change(function(d) {
        var value = $(this).val();
        console.log("VALUE:"+$(this).attr('nodeid'));
        console.log("VALUE:"+$(this).attr('sparqlid'));
        nodeid = $(this).attr('nodeid');
        sparlid = $(this).attr('sparqlid');

        graphBuilder.setFilterAttributes(nodeid,sparlid,'FILTER ( regex(str(?'+sparlid+'), "'+$(this).val()+'", "i" ))');
      //  userAbstraction.
        /*
        removeFilterCat(elemId);
        removeFilterNum(elemId);
        removeFilterStr(elemId);
        if (value === "") {
            return;
        }
        addFilterStr(elemId,value);
        */
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
                  if ( d.values.length<3 ) sizeSelect = d.values.length;
                  if ( d.values.length === 0 ) sizeSelect = 1;
                  inp.attr("size",sizeSelect);

                  if ( d.values.length > 1 ) {
                    for (var v of d.values) {
                      inp.append($("<option></option>").attr("value", v[labelSparqlVarId]).append(v[labelSparqlVarId]));
                    }
                  } else if (d.values.length == 1) {
                    inp.append($("<option></option>").attr("value", d.values[0][labelSparqlVarId]).append(d.values[0][labelSparqlVarId]));
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
          var eyeLabel = attribute.actif?'glyphicon-eye-open':'glyphicon-eye-close';
          var icon = $('<span></span>')
                  .attr('atturi', attribute.id)
                  .attr('nodeid', node.id)
                  .attr('aria-hidden','true')
                  .addClass('glyphicon')
                  .addClass(eyeLabel)
                  .addClass('display');

          icon.click(function(d) {
              if (icon.hasClass('glyphicon-eye-close')) {
                  icon.removeClass('glyphicon-eye-close');
                  icon.addClass('glyphicon-eye-open');
              } else {
                  icon.removeClass('glyphicon-eye-open');
                  icon.addClass('glyphicon-eye-close');
              }

              var atturi = $(this).attr('atturi');
              var nodeid = $(this).attr('nodeid');
              graphBuilder.switchActiveAttribute(atturi,nodeid);
          });

          details.append(lab).append(icon).append(inp);

          //$('#waitModal').modal('hide');
      });
      $("#nodeDetails").append(details);
  };
};
