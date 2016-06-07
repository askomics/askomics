/*jshint esversion: 6 */

/*
  Manage The creation, update and deletaion inside the Attributes Graph view
*/

var AskomicsAttributesView = function () {

  var prefix = "view_";

  AskomicsAttributesView.prototype.removeView = function (node) {
    $("#"+prefix+node.SPARQLid).remove();
  };

  AskomicsAttributesView.prototype.showView = function (node) {
    $("#"+prefix+node.SPARQLid).show();
  };

  AskomicsAttributesView.prototype.hideView = function (node) {
    $("#"+prefix+node.SPARQLid).hide();
  };

  AskomicsAttributesView.prototype.hideAllView = function (node) {
    $("div[id*='"+ prefix +"']" ).hide();
  };

  AskomicsAttributesView.prototype.createView = function (node) {
      // Add attributes of the selected node on the right side of AskOmics

      var elemUri = node.uri,
          elemId  = node.SPARQLid,
          nameDiv = prefix+node.SPARQLid ;

      var details = $("<div></div>").attr("id",nameDiv).addClass('div-details');

      /*
      var addSpecified = function(link) {
          addConstraint('node', link.id, link.specified_by.uri);
          addConstraint('link', link.parent_id, link.specified_by.relation, link.id);
          addConstraint('link', link.child_id, link.specified_by.relation, link.id);
      };
*/
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
          graphBuilder.setSPARQLVariateId(attributes[i]);//TODO : change ==> the variable of DK is changed every times....
          var id = attributes[i].id;
          var lab = $("<label></label>").attr("for",attributes[i].label).text(attributes[i].label.replace("has_",""));
          var inp = $("<select/>").attr("id",id).addClass("form-control").attr("multiple","multiple");
          //var inp = $("<div/>").attr("id",id).addClass("form-control");
          if (attributes[i].type.indexOf("http://www.w3.org/2001/XMLSchema#") < 0) {
              $('#waitModal').modal('show');
              inp.attr("list", "opt_" + id);
              //console.log(JSON.stringify(nameDiv));
              var service = new RestServiceJs("category_value");
              var model = {
                'category_uri': attributes[i].type,
                'entity': elemUri,
                'category': attributes[i].uri
              };

            //  console.log(attributes[i].uri);
              service.post(model, function(d) {
                //  var datalist = $("<datalist></datalist>").attr("id", "opt_" + id);
                  inp.append($("<option></option>").attr("value", "").attr("selected", "selected"));
                  var sizeSelect = 3 ;
                  if ( d.value.length<3 ) sizeSelect = d.value.length;
                  if ( d.value.length === 0 ) sizeSelect = 1;
                //  console.log(d.value.length);
                  inp.attr("size",sizeSelect);

                  if ( d.value.length > 1 ) {
                    for (var v of d.value) {
                      inp.append($("<option></option>").attr("value", v).append(v));
                    }
                  } else if (d.value.length == 1) {
                    inp.append($("<option></option>").attr("value", d.value[0]).append(d.value[0]));
                  }
                //  inp.append(datalist);
                $('#waitModal').modal('hide');
              });
          } else {
              // OFI -> new adding filter on numeric
              if (attributes[i].type.indexOf("decimal") >= 0) {
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
                  .addClass('glyphicon-eye-close')
                  .addClass('display');

          icon.click(function() {
              if (icon.hasClass('glyphicon-eye-close')) {
                  icon.removeClass('glyphicon-eye-close');
                  icon.addClass('glyphicon-eye-open');

                  graphBuilder.setConstrainteWithAttribute(node,attributes[i].uri,attributes[i].type);

                  if  (attributes[i].type.indexOf("http://www.w3.org/2001/XMLSchema#") < 0) {
                      addConstraint('node',id,
                                  attributes[i].type);
                  }
                  addConstraint('attribute',id,
                                  attributes[i].uri,
                                  attributes[i].parent);
              } else {
                          icon.removeClass('glyphicon-eye-open');
                          icon.addClass('glyphicon-eye-close');
              }
          });

          details.append(lab).append(icon).append(inp);

          // =============================================================================================

          inp.change(function() {
              var value = $(this).find('#'+id).val();

              if ( typeof value === 'undefined' ) {
                 value = $(this).find('#opt_'+id).val();
              }

              if ( typeof value === 'undefined' || value === '' ) {
                value = $(this).val();
              }

              removeFilterCat(id);
              removeFilterNum(id);
              removeFilterStr(id);

              if (value === "") {
                  if (!isDisplayed(id)) {
                      removeConstraint(id);

                      // If no attributes of a link are selected, remove the from the query
                      /*
                      if ((data) && (!hasConstraint(null,data.id,['node', 'link']))) {
                          removeConstraint(data.id);
                      }*/
                  }
                  return;
              }

              // if specified link
          //    if (data) addSpecified(data);

              if  (attributes[i].type.indexOf("http://www.w3.org/2001/XMLSchema#") < 0) {
                  addConstraint('node',id,
                      attributes[i].type);
              }

              addConstraint('attribute',id,
                  attributes[i].uri,
                  attributes[i].parent);

              if  (attributes[i].type.indexOf("#decimal") > 0) {
                var operator = $(this).find('#sel_'+ id).val();
                addFilterNum(id,value,operator);
              } else if  (attributes[i].type.indexOf("#string") > 0) {
                addFilterStr(id,value);
              } else { /* Category */
                addFilterCat(id,value);
              }
          });

          //$('#waitModal').modal('hide');
      });
      $("#nodeDetails").append(details);
  };
};
