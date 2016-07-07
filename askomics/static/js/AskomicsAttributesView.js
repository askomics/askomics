/*jshint esversion: 6 */

/*
  Manage The creation, update and deletaion inside the Attributes Graph view
*/

var AskomicsAttributesView = function () {

  var prefix = "rightview_"; /* TODO : This prefix have to be the same as Link view otherwise !!!!!!!!!!! */

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
    function makeRemoveIcon(field) {
          var removeIcon = $('<span class="glyphicon glyphicon-erase display"></span>');
          removeIcon.click(function() { field.val(null).trigger("change"); });
          return removeIcon;
    }

     var elemUri = node.uri,
          elemId  = node.SPARQLid,
          nameDiv = prefix+node.SPARQLid ;

      var details = $("<div></div>").attr("id",nameDiv).attr("nodeid", node.id).attr("sparqlid", node.SPARQLid).addClass('div-details');

      var nameLab = $("<label></label>").attr("for",elemId).text("ID");
      var nameInp = $("<input/>").attr("id", "lab_" + elemId).addClass("form-control");
      var removeIcon = $('<span class="glyphicon glyphicon-remove display"></span>');
      removeIcon.click(function() { field.val(null).trigger("change"); });

      details.append(nameLab).append(makeRemoveIcon(nameInp)).append(nameInp);

      nameInp.change(function(d) {
        var value = $(this).val();
        nodeid = $(this).parent().attr('nodeid');
        sparlid = $(this).parent().attr('sparqlid');

        graphBuilder.setFilterAttributes(nodeid,sparlid,value,'FILTER ( regex(str(?'+sparlid+'), "'+$(this).val()+'", "i" ))');
      });


      attributes = userAbstraction.getAttributesWithURI(node.uri);

      $.each(attributes, function(i) {
          /* if attribute is loaded before the creation of attribute view, we don t need to create a new */
          attribute = graphBuilder.getAttributeOrCategoryForNode(attributes[i],node);

          /* creation of new one otherwise */
          if ( ! attribute ) {
            attribute = graphBuilder.buildAttributeOrCategoryForNode(attributes[i],node);

          }
          
          var id = attribute.id;

          var lab = $("<label></label>").attr("for",attribute.label).text(attribute.label);
          var inp = $("<select/>").addClass("form-control").attr("multiple","multiple");

          var labelSparqlVarId = attribute.SPARQLid;

          if (attribute.type.indexOf("http://www.w3.org/2001/XMLSchema#") < 0) {
              displayModal('Please wait', '', 'Close');
              var tab = graphBuilder.buildConstraintsGraphForCategory(node,attribute.id);

              inp.attr("list", "opt_" + labelSparqlVarId)
                 .attr("sparqlid",labelSparqlVarId);
              //console.log(JSON.stringify(nameDiv));
              var service = new RestServiceJs("sparqlquery");
              var model = {
                'variates': [ "?"+labelSparqlVarId ],
                'constraintesRelations': tab[1],
                'constraintesFilters': [],
                'limit':100,
                'export':false,
              };

            //  console.log(attribute.uri);

              service.post(model, function(d) {
                  var selectedValue = "";
                  if (labelSparqlVarId in node.values) {
                    selectedValue = node.values[labelSparqlVarId];
                  }
                  var sizeSelect = 3 ;
                  if ( d.values.length<3 ) sizeSelect = d.values.length;
                  if ( d.values.length === 0 ) sizeSelect = 1;
                  inp.attr("size",sizeSelect);

                  if ( d.values.length > 1 ) {
                    for (var v of d.values) {
                      if ( selectedValue == v[labelSparqlVarId] ) {
                        inp.append($("<option></option>").attr("value", v[labelSparqlVarId]).attr("selected", "selected").append(v[labelSparqlVarId]));
                      } else {
                        inp.append($("<option></option>").attr("value", v[labelSparqlVarId]).append(v[labelSparqlVarId]));
                      }
                    }
                  } else if (d.values.length == 1) {
                    inp.append($("<option></option>").attr("value", d.values[0][labelSparqlVarId]).append(d.values[0][labelSparqlVarId]));
                  }
                  hideModal();
              });

              inp.change(function(d) {
                var value = $(this).val();
                if (value === null) value = '';
                nodeid = $(this).parent().attr('nodeid');
                sparlid = $(this).attr('sparqlid');

                //graphBuilder.setFilterAttributes(nodeid,sparlid,value,'FILTER ( ?'+sparlid+'="'+value[0]+'"^^xsd:string)');
                var listValue = "";
                for (var i=0;i<value.length;i++) {
                  listValue+=":"+value[i]+" ";
                }
                graphBuilder.setFilterAttributes(nodeid,sparlid,value,'VALUES ?'+sparlid+' { '+listValue +'}');
              });

          } else {
              if (attribute.type.indexOf("decimal") >= 0) {
                inputValue="";
                selectedOpValue="";
                inp = $("<table></table>").attr("sparqlid",labelSparqlVarId);
                if ('op_'+labelSparqlVarId in node.values) {
                  selectedOpValue = node.values['op_'+labelSparqlVarId];
                }
                if (labelSparqlVarId in node.values) {
                  inputValue = node.values[labelSparqlVarId];
                }

                v = $("<select></select>").addClass("form-control");
                var t;
                t=$("<option></option>").attr("value", '=').append('=');
                if ( selectedOpValue=='=') t.attr("selected", "selected");
                v.append(t);
                t=$("<option></option>").attr("value", '<').append('<');
                if ( selectedOpValue=='<') t.attr("selected", "selected");
                v.append(t);
                t=$("<option></option>").attr("value", '<=').append('<=');
                if ( selectedOpValue=='<=') t.attr("selected", "selected");
                v.append(t);
                t=$("<option></option>").attr("value", '>').append('>');
                if ( selectedOpValue=='>') t.attr("selected", "selected");
                v.append(t);
                t=$("<option></option>").attr("value", '>=').append('>=');
                if ( selectedOpValue=='>=') t.attr("selected", "selected");
                v.append(t);
                t=$("<option></option>").attr("value", '!=').append('!=');
                if ( selectedOpValue=='!=') t.attr("selected", "selected");
                v.append(t);

                tr = $("<tr></tr>");
                tr.append($("<td></td>").append(v));
                //v = $("<input/>").attr("type", "text").val(inputValue).addClass("form-control");
                v = $('<input type="text" class="form-control"/>').attr("id",id); // ?????????????????
                inp.val = v.val.bind(inputValue);// ?????????????????

                tr.append($("<td></td>").append(v));
                inp.append(tr);

                inp.change(function(d) {
                  var op = $(this).find("option:selected").text();
                  var value = $(this).find('input').val();
                  nodeid = $(this).parent().attr('nodeid');
                  sparlid = $(this).attr('sparqlid');

                  graphBuilder.setFilterAttributes(nodeid,sparlid,value,'FILTER ( ?'+sparlid+' '+op+' '+value+')');
                  graphBuilder.setFilterAttributes(nodeid,"op_"+sparlid,op,'');
                });

              } else {
                inputValue = "";
                if (labelSparqlVarId in node.values) {
                  inputValue = node.values[labelSparqlVarId];
                }

                inp = $("<input/>").attr("sparqlid",labelSparqlVarId).attr("type", "text").val(inputValue).addClass("form-control");
                inp.change(function(d) {
                  var value = $(this).val();
                  nodeid = $(this).parent().attr('nodeid');
                  sparlid = $(this).attr('sparqlid');
                  graphBuilder.setFilterAttributes(nodeid,sparlid,value,'FILTER ( regex(str(?'+sparlid+'), "'+$(this).val()+'", "i" ))');
                });
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

          details.append(lab).append(makeRemoveIcon(inp)).append(icon).append(inp);

          //$('#waitModal').modal('hide');
      });
      $("#viewDetails").append(details);
  };
};
