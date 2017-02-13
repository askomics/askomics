/*jshint esversion: 6 */

/*
  Manage The creation, update and deletaion inside the Attributes Graph view
*/

class AskomicsNodeView extends AskomicsObjectView {

  constructor(node) {
    super(node);
    this.node = node;
  }

  define_context_menu() {
    let mythis = this;
    $( '#node_'+this.node.id ).contextmenu(function() {
      let title = '<h4>'+mythis.node.label+'<tspan font-size="5" baseline-shift="sub">'+mythis.node.getLabelIndexHtml()+'</tspan>'+'</h4>';
      let mess = "";
      $("div[id="+AskomicsObjectView_prefix+mythis.node.id+"]").find("div[basic_type][uri]").each(
        function( index ) {
          let sparqlid = $( this ).attr('sparqlid');

          let isFiltered = sparqlid in mythis.node.filters;
          let isInversedMatch = sparqlid in mythis.node.inverseMatch;
          let isFilteredCat = 'URICat'+sparqlid in mythis.node.filters;

          if ( isFiltered || isInversedMatch || isFilteredCat ) {
            mess += '<h5>'+$( this ).find('label').text()+'</h5>';

            if ( sparqlid in mythis.node.filters )
              mess += '<p><pre>'+mythis.node.filters[sparqlid]+'</pre></p>';
            if ( 'URICat'+sparqlid in mythis.node.filters )
              mess += '<p><pre>'+mythis.node.filters['URICat'+sparqlid]+'</pre></p>';
            if ( sparqlid in mythis.node.inverseMatch )
              mess += '<p><it><small>Inverse match</small><it></p>';
          }
      });

      let VarDisplay = mythis.node.getAttributesDisplaying();

      if (VarDisplay.label.length>0) {

        mess += '<h5>Displaying attributes</h5>';
        for (let v=0 ; v < VarDisplay.label.length-1; v++ ) {
          mess += VarDisplay.label[v]+",";
        }
        mess += VarDisplay.label[VarDisplay.label.length-1];
      }


      __ihm.displayModalHtml(title, mess ,'Close');
      return false;
    });
  }

  display_help() {
    let help_title = 'Node "'+this.node.label+'"';
    let help_str = ' Choose which attributes you want to see on the right panel.';
    help_str += ' Filter this attributes by choosing values';
    $('#help_figure').addClass( "hidden" );
    __ihm.displayModal(help_title, help_str, 'ok');
  }

  updateNodeView() {
    $("[constraint_node_id="+this.node.id+"]").text(this.node.getAttributesWithConstraintsString());
  }

/* ===============================================================================================*/

  buildCategory(attribute) {
    let labelSparqlVarId = attribute.SPARQLid;
    let URISparqlVarId   = "URICat"+labelSparqlVarId;
    let inp = $("<select/>").addClass("form-control").attr("multiple","multiple");

    __ihm.displayModal('Please wait', '', 'Close');
    var tab = this.node.buildConstraintsGraphForCategory(attribute.id);

    inp.attr("list", "opt_" + labelSparqlVarId)
       .attr("sparqlid",URISparqlVarId);
    //console.log(JSON.stringify(nameDiv));
    var service = new RestServiceJs("sparqlquery");
    var model = {
      'variates'             : tab[0],
      'constraintesRelations': tab[1],
      'limit'                :-1,
      'nofile'               : true,
      'removeGraph'          : __ihm.getAbstraction().listUnactivedGraph(),
      'export':false,
    };

    let mythis = this;
  //  console.log(attribute.uri);
    service.post(model, function(d) {
        let selectedValue = "";
        if (labelSparqlVarId in mythis.node.values) {
          selectedValue = mythis.node.values[labelSparqlVarId];
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
        __ihm.hideModal();
    });

    inp.change(function(d) {
      var value = $(this).val();
      if (!value) value = '';
      let sparqlid = $(this).attr('sparqlid');

      if ( sparqlid === undefined ) {
        throw new Error("AskomicsNodeView: can not reach sparqlid attribute!");
      }

      var listValue = "";
      for (let i=0;i<value.length;i++) {
        listValue+="<"+value[i]+"> ";
      }
      mythis.node.setFilterAttributes(sparqlid,value,'VALUES ?'+sparqlid+' { '+listValue +'}');
      mythis.updateNodeView();
    });

    return inp;
  }

/* ===============================================================================================*/
  buildDecimal(idDecimal,attribute) {
    let mythis = this;

    let labelSparqlVarId = attribute.SPARQLid;

    let inputValue       = "";
    let selectedOpValue  = "";

    let inp = $("<table></table>").addClass("table").attr("id","decimal_"+attribute.SPARQLid+"_"+idDecimal);
    if ('op_'+labelSparqlVarId in this.node.values) {
      selectedOpValue = this.node.values['op_'+labelSparqlVarId];
    }
    if (labelSparqlVarId in this.node.values) {
      inputValue = this.node.values[labelSparqlVarId];
    }

    let v = $("<select></select>")
                  .addClass("form-control")
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

    /* operator */
    let tr = $("<tr></tr>");
    tr.append($("<td></td>").append(v));

    /* value */
    v = $('<input></input>').attr("type","text").addClass("form-control").attr("id",attribute.id);
    v.val(inputValue);
    tr.append($("<td></td>").append(v));

    /* add condition */
    /*
    let span = $("<span></span>").attr("id",attribute.SPARQLid+"_span_decimal_add_"+idDecimal).addClass("glyphicon glyphicon-plus").attr("value","small");

    span.click(function(d) {
      $("span[id^='"+attribute.SPARQLid+"_span_decimal_add_']").hide();
      $("span[id^='"+attribute.SPARQLid+"_span_decimal_min_']").hide();
      mythis.buildDecimal(idDecimal+1,attribute).insertAfter($("#decimal_"+attribute.SPARQLid+"_"+idDecimal));
    } );
    tr.append($("<td></td>").append(span));
    */
    /* remove condition */
    /*
    if ( idDecimal > 1 ) {
      span = $("<span></span>").attr("id",attribute.SPARQLid+"_span_decimal_min_"+idDecimal).addClass("glyphicon glyphicon-minus").attr("value","small").attr("aria-hidden","true");
      span.click(function(d) {
        $("span[id^='"+attribute.SPARQLid+"_span_decimal_add_"+idDecimal-1+"']").show();
        $("span[id^='"+attribute.SPARQLid+"_span_decimal_min_"+idDecimal-1+"']").show();
        $("#decimal_"+attribute.SPARQLid+"_"+idDecimal).remove();
      } );
      tr.append($("<td></td>").append(span));
    }
    */
    inp.append(tr);

    inp.change(function(d) {
      var op = $(this).find("option:selected").text();
      var value = $(this).find('input').val();


      if (! $.isNumeric(value) ) {
      //    __ihm.displayModal("'"+value + "' is not a numeric value !", '', 'Close');
          value = $(this).find('input').val(null);
          return;
      }

      let sparlid = $(this).find('select').attr('sparqlid');

      mythis.node.setFilterAttributes(sparlid,value,'FILTER ( ?'+sparlid+' '+op+' '+value+')');
      mythis.node.setFilterAttributes("op_"+sparlid,op,'');
      mythis.updateNodeView();
    });
    return inp ;
  }

  changeFilter(sparqlid,value) {
    if ( ! this.node.isRegexpMode(sparqlid) ) {
      this.node.setFilterAttributes(sparqlid,value,'FILTER ( ?'+sparqlid+' = "'+value+'" )');
    } else {
      this.node.setFilterAttributes(sparqlid,value,'FILTER ( regex(str(?'+sparqlid+'), "'+value+'", "i" ))');
    }
  }

  /* ===============================================================================================*/
  buildString(SPARQLid) {
    let inputValue       = "";

    if (SPARQLid in this.node.values) {
      inputValue = this.node.values[SPARQLid];
    }

    let inp = $("<input/>")
            .attr("sparqlid",SPARQLid)
            .attr("type", "text")
            .val(inputValue)
            .addClass("form-control");

    let mythis = this;

    inp.change(function(d) {
      let value = $(this).val();
      let sparqlid = $(this).attr('sparqlid');

      mythis.changeFilter(sparqlid,value);
      mythis.updateNodeView();
    });
      return inp ;
    }

/*
  Build select list to link with an other variable in the graph
*/
    buildLinkVariable(curAtt) {
      let inp = $("<select/>")
              .attr("linkvar","true")
              .attr("sparqlid",curAtt.SPARQLid)
              .attr("type", "list")
              .addClass("form-control")
              .hide();

      /* Default */
      inp.append($('<option></option>').prop('disabled', true).prop('selected', true).html("Link with an attribute node..."));

      let mythis = this ;
      /* rebuild list when this option is selected */
      inp.focus(function(d) {
        /* Remove all childs */
        $(this).empty();
        /* Default */
        $(this).append($('<option></option>').prop('disabled', true).prop('selected', true).html("Link with an attribute node..."));
        /* check if query was upload, if a selected value exist */
        let sparqlIdisSelected = (mythis.node.values[curAtt.SPARQLid] !== undefined ) ;
        let sparqlIdSelected = "" ;
        if ( sparqlIdisSelected ) {
          sparqlIdSelected = mythis.node.values[curAtt.SPARQLid];
        }
        /* set up the list with possible entities to link */

        for ( let n of __ihm.getGraphBuilder().nodes() ) {
          let attributes = __ihm.getAbstraction().getAttributesWithURI(n.uri);
          let firstPrintForThisNode = true;
          /* Manage Link node id  */
          if ( (n.id != curAtt.id) ) {

            inp.append($('<option></option>').prop('disabled', true).html("<b><i> --- "+ n.formatInHtmlLabelEntity()+" --- </i></b>"));
            firstPrintForThisNode = false;
            //ID Label is a string
            if ( ! ('type' in curAtt) || ("string" == curAtt.basic_type) ) { // if not, it's a NODE ID

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
              if ( att.basic_type != curAtt.basic_type ) continue;
            } else { // It's a node ID
                if ( att.basic_type != "string" ) continue;
            }
            if ( firstPrintForThisNode ) {
              inp.append($('<option></option>').prop('disabled', true).html("<b><i> --- "+ n.formatInHtmlLabelEntity()+" --- </i></b>"));
              firstPrintForThisNode = false;
            }

            let option = $('<option></option>')
                        .attr("value",att.SPARQLid)
                        .attr("type",att.basic_type).html(att.label)
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
        let sparlidCurrentAtt = $(this).attr('sparqlid');

        if ( nodeAttLink === undefined )
          return ;

        let node2 = __ihm.getGraphBuilder().getInstanciedNode(nodeAttLink);

        if ( type == "category" ) {
          mythis.node.setFilterLinkVariable('URICat'+sparlidCurrentAtt,node2,'URICat'+attLink);
        } else {
          mythis.node.setFilterLinkVariable(sparlidCurrentAtt,node2,attLink);
        }
        mythis.updateNodeView();
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
        if ( lv.length > 1 ) return true;
        // by default a first value with ="Link with an attribute node..."
        //if ( lv.length > 0 ) hasSelection = true;
      }
      return hasSelection;
    }

    // dedicated to String entry
    makeRegExpIcon(SPARQLid) {
      var icon = $('<span></span>')
              .attr('sparqlid', SPARQLid)
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
          mythis.node.switchRegexpMode(sparqlid);
          if (sparqlid in mythis.node.values) {
            mythis.changeFilter(sparqlid,mythis.node.values[sparqlid]);
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

    makeEyeIcon(attribute) {
      // =============================================================================================
      //    Manage Attribute variate when eye is selected or deselected
      //
      let eyeLabel = attribute.actif?'fa-eye':'fa-eye-slash';
      let icon = $('<span></span>')
              .attr('sparqlid', attribute.SPARQLid)
              .attr('aria-hidden','true')
              .addClass('fa')
              .addClass('makeEyeIcon')
              .addClass(eyeLabel)
              .addClass('display');

      let mythis = this;

      // eye-close --> optional search --> exact search
      icon.click(function(d) {
        let sparqlid = $(this).attr('sparqlid');
        let hasSelection = mythis.haveSelectionUserValue(this);
        // See value of a input selection
        if (icon.hasClass('fa-eye-slash') ) {
          icon.removeClass('fa-eye-slash');
          icon.addClass('fa-eye');
          mythis.node.setActiveAttribute(sparqlid,true,false);
        //
        } else if (icon.hasClass('fa-eye') && hasSelection) {
          icon.removeClass('fa-eye');
          icon.addClass('fa-eye-slash');
          mythis.node.setActiveAttribute(sparqlid,false,false);
        }
        // No filter are defined
        else if ( icon.hasClass('fa-eye') ) {
          icon.removeClass('fa-eye');
          icon.addClass('fa-question-circle');
          mythis.clean_box_attribute($(this).parent().parent());
          //if ( !(sparqlid in node.values) || ( node.values[sparqlid] === "" ) )
          //  __ihm.displayModal("Warning", "Optional results with a selection disable the current filter !", 'ok');
          //clean the selction
          $(this).parent().find('.fa-eraser').trigger('click');
          mythis.node.setActiveAttribute(sparqlid,true,true);
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
            mythis.node.setActiveAttribute(sparqlid,false,false);
          }
        mythis.updateNodeView();
      });
      return icon;
    }

    // dedicated to String entry
    makeNegativeMatchIcon(SPARQLid) {
      var icon = $('<span></span>')
              .attr('sparqlid', SPARQLid)
              .attr('aria-hidden','true')
              .addClass('makeNegativeMatchIcon')
              .addClass('fa')
              .addClass('fa-plus')
              .addClass('display');

      let mythis = this;

      icon.click(function(d) {
          let sparqlid  = $(this).attr('sparqlid');
          let hasSelection = mythis.haveSelectionUserValue(this);

          /*
          Confugisng Functionality...waitin reflexion....
          */
          //if (icon.hasClass('fa-plus') && hasSelection ) {
              //icon.removeClass('fa-plus');
              //icon.addClass('fa-minus');
              //mythis.node.inverseMatch[sparqlid] = 'inverseWithExistingRelation';
          //} else if (icon.hasClass('fa-plus')) {
          if (icon.hasClass('fa-plus')) {
              icon.removeClass('fa-plus');
              icon.addClass('fa-search-minus');
              mythis.node.inverseMatch[sparqlid] = 'inverseWithNoRelation';
          }
          else if ( icon.hasClass('fa-minus') ) {
                icon.removeClass('fa-minus');
                icon.addClass('fa-search-minus');
                mythis.node.inverseMatch[sparqlid] = 'inverseWithNoRelation';
          } else {
              icon.removeClass('fa-search-minus');
              icon.addClass('fa-plus');
              delete mythis.node.inverseMatch[sparqlid] ;
            }
          mythis.updateNodeView();
      });
      return icon;
    }

    // dedicated to String entry
    makeLinkVariableIcon(SPARQLid) {
      var icon = $('<span></span>')
              .attr('sparqlid', SPARQLid)
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
            icon.removeClass('fa-link');
            icon.addClass('fa-chain-broken');
            $(this).parent().find('input[linkvar!="true"]').show();
            $(this).parent().find('select[linkvar!="true"]').show();
            $(this).parent().find('select[linkvar="true"]').hide();
            mythis.node.removeFilterLinkVariable(sparqlid);
            mythis.updateNodeView();
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
             .attr("sparqlid",node.SPARQLid)
             .attr("uri",node.uri)
             .attr("basic_type","string")
             .append(lab)
             .append(mythis.makeRemoveIcon())
             .append(mythis.makeRegExpIcon(node.SPARQLid))
             .append(mythis.makeNegativeMatchIcon(node.SPARQLid))
             .append(mythis.makeLinkVariableIcon(node.SPARQLid))
             .append(mythis.buildString(node.SPARQLid))
             .append(mythis.buildLinkVariable(node)));

      var attributes = __ihm.getAbstraction().getAttributesWithURI(node.uri);

      $.each(attributes, function(i) {
          let attribute = node.getAttributeOrCategoryForNode(attributes[i]);

          var lab = $("<label></label>").attr("uri",attribute.uri).attr("for",attribute.label).text(attribute.label);

          if ( attribute.basic_type == "category" ) {
            /* RemoveIcon, EyeIcon, Attribute IHM */
            mythis.addPanel($('<div></div>')
                   .attr("id",attribute.id)
                   .attr("sparqlid",attribute.SPARQLid)
                   .attr("uri",attribute.uri)
                   .attr("basic_type",attribute.basic_type)
                   .append(lab)
                   .append(mythis.makeRemoveIcon())
                   .append(mythis.makeEyeIcon(attribute))
                   .append(mythis.makeNegativeMatchIcon('URICat'+attribute.SPARQLid))
                   .append(mythis.makeLinkVariableIcon('URICat'+attribute.SPARQLid))
                   .append(mythis.buildCategory(attribute))
                   .append(mythis.buildLinkVariable(attribute)));
          } else if ( attribute.basic_type == "decimal" ) {
            /* RemoveIcon, EyeIcon, Attribute IHM */
            mythis.addPanel($('<div></div>').append(lab)
                   .attr("id",attribute.id)
                   .attr("sparqlid",attribute.SPARQLid)
                   .attr("uri",attribute.uri)
                   .attr("basic_type",attribute.basic_type)
                   .append(mythis.makeRemoveIcon())
                   .append(mythis.makeEyeIcon(attribute))
                   .append(mythis.makeNegativeMatchIcon(attribute.SPARQLid))
                   .append(mythis.makeLinkVariableIcon(attribute.SPARQLid))
                   .append(mythis.buildDecimal(1,attribute))
                   .append(mythis.buildLinkVariable(attribute)));
          } else if ( attribute.basic_type == "string" ) {
            node.switchRegexpMode(attribute.SPARQLid);
            /* RemoveIcon, EyeIcon, Attribute IHM */
            mythis.addPanel($('<div></div>').append(lab)
                   .attr("id",attribute.id)
                   .attr("sparqlid",attribute.SPARQLid)
                   .attr("uri",attribute.uri)
                   .attr("basic_type",attribute.basic_type)
                   .append(mythis.makeRemoveIcon())
                   .append(mythis.makeEyeIcon(attribute))
                   .append(mythis.makeRegExpIcon(attribute.SPARQLid))
                   .append(mythis.makeNegativeMatchIcon(attribute.SPARQLid))
                   .append(mythis.makeLinkVariableIcon(attribute.SPARQLid))
                   .append(mythis.buildString(attribute.SPARQLid))
                   .append(mythis.buildLinkVariable(attribute)));
          } else {
            throw typeof this + "::create . Unknown type attribute:"+ attribute.basic_type;
          }
          //$('#waitModal').modal('hide');
      });
      //TODO: set a method in super class
      $("#viewDetails").append(this.details);
  }
}
