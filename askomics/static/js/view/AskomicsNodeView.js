/*jshint esversion: 6 */

/*
  Manage The creation, update and deletaion inside the Attributes Graph view
*/

class AskomicsNodeView extends AskomicsObjectView {

  constructor(node) {
    super(node);
    this.node = node;
  }

  display_help() {
    let help_title = 'Node '+this.node.label;
    let help_str = ' Choose which attributes you want to see on the right panel.';
    help_str += ' Filter this attributes by choosing values';
    $('#help_figure').addClass( "hidden" );
    displayModal(help_title, help_str, 'ok');
  }

/* ===============================================================================================*/

  buildCategory(node,attribute) {

    let labelSparqlVarId = attribute.SPARQLid;
    let URISparqlVarId   = "URICat"+attribute.SPARQLid;
    let inp = $("<select/>").addClass("form-control").attr("multiple","multiple");

    displayModal('Please wait', '', 'Close');
    var tab = node.buildConstraintsGraphForCategory(attribute.id);

    inp.attr("list", "opt_" + labelSparqlVarId)
       .attr("sparqlid",URISparqlVarId);
    //console.log(JSON.stringify(nameDiv));
    var service = new RestServiceJs("sparqlquery");
    var model = {
      'variates': tab[0],
      'constraintesRelations': tab[1],
      'constraintesFilters': tab[2],
      'limit' :-1,
      'export':false,
    };

  //  console.log(attribute.uri);
    service.post(model, function(d) {
        let selectedValue = "";
        if (labelSparqlVarId in node.values) {
          selectedValue = node.values[labelSparqlVarId];
        }
        /* bubble sort */
        let isNotSort = true;
        while ( isNotSort) {
          isNotSort = false;
          for (let i=0;i<d.values.length-1;i++) {
            if ( d.values[i][URISparqlVarId] > d.values[i+1][URISparqlVarId] ) {
              let a = d.values[i];
              d.values[i] = d.values[i+1];
              d.values[i+1] = a ;
              isNotSort = true;
            }
          }
        }

        var sizeSelect = 3 ;
        if ( d.values.length<3 ) sizeSelect = d.values.length;
        if ( d.values.length === 0 ) sizeSelect = 1;
        inp.attr("size",sizeSelect);
        if ( d.values.length > 1 ) {
          for (let v of d.values) {
            if ( selectedValue == v[labelSparqlVarId] ) {
              inp.append($("<option></option>").attr("value", v[URISparqlVarId]).attr("selected", "selected").append(v[labelSparqlVarId]));
            } else {
              inp.append($("<option></option>").attr("value", v[URISparqlVarId]).append(v[labelSparqlVarId]));
            }
          }
        } else if (d.values.length == 1) {
          inp.append($("<option></option>").attr("value", d.values[0][URISparqlVarId]).append(d.values[0][labelSparqlVarId]));
        }
        hideModal();
    });

    inp.change(function(d) {
      var value = $(this).val();
      if (!value) value = '';
      let nodeid = $(this).parent().attr('nodeid');
      let sparqlid = $(this).attr('sparqlid');

      if ( sparqlid === undefined ) {
        throw new Error("AskomicsNodeView: can not reach sparqlid attribute!");
      }

      //graphBuilder.setFilterAttributes(nodeid,sparlid,value,'FILTER ( ?'+sparlid+'="'+value[0]+'"^^xsd:string)');
      var listValue = "";
      for (let i=0;i<value.length;i++) {
        listValue+="<"+value[i]+"> ";
      }
      graphBuilder.setFilterAttributes(nodeid,sparqlid,value,'VALUES ?'+sparqlid+' { '+listValue +'}');
    });

    return inp;
  }

/* ===============================================================================================*/
  buildDecimal(node,attribute) {
    let labelSparqlVarId = attribute.SPARQLid;
    let id               = attribute.id;
    let inputValue       = "";
    let selectedOpValue  = "";

    let inp = $("<table></table>").attr("sparqlid",labelSparqlVarId);
    if ('op_'+labelSparqlVarId in node.values) {
      selectedOpValue = node.values['op_'+labelSparqlVarId];
    }
    if (labelSparqlVarId in node.values) {
      inputValue = node.values[labelSparqlVarId];
    }

    let v = $("<select></select>").addClass("form-control");
    let t;
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

    let tr = $("<tr></tr>");
    tr.append($("<td></td>").append(v));
    //v = $("<input/>").attr("type", "text").val(inputValue).addClass("form-control");
    v = $('<input type="text" class="form-control"/>').attr("id",id); // ?????????????????
    inp.val = v.val.bind(inputValue);// ?????????????????

    tr.append($("<td></td>").append(v));
    inp.append(tr);

    inp.change(function(d) {
      var op = $(this).find("option:selected").text();
      var value = $(this).find('input').val();
      let nodeid = $(this).parent().attr('nodeid');
      let sparlid = $(this).attr('sparqlid');

      graphBuilder.setFilterAttributes(nodeid,sparlid,value,'FILTER ( ?'+sparlid+' '+op+' '+value+')');
      graphBuilder.setFilterAttributes(nodeid,"op_"+sparlid,op,'');
    });
    return inp ;
  }
  /* ===============================================================================================*/
    buildString(node,labelSparqlVarId,id) {
      let inputValue       = "";

      if (labelSparqlVarId in node.values) {
        inputValue = node.values[labelSparqlVarId];
      }
      let inp =$("<div></div>");

      //let tab = $("<table></table>", { padding: "20px" }).attr("sparqlid",labelSparqlVarId).appendTo(inp);
      //let tr  = $("<tr></tr>").appendTo(tab);
      //$("<td></td>").append($("<small/>").append($("<label></label>").addClass("text-muted").text("Exact match"))).appendTo(tr);
      //let typ  = $("<td></td>").append($('<input/>', { type: 'checkbox', checked: true })).appendTo(tr);
      let st = $("<input/>").attr("sparqlid",labelSparqlVarId).attr("type", "text").val(inputValue).addClass("form-control").appendTo(inp);

      inp.change(function(d) {
        let value = $(this).find(":input[type='text']").val();
        let sparqlid = $(this).find(":input[type='text']").attr('sparqlid');

        let nodeid = $(this).parent().attr('nodeid');

        if ( graphBuilder.isregexp(sparqlid) ) {
          graphBuilder.setFilterAttributes(nodeid,sparqlid,value,'FILTER ( ?'+sparqlid+' = "'+value+'" )');
        } else {
          graphBuilder.setFilterAttributes(nodeid,sparqlid,value,'FILTER ( regex(str(?'+sparqlid+'), "'+value+'", "i" ))');
        }
      });
      return inp ;
    }
/* ===============================================================================================*/
  create() {
    var node = this.node;

    // dedicated to String entry
    function makeRegExpIcon(nodeid,attributeid) {
      var icon = $('<span></span>')
              .attr('attid', attributeid)
              .attr('nodeid', nodeid)
              .attr('aria-hidden','true')
              .addClass('glyphicon')
              .addClass('glyphicon-filter')
              .addClass('display');

      icon.click(function(d) {
          if (icon.hasClass('glyphicon-filter')) {
                icon.removeClass('glyphicon-filter');
                icon.addClass('glyphicon-font');
          } else {
                icon.removeClass('glyphicon-font');
                icon.addClass('glyphicon-filter');
          }

          var attid  = $(this).attr('atturi');
          var nodeid = $(this).attr('nodeid');
          let n = graphBuilder.getInstanciedNode(nodeid);
          if (! n ) {
            throw new Exception("AskomicsNodeView: Can not find instancied node:"+nodeid);
          }
          n.switchRegexpMode(attid);
      });
      return icon;
    }
      // Add attributes of the selected node on the right side of AskOmics
    function makeRemoveIcon(field) {
          var removeIcon = $('<span class="glyphicon glyphicon-erase display"></span>');
          removeIcon.click(function() { field.val(null).trigger("change"); });
          return removeIcon;
    }

    function makeEyeIcon(node,attribute) {
      // =============================================================================================
      //    Manage Attribute variate when eye is selected or deselected
      //
      var eyeLabel = attribute.actif?'glyphicon-eye-open':'glyphicon-eye-close';
      var icon = $('<span></span>')
              .attr('attid', attribute.id)
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

          var attid = $(this).attr('attid');
          var nodeid = $(this).attr('nodeid');
          graphBuilder.switchActiveAttribute(attid,nodeid);
      });
      return icon;
    }

     var elemUri = node.uri,
          elemId  = node.SPARQLid,
          nameDiv = this.prefix+node.SPARQLid ;

      var details = this.divPanel() ;
      details.attr("nodeid", node.id).attr("sparqlid", node.SPARQLid).addClass('div-details');

      /* Label Entity as ID attribute */
      let lab = $("<label></label>").attr("for",elemId).html(node.label);
      let inp = this.buildString(node,node.label,node.SPARQLid);

      node.switchRegexpMode(node.id);

      details.append(lab)
             .append(makeRemoveIcon(inp))
             .append(makeRegExpIcon(node.id,node.id))
             .append(inp);

      var attributes = userAbstraction.getAttributesWithURI(node.uri);
      let currentObj = this;

      $.each(attributes, function(i) {
          /* if attribute is loaded before the creation of attribute view, we don t need to create a new */
          let attribute = graphBuilder.getAttributeOrCategoryForNode(attributes[i],node);
          /* creation of new one otherwise */
          if ( ! attribute ) {
            attribute = graphBuilder.buildAttributeOrCategoryForNode(attributes[i],node);
          }
          var lab = $("<label></label>").attr("for",attribute.label).text(attribute.label);
          let inp ;

          if (attribute.type.indexOf("http://www.w3.org/2001/XMLSchema#") < 0) {
            inp = currentObj.buildCategory(node,attribute,inp);
          } else if (attribute.type.indexOf("decimal") >= 0) {
            inp = currentObj.buildDecimal(node,attribute);
            /* RemoveIcon, EyeIcon, Attribute IHM */
            details.append(lab)
                   .append(makeRemoveIcon(inp))
                   .append(makeEyeIcon(node,attribute))
                   .append(inp);
          } else {
            inp = currentObj.buildString(node,attribute.SPARQLid,attribute.id);
            node.switchRegexpMode(attribute.id);
            /* RemoveIcon, EyeIcon, Attribute IHM */
            details.append(lab)
                   .append(makeRemoveIcon(inp))
                   .append(makeEyeIcon(node,attribute))
                   .append(makeRegExpIcon(node.id,attribute.id))
                   .append(inp);
          }


          //$('#waitModal').modal('hide');
      });
      $("#viewDetails").append(details);
  }
}
