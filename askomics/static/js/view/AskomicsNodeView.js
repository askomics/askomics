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

      var listValue = "";
      for (let i=0;i<value.length;i++) {
        listValue+="<"+value[i]+"> ";
      }
      let node = graphBuilder.getInstanciedNode(nodeid);
      node.setFilterAttributes(sparqlid,value,'VALUES ?'+sparqlid+' { '+listValue +'}');
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
      let node = graphBuilder.getInstanciedNode(nodeid);
      node.setFilterAttributes(sparlid,value,'FILTER ( ?'+sparlid+' '+op+' '+value+')');
      node.setFilterAttributes("op_"+sparlid,op,'');
    });
    return inp ;
  }

  changeFilter(node,sparqlid,value) {
    if ( ! node.isRegexpMode(sparqlid) ) {
      node.setFilterAttributes(sparqlid,value,'FILTER ( ?'+sparqlid+' = "'+value+'" )');
    } else {
      node.setFilterAttributes(sparqlid,value,'FILTER ( regex(str(?'+sparqlid+'), "'+value+'", "i" ))');
    }
  }

  /* ===============================================================================================*/
  buildString(node,labelSparqlVarId) {
    let inputValue       = "";

    if (labelSparqlVarId in node.values) {
      inputValue = node.values[labelSparqlVarId];
    }

    let inp = $("<input/>")
            .attr("nodeid",node.id)
            .attr("sparqlid",labelSparqlVarId)
            .attr("type", "text")
            .val(inputValue)
            .addClass("form-control");
    let obj = this;

    inp.change(function(d) {
      let value = $(this).val();
      let sparqlid = $(this).attr('sparqlid');
      let nodeid = $(this).attr('nodeid');

      let node = graphBuilder.getInstanciedNode(nodeid);
      obj.changeFilter(node,sparqlid,value);
    });
      return inp ;
    }

    // dedicated to String entry
    makeOptionalIcon(nodeid,sparqlid) {
      var icon = $('<span></span>')
              .attr('sparqlid', sparqlid)
              .attr('nodeid', nodeid)
              .attr('aria-hidden','true')
              .addClass('glyphicon')
              .addClass('glyphicon-filter')
              .addClass('display');

      let obj = this;

      icon.click(function(d) {
          if (icon.hasClass('glyphicon-filter')) {
                icon.removeClass('glyphicon-filter');
                icon.addClass('glyphicon-font');
          } else {
                icon.removeClass('glyphicon-font');
                icon.addClass('glyphicon-filter');
          }

          var sparqlid  = $(this).attr('sparqlid');
          var nodeid = $(this).attr('nodeid');
          let node = graphBuilder.getInstanciedNode(nodeid);
          node.switchRegexpMode(sparqlid);
          if (sparqlid in node.values) {
            obj.changeFilter(node,sparqlid,node.values[sparqlid]);
          }
      });
      return icon;
    }

    // dedicated to String entry
    makeRegExpIcon(nodeid,sparqlid) {
      var icon = $('<span></span>')
              .attr('sparqlid', sparqlid)
              .attr('nodeid', nodeid)
              .attr('aria-hidden','true')
              .addClass('glyphicon')
              .addClass('glyphicon-filter')
              .addClass('display');

      let obj = this;

      icon.click(function(d) {
          if (icon.hasClass('glyphicon-filter')) {
                icon.removeClass('glyphicon-filter');
                icon.addClass('glyphicon-font');
          } else {
                icon.removeClass('glyphicon-font');
                icon.addClass('glyphicon-filter');
          }

          var sparqlid  = $(this).attr('sparqlid');
          var nodeid = $(this).attr('nodeid');
          let node = graphBuilder.getInstanciedNode(nodeid);
          node.switchRegexpMode(sparqlid);
          if (sparqlid in node.values) {
            obj.changeFilter(node,sparqlid,node.values[sparqlid]);
          }
      });
      return icon;
    }
      // Add attributes of the selected node on the right side of AskOmics
    makeRemoveIcon(field) {
          let removeIcon = $('<span class="glyphicon glyphicon-erase display"></span>');
          removeIcon.click(function() { field.val(null).trigger("change"); });
          return removeIcon;
    }

    makeEyeIcon(node,attribute) {
      // =============================================================================================
      //    Manage Attribute variate when eye is selected or deselected
      //
      let eyeLabel = attribute.actif?'glyphicon-eye-open':'glyphicon-eye-close';
      let icon = $('<span></span>')
              .attr('sparqlid', attribute.SPARQLid)
              .attr('nodeid', node.id)
              .attr('aria-hidden','true')
              .addClass('glyphicon')
              .addClass(eyeLabel)
              .addClass('display');
      // eye-close --> optional search --> exact search
      icon.click(function(d) {
        let sparqlid = $(this).attr('sparqlid');
        let nodeid = $(this).attr('nodeid');
        let node = graphBuilder.getInstanciedNode(nodeid);

        if (icon.hasClass('glyphicon-eye-close')) {
            icon.removeClass('glyphicon-eye-close');
            icon.addClass('glyphicon-search');
            node.setActiveAttribute(sparqlid,true,true);
          } else if (icon.hasClass('glyphicon-search')) {
            icon.removeClass('glyphicon-search');
            icon.addClass('glyphicon-eye-open');
            node.setActiveAttribute(sparqlid,true,false);
          } else {
            icon.removeClass('glyphicon-eye-open');
            icon.addClass('glyphicon-eye-close');
            node.setActiveAttribute(sparqlid,false,false);
          }
      });
      return icon;
    }

/* ===============================================================================================*/
  create() {
    var mythis = this;
    var node = this.node;

     var elemUri = node.uri,
          elemId  = node.SPARQLid,
          nameDiv = this.prefix+node.SPARQLid ;

      var details = this.divPanel() ;
      details.attr("nodeid", node.id).attr("sparqlid", node.SPARQLid).addClass('div-details');

      /* Label Entity as ID attribute */
      let lab = $("<label></label>").attr("for",elemId).html(node.label);
      let inp = this.buildString(node,node.SPARQLid);

      node.switchRegexpMode(node.SPARQLid);

      details.append(lab)
             .append(mythis.makeRemoveIcon(inp))
             .append(mythis.makeRegExpIcon(node.id,node.SPARQLid))
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
            /* RemoveIcon, EyeIcon, Attribute IHM */
            details.append(lab)
                   .append(mythis.makeRemoveIcon(inp))
                   .append(mythis.makeEyeIcon(node,attribute))
                   .append(inp);
          } else if (attribute.type.indexOf("decimal") >= 0) {
            inp = currentObj.buildDecimal(node,attribute);
            /* RemoveIcon, EyeIcon, Attribute IHM */
            details.append(lab)
                   .append(mythis.makeRemoveIcon(inp))
                   .append(mythis.makeEyeIcon(node,attribute))
                   .append(inp);
          } else {
            inp = currentObj.buildString(node,attribute.SPARQLid);
            node.switchRegexpMode(attribute.SPARQLid);
            /* RemoveIcon, EyeIcon, Attribute IHM */
            details.append(lab)
                   .append(mythis.makeRemoveIcon(inp))
                   .append(mythis.makeEyeIcon(node,attribute))
                   .append(mythis.makeRegExpIcon(node.id,attribute.SPARQLid))
                   .append(inp);
          }


          //$('#waitModal').modal('hide');
      });
      $("#viewDetails").append(details);
  }
}
