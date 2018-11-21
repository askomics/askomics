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
    __ihm.getSVGLayout().update();
  }

/* ===============================================================================================*/
  buildCategory(attribute,listGraphsWithAtt,contextDependancy=false) {
    let labelSparqlVarId = attribute.SPARQLid;
    let URISparqlVarId   = "URICat"+labelSparqlVarId;
    let inp = $("<select/>").addClass("form-control").attr("multiple","multiple");

    __ihm.displayModal('Please wait', '', 'Close');
    let tab = [];

    let listForceFrom = listGraphsWithAtt;
    if (contextDependancy) {
      tab = this.node.buildConstraintsGraphForCategory(attribute.id,true);
//      let tab2 = __ihm.getGraphBuilder().buildConstraintsGraph();
//      tab[1][0] = [].concat.apply([], [tab[1][0], tab2[1][0]]);
      listForceFrom = []; /* unactive if query concern a user query */
    } else {
      tab = this.node.buildConstraintsGraphForCategory(attribute.id,false);
    }
    console.log(attribute.uri);
    let endpAndGraphs = __ihm.getGraphBuilder().getEndpointAndGraphCategory(this.node.uri) ;

    inp.attr("list", "opt_" + labelSparqlVarId)
       .attr("sparqlid",URISparqlVarId);
    //console.log(JSON.stringify(nameDiv));
    var service = new RestServiceJs("sparqlquery");
    var model = {
      'endpoints'            : endpAndGraphs[0],
      'type_endpoints'       : endpAndGraphs[1],
      'graphs'               : endpAndGraphs[2],
      'variates'             : tab[0],
      'constraintesRelations': tab[1],
      'limit'                :-1,
      'nofile'               : true,
      'removeGraph'          : __ihm.getAbstraction().listUnactivedGraph(),
      'export':false,
    };

    /* For a basic query to search category value, we ask only on graph which contain the category */
    if(listForceFrom.length >0) {
      model.from = listForceFrom;
    }

    let mythis = this;
  //  console.log(attribute.uri);
    service.post(model, function(d) {
        let selectedValue = [];
        if (URISparqlVarId in mythis.node.values) {
          selectedValue = mythis.node.values[URISparqlVarId];
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
            let isSelected;
            for (isSelected=0;isSelected<selectedValue.length;isSelected++) {
              if ( v[URISparqlVarId] == selectedValue[isSelected] ) break ;
            }
            if (isSelected<selectedValue.length) {
              inp.append($("<option></option>").attr("value", v[URISparqlVarId]).attr("selected", "selected").text(v[labelSparqlVarId]));
            } else {
              inp.append($("<option></option>").attr("value", v[URISparqlVarId]).text(v[labelSparqlVarId]));
            }
          }
        } else if (d.values.length == 1) {
          inp.append($("<option></option>").attr("value", d.values[0][URISparqlVarId]).text(d.values[0][labelSparqlVarId]));
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
        listValue+="?"+sparqlid+" = <"+value[i]+"> ||";
      }
      if ( listValue.length>=2) {
        listValue = listValue.substring(0, listValue.length-2);
      }

      mythis.node.setFilterAttributes(sparqlid,value,'FILTER ('+listValue +')');

	  /*
      var listValue = "";
      for (let i=0;i<value.length;i++) {
        listValue+="<"+value[i]+"> ";
      }
      mythis.node.setFilterAttributes(sparqlid,value,'VALUES ?'+sparqlid+' { '+listValue +'}');
      */
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
    tr.append($("<td></td>").attr('class', 'field').append(v));

    inp.append(tr);

    inp.change(function(d) {
      let op = $(this).find("option:selected").text();
      let value = $(this).find('input').val();
      let sparlid = $(this).find('select').attr('sparqlid');
      if (! $.isNumeric(value) ) {
          $(this).find('td.field').addClass('has-error');
          mythis.node.setFilterAttributes(sparlid,'','');
          mythis.node.setFilterAttributes("op_"+sparlid,'','');
          if ( op != '=' && op != '<' && op != '<=' && op != '>' && op != '>=' && op != '!=') {
            $(this).find('option[value="="]').prop('selected', true);
          }
          if (value == "") {
            $(this).find('td.field').removeClass('has-error');
          }
          return;
      } else {
        $(this).find('td.field').removeClass('has-error');
        mythis.node.setFilterAttributes(sparlid,value,'FILTER ( ?'+sparlid+' '+op+' '+value+' )');
        mythis.node.setFilterAttributes("op_"+sparlid,op,'');
      }
      mythis.updateNodeView();
    });
    return inp ;
  }


  buildDate(idDate, attribute) {
    let mythis = this;

    let labelSparqlVarId = attribute.SPARQLid;

    let inputValue       = "";
    let selectedOpValue  = "";

    let inp = $("<table></table>").addClass("table").attr("id","date_"+attribute.SPARQLid+"_"+idDate);
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
    v = $('<input></input>').attr("type","text").addClass("form-control").attr("id", attribute.id);
    v.val(inputValue);

    tr.append($("<td></td>").attr('class', 'field').append(v));

    inp.append(tr);

    inp.change(function(d) {
      let op = $(this).find("option:selected").text();
      let value = $(this).find('input').val();
      let sparlid = $(this).find('select').attr('sparqlid');
      let date_regex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/;
      if (! date_regex.test(value)) {
        $(this).find('td.field').addClass('has-error');
          mythis.node.setFilterAttributes(sparlid,'','');
          mythis.node.setFilterAttributes("op_"+sparlid,'','');
          if ( op != '=' && op != '<' && op != '<=' && op != '>' && op != '>=' && op != '!=') {
            $(this).find('option[value="="]').prop('selected', true);
          }
          if (value === "") {
            $(this).find('td.field').removeClass('has-error');
          }
          return;
      } else {
        $(this).find('td.field').removeClass('has-error');
        mythis.node.setFilterAttributes(sparlid,value,'FILTER ( ?'+sparlid+' '+op+' "'+value+'"^^xsd:dateTime )');
        mythis.node.setFilterAttributes("op_"+sparlid,op,'');
      }
      // console.log(value);

      mythis.updateNodeView();
    });
    return inp ;
  }

  changeFilter(sparqlid,value) {
    if ( ! this.node.isRegexpMode(sparqlid) ) {
      this.node.setFilterAttributes(sparqlid,value,'FILTER ( str(?'+sparqlid+') = "'+value+'" )');
    } else {
      //this.node.setFilterAttributes(sparqlid,value,'FILTER ( regex(str(?'+sparqlid+'), "'+value+'", "i" ))');
      this.node.setFilterAttributes(sparqlid,value,'FILTER ( contains(str(?'+sparqlid+'), "'+value+'"))');
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
          let attributes = __ihm.getAbstraction().getAttributesWithURI(n.uri)[0];
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

      let lv = $(currentIcon).parent().find('input');

      if ( lv.length>0 && lv.is(":visible")) if (typeof(lv.val()) == "string" ) return  (lv.val() !== "") ;

      /* category case */
      lv = $(currentIcon).parent().find('select:not([linkvar])');

      if ( lv.find(":selected").length > 0 && lv.is(":visible") ) return true;

      /* link var case */
      lv = $(currentIcon).parent().find('select[linkvar]');
      if ( lv.find(":selected").index() > 0 && lv.is(":visible") ) return true;

      return false;
    }

    // dedicated to String entry
    makeRegExpIcon(SPARQLid) {
      var icon = $('<span></span>')
              .attr('sparqlid', SPARQLid)
              .attr('aria-hidden','true')
              .addClass('makeRegExpIcon')
              .addClass('fa')
              .addClass('fa-font')
              .addClass('display')
              .attr('data-toggle', 'tooltip')
              .attr('data-placement', 'bottom')
              .attr('title', 'Regexp filter');

      let mythis = this;

      icon.click(function(d) {
          if (icon.hasClass('fa-font')) {
                icon.removeClass('fa-font');
                icon.addClass('fa-filter');
                icon.attr('title', 'Exact filter');
          } else {
                icon.removeClass('fa-filter');
                icon.addClass('fa-font');
                icon.attr('title', 'Regexp filter');
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
          .addClass('display')
          .attr('data-toggle', 'tooltip')
          .attr('data-placement', 'bottom')
          .attr('title', 'Reset filter');
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

    makeEyeIcon(object) {
      // =============================================================================================
      //    Manage Attribute variate when eye is selected or deselected
      //
      let mythis = this;
      let eyeLabel = mythis.node.isActif(object.SPARQLid)?'fa-eye':'fa-eye-slash';
      let tooltip_txt = mythis.node.isActif(object.SPARQLid)?'Show this attribut, even if it is empty':'Show this attribut';
      let icon = $('<span></span>')
              .attr('sparqlid', object.SPARQLid)
              .attr('aria-hidden','true')
              .addClass('fa')
              .addClass('makeEyeIcon')
              .addClass(eyeLabel)
              .addClass('display')
              .attr('data-toggle', 'tooltip')
              .attr('data-placement', 'bottom')
              .attr('title', tooltip_txt);

      // eye-close --> optional search --> exact search
      icon.click(function(d) {
        let sparqlid = $(this).attr('sparqlid');
        let hasSelection = mythis.haveSelectionUserValue(this);

        // See value of a input selection
        if (icon.hasClass('fa-eye-slash') ) {
          icon.removeClass('fa-eye-slash');
          icon.addClass('fa-eye');
          icon.attr('title', 'Show this attribut, even if it is empty');
          mythis.node.setActiveAttribute(sparqlid,true,false);
        //
        } else if (icon.hasClass('fa-eye') && hasSelection) {
          icon.removeClass('fa-eye');
          icon.addClass('fa-eye-slash');
          icon.attr('title', 'Show this attribut' );
          mythis.node.setActiveAttribute(sparqlid,false,false);
        }
        // No filter are defined
        else if ( icon.hasClass('fa-eye') ) {
          icon.removeClass('fa-eye');
          icon.addClass('fa-question-circle');
          icon.attr('title', 'Hide this attribut');

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
            icon.attr('title', 'Show this attribut');

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
              .addClass('display')
              .attr('data-toggle', 'tooltip')
              .attr('data-placement', 'bottom')
              .attr('title', 'Negative match');

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
              icon.addClass('fa-minus');
              icon.attr('title', 'Match');
              mythis.node.inverseMatch[sparqlid] = 'inverseWithNoRelation';
          } /*
          else if ( icon.hasClass('fa-minus') ) {
                icon.removeClass('fa-minus');
                icon.addClass('fa-minus');
                mythis.node.inverseMatch[sparqlid] = 'inverseWithNoRelation';
          } */ else {
              icon.removeClass('fa-minus');
              icon.addClass('fa-plus');
              icon.attr('title', 'Negative match');
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
              .addClass('display')
              .attr('data-toggle', 'tooltip')
              .attr('data-placement', 'bottom')
              .attr('title', 'Link to another node');

      let mythis = this;

      icon.click(function(d) {
          if (icon.hasClass('fa-chain-broken')) {
            icon.removeClass('fa-chain-broken');
            icon.addClass('fa-link');
            icon.attr('title', 'Filter the attributes');
            $(this).parent().find('input[linkvar!="true"]').hide();
            $(this).parent().find('select[linkvar!="true"]').hide();
            $(this).parent().find('select[linkvar="true"]').show();
          } else {
            let sparqlid  = $(this).attr('sparqlid');
            icon.removeClass('fa-link');
            icon.addClass('fa-chain-broken');
            icon.attr('title', 'Link to another node');
            $(this).parent().find('input[linkvar!="true"]').show();
            $(this).parent().find('select[linkvar!="true"]').show();
            $(this).parent().find('select[linkvar="true"]').hide();
            /* unselect element */
            $(this).parent().find('select[linkvar="true"]').val(
              $(this).parent().find('select[linkvar="true"] option:first').val()
            );

            mythis.node.removeFilterLinkVariable(sparqlid);
            mythis.updateNodeView();
          }
      });
      return icon;
    }

 clean_icon(div_attribute,classIcon,defaultIcon) {
   if ( div_attribute.find("."+classIcon).length <= 0 ) return ;

   if ( ! div_attribute.find("."+classIcon).hasClass(defaultIcon) ) {
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

 makeRefreshCategoryIcon(att,listGraphsWithAtt) {
   var icon = $('<span></span>')
           .addClass('fa')
           .addClass('fa-refresh')
           .addClass('display')
           .attr('data-toggle', 'tooltip')
           .attr('data-placement', 'bottom')
           .attr('title', 'Refresh categories');

   let mythis = this;

   icon.click(function(d) {
      $(this).parent().find('select[linkvar!="true"]').remove();
      $(this).parent().append(mythis.buildCategory(att,listGraphsWithAtt,true));
   });
   return icon;
 }


/* ===============================================================================================*/
  create() {
    let mythis = this;
    let node = this.node;

     let elemUri = node.uri,
          //elemId  = node.SPARQLid,
          nameDiv = this.prefix+node.SPARQLid ;

      this.divPanelUlSortable() ;

      /* Label Entity as ID attribute */
      //let lab = $("<label></label>").attr("for",elemId).html(node.label);
      let lab = $("<label></label>").attr("urinode",node.uri).attr("uri",node.uri).attr("for",node.label).html("URI");
      node.switchRegexpMode(node.SPARQLid);

      mythis.addPanel(0, $('<div></div>')
             .attr("id",node.id)
             .attr("sparqlid",node.SPARQLid)
             .attr("uri",node.uri)
             .attr("basic_type","string")
             .append(lab)
             .append(mythis.makeRemoveIcon())
             .append(mythis.makeEyeIcon(node))
             .append(mythis.makeRegExpIcon(node.SPARQLid))
          //   .append(mythis.makeNegativeMatchIcon(node.SPARQLid))
             .append(mythis.makeLinkVariableIcon(node.SPARQLid))
             .append(mythis.buildString(node.SPARQLid))
             .append(mythis.buildLinkVariable(node)));

      let res = __ihm.getAbstraction().getAttributesWithURI(node.uri);
      let attributes = res[0];
      let graphsWhereAreDefinedAttr = res[1];
      $.each(attributes, function(i) {
          let attribute = node.getAttributeOrCategoryForNode(attributes[i]);
          let listGraphsWithAtt = graphsWhereAreDefinedAttr[attribute.uri];
          var lab = $("<label></label>").attr("uri",attribute.uri).attr("for",attribute.label).text(attribute.label);

          if ( attribute.basic_type == "category" ) {
            let order = attribute.order;
            /* RemoveIcon, EyeIcon, Attribute IHM */
            mythis.addPanel(order, $('<div></div>')
                   .attr("id",attribute.id)
                   .attr("sparqlid",attribute.SPARQLid)
                   .attr("uri",attribute.uri)
                   .attr("basic_type",attribute.basic_type)
                   .append(lab)
                   .append(mythis.makeRemoveIcon())
                   .append(mythis.makeEyeIcon(attribute))
                   .append(mythis.makeNegativeMatchIcon('URICat'+attribute.SPARQLid))
                   .append(mythis.makeLinkVariableIcon('URICat'+attribute.SPARQLid))
                   .append(mythis.makeRefreshCategoryIcon(attribute,listGraphsWithAtt))
                   .append(mythis.buildCategory(attribute,listGraphsWithAtt))
                   .append(mythis.buildLinkVariable(attribute)));
          } else if ( attribute.basic_type == "decimal" ) {
            let order = attribute.order;
            /* RemoveIcon, EyeIcon, Attribute IHM */
            mythis.addPanel(order, $('<div></div>').append(lab)
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
            let order = attribute.order;
            node.switchRegexpMode(attribute.SPARQLid);
            /* RemoveIcon, EyeIcon, Attribute IHM */
            mythis.addPanel(order, $('<div></div>').append(lab)
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
          } else if (attribute.basic_type == "date") {
            // dateTime here
            console.log('datetime');
            let order = attribute.order;
            mythis.addPanel(order, $('<div></div>').append(lab)
                   .attr("id", attribute.id)
                   .attr("sparqlid", attribute.SPARQLid)
                   .attr("uri", attribute.uri)
                   .attr("basic_type", attribute.basic_type)
                   .append(mythis.makeRemoveIcon())
                   .append(mythis.makeEyeIcon(attribute))
                   .append(mythis.makeNegativeMatchIcon(attribute.SPARQLid))
                   .append(mythis.makeLinkVariableIcon(attribute.SPARQLid))
                   .append(mythis.buildDate(1,attribute))
                   .append(mythis.buildLinkVariable(attribute))
            );

          } else {
            throw typeof this + "::create . Unknown type attribute:"+ attribute.basic_type;
          }
          //$('#waitModal').modal('hide');
      });

      // Sort the list
      let list = this.details.find("#sortableAttribute");
      let items = list.children("li").get();

      items.sort(function(a, b) {
          return ($(b).attr('order')) < ($(a).attr('order')) ? 1 : -1;
      });

      $.each(items, function(idx, itm) {list.append(itm);});

      //TODO: set a method in super class
      $("#viewDetails").append(this.details);
  }
}
