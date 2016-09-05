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
       .attr("nodeid",node.id)
       .attr("sparqlid",URISparqlVarId);
    //console.log(JSON.stringify(nameDiv));
    var service = new RestServiceJs("sparqlquery");
    var model = {
      'variates': tab[0],
      'constraintesRelations': tab[1],
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
      let nodeid = $(this).attr('nodeid');
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

    let inputValue       = "";
    let selectedOpValue  = "";

    let inp = $("<table></table>");
    if ('op_'+labelSparqlVarId in node.values) {
      selectedOpValue = node.values['op_'+labelSparqlVarId];
    }
    if (labelSparqlVarId in node.values) {
      inputValue = node.values[labelSparqlVarId];
    }

    let v = $("<select></select>")
                  .addClass("form-control")
                  .attr("nodeid",node.id)
                  .attr("sparqlid",labelSparqlVarId);
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

    v = $('<input type="text" class="form-control"/>').attr("id",attribute.id);
    inp.val = v.val.bind(inputValue);

    tr.append($("<td></td>").append(v));
    inp.append(tr);

    inp.change(function(d) {
      var op = $(this).find("option:selected").text();
      var value = $(this).find('input').val();
      let nodeid = $(this).find('select').attr('nodeid');
      let sparlid = $(this).find('select').attr('sparqlid');
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

/*
  Build select list to link with an other variable in the graph
*/
    buildLinkVariable(node,curAtt) {
      let inp = $("<select/>")
              .attr("linkvar","true")
              .attr("nodeid",node.id)
              .attr("sparqlid",curAtt.SPARQLid)
              .attr("type", "list")
              .addClass("form-control")
              .hide();

      /* Default */
      inp.append($('<option></option>').prop('disabled', true).prop('selected', true).html("Link with an attribute node..."));

      /* rebuild list when this option is selected */
      inp.focus(function(d) {
        let nodeid = $(this).attr('nodeid');
        let node = graphBuilder.getInstanciedNode(nodeid);

        /* Remove all child */
        $(this).empty();
        /* Default */
        $(this).append($('<option></option>').prop('disabled', true).prop('selected', true).html("Link with an attribute node..."));
        /* check if query was upload, if a selected value exist */
        let sparqlIdisSelected = (node.values[curAtt.SPARQLid] !== undefined ) ;
        let sparqlIdSelected = "" ;
        if ( sparqlIdisSelected ) {
          sparqlIdSelected = node.values[curAtt.SPARQLid];
        }
        /* set up the list with possible entities to link */

        for ( let n of graphBuilder.nodes() ) {
          let attributes = userAbstraction.getAttributesWithURI(n.uri);
          let firstPrintForThisNode = true;
          for (let a of attributes ) {
            let att = n.getAttributeOrCategoryForNode(a);
            /* we can not link the attribute with himself */
            if ( att.id == curAtt.id ) continue ;
            /* we can not link attributes with diffente type */
            if ( n.getTypeAttribute(att) != node.getTypeAttribute(curAtt) ) continue;
            if ( firstPrintForThisNode ) {
              inp.append($('<option></option>').prop('disabled', true).html("<b><i> --- "+ n.formatInHtmlLabelEntity()+" --- </i></b>"));
              firstPrintForThisNode = false;
            }

            let option = $('<option></option>')
                        .attr("value",att.label)
                        .attr("type",n.getTypeAttribute(att)).html(att.SPARQLid)
                        .attr("nodeAttLink",n.id);

            if ( sparqlIdSelected == att.SPARQLid ) option.prop('selected', true);
            inp.append(option);
          }
        }

      });

      /* set up when var is clicked */
      inp.change(function(d) {
        let attLink = $(this).find("option:selected").text();
        let type = $(this).find("option:selected").attr("type");
        let nodeAttLink = $(this).find("option:selected").attr("nodeAttLink");
        let nodeid = $(this).attr('nodeid');
        let sparlidCurrentAtt = $(this).attr('sparqlid');
        if ( (nodeAttLink === undefined) || (nodeid === undefined) )
          return ;

        console.log($(this).attr('nodeid'));
        console.log($(this).attr('nodeAttLink'));
        let node = graphBuilder.getInstanciedNode(nodeid);
        let node2 = graphBuilder.getInstanciedNode(nodeAttLink);

        if ( type == "category" ) {
          node.setFilterLinkVariable('URICat'+sparlidCurrentAtt,node2,'URICat'+attLink);
        } else {
          node.setFilterLinkVariable(sparlidCurrentAtt,node2,attLink);
        }
      });

      return inp;
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
    makeRemoveIcon() {
          let removeIcon = $('<span class="glyphicon glyphicon-erase display"></span>');
          removeIcon.click(function() {
            $(this).parent().find('input[linkvar!="true"]').val(null).trigger("change");
            $(this).parent().find('select[linkvar!="true"]').val(null).trigger("change");

            /* remove linkvar if exist and reset value of the select linkvar */
            let icon = $(this).parent().find('.fa-link');
            if ( icon.length > 0 ) {
              icon.click();
              icon.parent().find('select[linkvar="true"]').val(null);
            }
          });
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

    // dedicated to String entry
    makeNegativeMatchIcon(node,sparql) {
      var icon = $('<span></span>')
              .attr('sparqlid', sparql.SPARQLid)
              .attr('nodeid', node.id)
              .attr('aria-hidden','true')
              .addClass('glyphicon')
              .addClass('glyphicon-plus')
              .addClass('display');

      let obj = this;

      icon.click(function(d) {
          let sparqlid  = $(this).attr('sparqlid');
          let nodeid = $(this).attr('nodeid');
          let node = graphBuilder.getInstanciedNode(nodeid);

          if (icon.hasClass('glyphicon-plus')) {
                icon.removeClass('glyphicon-plus');
                icon.addClass('glyphicon-minus');
                node.inverseMatch[sparqlid] = true;
          } else {
                icon.removeClass('glyphicon-minus');
                icon.addClass('glyphicon-plus');
                node.inverseMatch[sparqlid] = false;
          }
      });
      return icon;
    }

    // dedicated to String entry
    makeLinkVariableIcon(node,attribute) {
      var icon = $('<span></span>')
              .attr('sparqlid', attribute.SPARQLid)
              .attr('nodeid', node.id)
              .attr('aria-hidden','true')
              .addClass('fa')
              .addClass('fa-chain-broken')
              .addClass('display');

      let obj = this;

      icon.click(function(d) {
          if (icon.hasClass('fa-chain-broken')) {
            icon.removeClass('fa-chain-broken');
            icon.addClass('fa-link');
            $(this).parent().find('input[linkvar!="true"]').hide();
            $(this).parent().find('select[linkvar!="true"]').hide();
            $(this).parent().find('select[linkvar="true"]').show();
          } else {
            let sparqlid  = $(this).attr('sparqlid');
            let nodeid = $(this).attr('nodeid');
            let node = graphBuilder.getInstanciedNode(nodeid);
            icon.removeClass('fa-link');
            icon.addClass('fa-chain-broken');
            $(this).parent().find('input[linkvar!="true"]').show();
            $(this).parent().find('select[linkvar!="true"]').show();
            $(this).parent().find('select[linkvar="true"]').hide();
            node.removeFilterLinkVariable('URICat'+sparqlid);
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

      node.switchRegexpMode(node.SPARQLid);

      details.append($('<div></div>').append(lab)
             .append(mythis.makeRemoveIcon())
             .append(mythis.makeRegExpIcon(node.id,node.SPARQLid))
             .append(mythis.makeNegativeMatchIcon(node.id,node.SPARQLid))
             .append(this.buildString(node,node.SPARQLid)));

      var attributes = userAbstraction.getAttributesWithURI(node.uri);
      let currentObj = this;

      $.each(attributes, function(i) {
          let attribute = node.getAttributeOrCategoryForNode(attributes[i]);
          var lab = $("<label></label>").attr("for",attribute.label).text(attribute.label);

          if ( attribute.basic_type == "category" ) {
            /* RemoveIcon, EyeIcon, Attribute IHM */
            details.append($('<div></div>').append(lab)
                   .append(mythis.makeRemoveIcon())
                   .append(mythis.makeEyeIcon(node,attribute))
                   .append(mythis.makeNegativeMatchIcon(node,attribute))
                   .append(mythis.makeLinkVariableIcon(node,attribute))
                   .append(currentObj.buildCategory(node,attribute))
                   .append(currentObj.buildLinkVariable(node,attribute)));
          } else if ( attribute.basic_type == "decimal" ) {
            /* RemoveIcon, EyeIcon, Attribute IHM */
            details.append($('<div></div>').append(lab)
                   .append(mythis.makeRemoveIcon())
                   .append(mythis.makeEyeIcon(node,attribute))
                   .append(mythis.makeNegativeMatchIcon(node,attribute))
                   .append(mythis.makeLinkVariableIcon(node,attribute))
                   .append(currentObj.buildDecimal(node,attribute))
                   .append(currentObj.buildLinkVariable(node,attribute)));
          } else if ( attribute.basic_type == "string" ) {

            node.switchRegexpMode(attribute.SPARQLid);
            /* RemoveIcon, EyeIcon, Attribute IHM */
            details.append($('<div></div>').append(lab)
                   .append(mythis.makeRemoveIcon())
                   .append(mythis.makeEyeIcon(node,attribute))
                   .append(mythis.makeRegExpIcon(node.id,attribute.SPARQLid))
                   .append(mythis.makeNegativeMatchIcon(node,attribute))
                   .append(mythis.makeLinkVariableIcon(node,attribute))
                   .append(currentObj.buildString(node,attribute.SPARQLid))
                   .append(currentObj.buildLinkVariable(node,attribute)));
          } else {
            throw typeof this + "::create . Unknown type attribute:"+ attribute.basic_type;
          }
          //$('#waitModal').modal('hide');
      });
      $("#viewDetails").append(details);
  }
}
