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
    let help_title = 'Node "'+this.node.label+'"';
    let help_str = ' Choose which attributes you want to see on the right panel.';
    help_str += ' Filter this attributes by choosing values';
    $('#help_figure').addClass( "hidden" );
    displayModal(help_title, help_str, 'ok');
  }

/* ===============================================================================================*/

  buildCategory(node,attribute) {
    console.log("Build Cat===========================================");
    let labelSparqlVarId = attribute.SPARQLid;
    let URISparqlVarId   = "URICat"+labelSparqlVarId;
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

    let mythis = this;
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
      let node = new AskomicsGraphBuilder().getInstanciedNode(nodeid);
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

    let mythis = this;

    inp.change(function(d) {
      var op = $(this).find("option:selected").text();
      var value = $(this).find('input').val();
      let nodeid = $(this).find('select').attr('nodeid');
      let sparlid = $(this).find('select').attr('sparqlid');
      let node = new AskomicsGraphBuilder().getInstanciedNode(nodeid);
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
  buildString(node,SPARQLid) {
    let inputValue       = "";

    if (SPARQLid in node.values) {
      inputValue = node.values[SPARQLid];
    }

    let inp = $("<input/>")
            .attr("nodeid",node.id)
            .attr("sparqlid",SPARQLid)
            .attr("type", "text")
            .val(inputValue)
            .addClass("form-control");
    let mythis = this;

    inp.change(function(d) {
      let value = $(this).val();
      let sparqlid = $(this).attr('sparqlid');
      let nodeid = $(this).attr('nodeid');

      let node = new AskomicsGraphBuilder().getInstanciedNode(nodeid);
      mythis.changeFilter(node,sparqlid,value);
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

      let mythis = this ;
      /* rebuild list when this option is selected */
      inp.focus(function(d) {
        let nodeid = $(this).attr('nodeid');
        let node = new AskomicsGraphBuilder().getInstanciedNode(nodeid);

        /* Remove all childs */
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

        for ( let n of new AskomicsGraphBuilder().nodes() ) {
          let attributes = new AskomicsUserAbstraction().getAttributesWithURI(n.uri);
          let firstPrintForThisNode = true;
          /* Manage Link node id  */
          if ( (n.id != curAtt.id) ) {

            inp.append($('<option></option>').prop('disabled', true).html("<b><i> --- "+ n.formatInHtmlLabelEntity()+" --- </i></b>"));
            firstPrintForThisNode = false;
            //ID Label is a string
            if ( ! ('type' in curAtt) || ("string" == node.getTypeAttribute(curAtt)) ) { // if not, it's a NODE ID

                let option = $('<option></option>')
                        .attr("value",n.SPARQLid)
                        .attr("type","string").html(n.label)
                        .attr("nodeAttLink",n.id);
                if ( sparqlIdSelected == n.SPARQLid ) option.prop('selected', true);
                inp.append(option);

            }
          }

          /* Manage Attributes */
          for (let a of attributes ) {
            let att = n.getAttributeOrCategoryForNode(a);
            /* we can not link the attribute with himself */
            if ( att.id == curAtt.id ) continue ;

            if ( 'type' in curAtt) {
              /* we can not link attributes with diffente type */
              if ( n.getTypeAttribute(att) != node.getTypeAttribute(curAtt) ) continue;
            } else { // It's a node ID
                if ( n.getTypeAttribute(att) != "string" ) continue;
            }
            if ( firstPrintForThisNode ) {
              inp.append($('<option></option>').prop('disabled', true).html("<b><i> --- "+ n.formatInHtmlLabelEntity()+" --- </i></b>"));
              firstPrintForThisNode = false;
            }

            let option = $('<option></option>')
                        .attr("value",att.SPARQLid)
                        .attr("type",n.getTypeAttribute(att)).html(att.label)
                        .attr("nodeAttLink",n.id);

            if ( sparqlIdSelected == att.SPARQLid ) option.prop('selected', true);
            inp.append(option);
          }
        }

      });

      /* set up when var is clicked */
      inp.change(function(d) {
        let attLink = $(this).find("option:selected").attr("value");
        let type = $(this).find("option:selected").attr("type");
        let nodeAttLink = $(this).find("option:selected").attr("nodeAttLink");
        let nodeid = $(this).attr('nodeid');
        let sparlidCurrentAtt = $(this).attr('sparqlid');

        if ( (nodeAttLink === undefined) || (nodeid === undefined) )
          return ;

        let node = new AskomicsGraphBuilder().getInstanciedNode(nodeid);
        let node2 = new AskomicsGraphBuilder().getInstanciedNode(nodeAttLink);

        if ( type == "category" ) {
          node.setFilterLinkVariable('URICat'+sparlidCurrentAtt,node2,'URICat'+attLink);
        } else {
          node.setFilterLinkVariable(sparlidCurrentAtt,node2,attLink);
        }
      });

      return inp;
    }

    //Check if a value is in the input / selcet

    haveSelectionUserValue(currentIcon) {
      //filter on node.values does not work (event change is not call if user click just after to fill input box)
      let hasSelection = false ;
      let lv = $(currentIcon).parent().find('input');
      if ( lv.length>0) if (typeof(lv.val()) == "string" ) hasSelection =  (lv.val() !== "") ;
      //console.log($(currentIcon).parent().find('select').length);
      if ( !hasSelection ) {
        lv = $(currentIcon).parent().find('select').find(":selected");
        console.log(lv.text());
        if ( lv.length > 1 ) return true;
        // by default a first value with ="Link with an attribute node..."
        //if ( lv.length > 0 ) hasSelection = true;
      }
      return hasSelection;
    }

    // dedicated to String entry
    makeRegExpIcon(node,SPARQLid) {
      var icon = $('<span></span>')
              .attr('sparqlid', SPARQLid)
              .attr('nodeid', node.id)
              .attr('aria-hidden','true')
              .addClass('makeRegExpIcon')
              .addClass('fa')
              .addClass('fa-filter')
              .addClass('display');

      let mythis = this;

      icon.click(function(d) {
          if (icon.hasClass('fa-filter')) {
                icon.removeClass('fa-filter');
                icon.addClass('fa-font');
          } else {
                icon.removeClass('fa-font');
                icon.addClass('fa-filter');
          }

          var sparqlid  = $(this).attr('sparqlid');
          var nodeid = $(this).attr('nodeid');
          let node = new AskomicsGraphBuilder().getInstanciedNode(nodeid);
          node.switchRegexpMode(sparqlid);
          if (sparqlid in node.values) {
            mythis.changeFilter(node,sparqlid,node.values[sparqlid]);
          }
      });
      return icon;
    }
    // Add attributes of the selected node on the right side of AskOmics
    makeRemoveIcon() {
          let removeIcon = $('<span"></span>')
          .addClass('makeRemoveIcon')
          .addClass('fa')
          .addClass('fa-eraser')
          .addClass('display');
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
      let eyeLabel = attribute.actif?'fa-eye':'fa-eye-slash';
      let icon = $('<span></span>')
              .attr('sparqlid', attribute.SPARQLid)
              .attr('nodeid', node.id)
              .attr('aria-hidden','true')
              .addClass('fa')
              .addClass('makeEyeIcon')
              .addClass(eyeLabel)
              .addClass('display');

      let mythis = this;

      // eye-close --> optional search --> exact search
      icon.click(function(d) {
        let sparqlid = $(this).attr('sparqlid');
        let nodeid = $(this).attr('nodeid');
        let node = new AskomicsGraphBuilder().getInstanciedNode(nodeid);

        let hasSelection = mythis.haveSelectionUserValue(this);
        // See value of a input selection
        if (icon.hasClass('fa-eye-slash') ) {
          icon.removeClass('fa-eye-slash');
          icon.addClass('fa-eye');
          node.setActiveAttribute(sparqlid,true,false);
        //
        } else if (icon.hasClass('fa-eye') && hasSelection) {
          icon.removeClass('fa-eye');
          icon.addClass('fa-eye-slash');
          node.setActiveAttribute(sparqlid,false,false);
        }
        // No filter are defined
        else if ( icon.hasClass('fa-eye') ) {
          icon.removeClass('fa-eye');
          icon.addClass('fa-question-circle');
          mythis.clean_box_attribute($(this).parent().parent());
          //if ( !(sparqlid in node.values) || ( node.values[sparqlid] === "" ) )
          //  displayModal("Warning", "Optional results with a selection disable the current filter !", 'ok');
          //clean the selction
          $(this).parent().find('.fa-eraser').trigger('click');
          node.setActiveAttribute(sparqlid,true,true);
          $(this).parent().find("select").hide();
          $(this).parent().find("input").hide();
          $(this).parent().find(".fa").hide();
          $(this).show();
        } else {
            icon.removeClass('fa-question-circle');
            icon.addClass('fa-eye-slash');

            if ($(this).parent().find('.fa-link').length>0) {
                $(this).parent().find('select[linkvar="true"]').show();
            } else {
                $(this).parent().find('select[linkvar!="true"]').show();
                $(this).parent().find('input[linkvar!="true"]').show();
            }
            $(this).parent().find(".fa").show();
            node.setActiveAttribute(sparqlid,false,false);
          }
      });
      return icon;
    }

    // dedicated to String entry
    makeNegativeMatchIcon(node,SPARQLid) {
      var icon = $('<span></span>')
              .attr('sparqlid', SPARQLid)
              .attr('nodeid', node.id)
              .attr('aria-hidden','true')
              .addClass('makeNegativeMatchIcon')
              .addClass('fa')
              .addClass('fa-plus')
              .addClass('display');

      let mythis = this;

      icon.click(function(d) {
          let sparqlid  = $(this).attr('sparqlid');
          let nodeid = $(this).attr('nodeid');
          let node = new AskomicsGraphBuilder().getInstanciedNode(nodeid);

          let hasSelection = mythis.haveSelectionUserValue(this);

          if (icon.hasClass('fa-plus') && hasSelection ) {
              icon.removeClass('fa-plus');
              icon.addClass('fa-minus');
              node.inverseMatch[sparqlid] = 'inverseWithExistingRelation';
          } else if (icon.hasClass('fa-plus')) {
              icon.removeClass('fa-plus');
              icon.addClass('fa-search-minus');
              node.inverseMatch[sparqlid] = 'inverseWithNoRelation';
          }
            else if ( icon.hasClass('fa-minus') ) {
                icon.removeClass('fa-minus');
                icon.addClass('fa-search-minus');
                node.inverseMatch[sparqlid] = 'inverseWithNoRelation';
          } else {
              icon.removeClass('fa-search-minus');
              icon.addClass('fa-plus');
              node.inverseMatch[sparqlid] = 'no';
            }
      });
      return icon;
    }

    // dedicated to String entry
    makeLinkVariableIcon(node,SPARQLid) {
      var icon = $('<span></span>')
              .attr('sparqlid', SPARQLid)
              .attr('nodeid', node.id)
              .attr('aria-hidden','true')
              .addClass('makeLinkVariableIcon')
              .addClass('fa')
              .addClass('fa-chain-broken')
              .addClass('display');

      let mythis = this;

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
            let node = new AskomicsGraphBuilder().getInstanciedNode(nodeid);
            icon.removeClass('fa-link');
            icon.addClass('fa-chain-broken');
            $(this).parent().find('input[linkvar!="true"]').show();
            $(this).parent().find('select[linkvar!="true"]').show();
            $(this).parent().find('select[linkvar="true"]').hide();
            node.removeFilterLinkVariable(sparqlid);
          }
      });
      return icon;
    }

 clean_icon(div_attribute,classIcon,defaultIcon) {

   while ( ! div_attribute.find("."+classIcon).hasClass(defaultIcon) ) {
     div_attribute.find("."+classIcon).trigger('click');
   }
 }

 clean_box_attribute(div_attribute) {

   let classIcon   = "makeLinkVariableIcon";
   let defaultIcon = "fa-chain-broken";
   this.clean_icon(div_attribute,classIcon,defaultIcon);

   classIcon    = "makeNegativeMatchIcon";
   defaultIcon  = "fa-plus";
   this.clean_icon(div_attribute,classIcon,defaultIcon);

   this.makeRemoveIcon();
 }

/* ===============================================================================================*/
  create() {
    var mythis = this;
    var node = this.node;

     var elemUri = node.uri,
          //elemId  = node.SPARQLid,
          nameDiv = this.prefix+node.SPARQLid ;

      this.divPanelUlSortable() ;

      /* Label Entity as ID attribute */
      //let lab = $("<label></label>").attr("for",elemId).html(node.label);
      let lab = $("<label></label>").attr("urinode",node.uri).attr("uri",node.uri).attr("for",node.label).html(node.label);
      node.switchRegexpMode(node.SPARQLid);

      mythis.addPanel($('<div></div>')
             .attr("id",node.id)
             .attr("uri",node.uri)
             .attr("basic_type","string")
             .append(lab)
             .append(mythis.makeRemoveIcon())
             .append(mythis.makeRegExpIcon(node,node.SPARQLid))
             .append(mythis.makeNegativeMatchIcon(node,node.SPARQLid))
             .append(mythis.makeLinkVariableIcon(node,node.SPARQLid))
             .append(mythis.buildString(node,node.SPARQLid))
             .append(mythis.buildLinkVariable(node,node)));

      var attributes = new AskomicsUserAbstraction().getAttributesWithURI(node.uri);

      $.each(attributes, function(i) {
          let attribute = node.getAttributeOrCategoryForNode(attributes[i]);

          var lab = $("<label></label>").attr("uri",attribute.uri).attr("for",attribute.label).text(attribute.label);

          if ( attribute.basic_type == "category" ) {
            /* RemoveIcon, EyeIcon, Attribute IHM */
            mythis.addPanel($('<div></div>')
                   .attr("id",attribute.id)
                   .attr("uri",attribute.uri)
                   .attr("basic_type",attribute.basic_type)
                   .append(lab)
                   .append(mythis.makeRemoveIcon())
                   .append(mythis.makeEyeIcon(node,attribute))
                   .append(mythis.makeNegativeMatchIcon(node,'URICat'+attribute.SPARQLid))
                   .append(mythis.makeLinkVariableIcon(node,'URICat'+attribute.SPARQLid))
                   .append(mythis.buildCategory(node,attribute))
                   .append(mythis.buildLinkVariable(node,attribute)));
          } else if ( attribute.basic_type == "decimal" ) {
            /* RemoveIcon, EyeIcon, Attribute IHM */
            mythis.addPanel($('<div></div>').append(lab)
                   .attr("id",attribute.id)
                   .attr("uri",attribute.uri)
                   .attr("basic_type",attribute.basic_type)
                   .append(mythis.makeRemoveIcon())
                   .append(mythis.makeEyeIcon(node,attribute))
                   .append(mythis.makeNegativeMatchIcon(node,attribute.SPARQLid))
                   .append(mythis.makeLinkVariableIcon(node,attribute.SPARQLid))
                   .append(mythis.buildDecimal(node,attribute))
                   .append(mythis.buildLinkVariable(node,attribute)));
          } else if ( attribute.basic_type == "string" ) {
            node.switchRegexpMode(attribute.SPARQLid);
            /* RemoveIcon, EyeIcon, Attribute IHM */
            mythis.addPanel($('<div></div>').append(lab)
                   .attr("id",attribute.id)
                   .attr("uri",attribute.uri)
                   .attr("basic_type",attribute.basic_type)
                   .append(mythis.makeRemoveIcon())
                   .append(mythis.makeEyeIcon(node,attribute))
                   .append(mythis.makeRegExpIcon(node,attribute.SPARQLid))
                   .append(mythis.makeNegativeMatchIcon(node,attribute.SPARQLid))
                   .append(mythis.makeLinkVariableIcon(node,attribute.SPARQLid))
                   .append(mythis.buildString(node,attribute.SPARQLid))
                   .append(mythis.buildLinkVariable(node,attribute)));
          } else {
            throw typeof this + "::create . Unknown type attribute:"+ attribute.basic_type;
          }
          //$('#waitModal').modal('hide');
      });
      //TODO: set a method in super class
      $("#viewDetails").append(this.details);
  }
}
