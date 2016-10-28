/*jshint esversion: 6 */

const AskomicsObjectView_prefix = "rightview_";
/* General class to manage Askomics Panel View*/
class AskomicsObjectView {

  constructor(objet) {
    this.objet = objet ;
    this.details = undefined;
  }

  static cleanTitleObjectView() {
    $("#objectName").text("");
    $("#showNode").hide();
    $("#deleteNode").hide();
    $("#objectName").removeAttr("objid");
  }

  showTitleObjectView() {

    $("#objectName").html(this.objet.formatInHtmlLabelEntity());
    $("#objectName").attr("objid",this.objet.id);
    $("#objectName").attr("type",this.objet.getType());
    $("#showNode").show();
    $("#deleteNode").show();

    if ('actif' in this.objet ) {
      if ( this.objet.actif ) {
        $("#showNode").removeClass('glyphicon-eye-close');
        $("#showNode").addClass('glyphicon-eye-open');
      } else {
        $("#showNode").removeClass('glyphicon-eye-open');
        $("#showNode").addClass('glyphicon-eye-close');
      }
    } else {
        $("#showNode").removeClass('glyphicon-eye-close');
        $("#showNode").removeClass('glyphicon-eye-open');
    }
  }

  remove() {
    $("#"+AskomicsObjectView_prefix+this.objet.id).remove();
  }

  static removeAll() {
    $("div[id*='"+ AskomicsObjectView_prefix +"']" ).remove();

    $("#showNode").unbind();
    $("#deleteNode").unbind();
    $('#helpNode').unbind();
  }

  show() {
    AskomicsObjectView.hideAll();
    AskomicsObjectView.cleanTitleObjectView();
    this.showTitleObjectView();
    $("#"+AskomicsObjectView_prefix+this.objet.id).show();
  }

  hide() {
    AskomicsObjectView.cleanTitleObjectView();
    $("#"+AskomicsObjectView_prefix+this.objet.id).hide();
  }

  divPanel () {
    this.details = $("<div></div>")
                 .attr("id",AskomicsObjectView_prefix+this.objet.id)
                 .attr("nodeid", this.objet.id)
                 .attr("sparqlid", this.objet.SPARQLid)
                 .addClass('div-details');
  }

  /* Build a Panel for attribute with attribute movable to change order of the attribute view display */
  divPanelUlSortable () {

    this.divPanel ();

    let ul = $("<ul></ul>")
              .attr("id","sortableAttribute")
              .css("list-style-type","none")
              .sortable({
                placeholder: "ui-state-highlight",
                update: function (event, ui) {
                  let orderAttributes = [];
                  $(this).parent().find(".attribute").each(function(){
                    let uri = $(this).attr("uri");
                    let basic_type = $(this).attr("basic_type");
                    orderAttributes.push({ 'uri' : uri , 'basic_type' : basic_type });
                  });
                  let l = $(this).parent().find("[urinode]") ;
                  if ( l.length === 0 ) {
                    throw "Devel Error :: Attribute list have to defined a urinode !!";
                  }
                  new AskomicsUserAbstraction().setOrderAttributesList(l.first().attr("urinode"),orderAttributes);
                }
              });

    this.details.append(ul);
  }

  addPanel(element) {
    let ul = this.details.find("#sortableAttribute");
    if ( ul.length === 0 ) {
      this.details.append(element);
    } else {
      element.addClass("attribute");
      ul.append($("<li></li>")
        .addClass("ui-state-default")
        .css("margin","5px")
        .css("padding","5px")
        .css("border-radius","10px")
        .append(element)
        );
      this.details.append(ul);
    }
  }

  static hideAll () {
    AskomicsObjectView.cleanTitleObjectView();
    $("div[id*='"+ AskomicsObjectView_prefix +"']" ).hide();
  }

  static defineClickMenu() {
    let mythis = this;
    // Switch between close and open eye icon for unselected
    $("#showNode").click(function() {
        var id = $("#objectName").attr("objid");
        if (new AskomicsGraphBuilder().nodes().length <= 1) {
          let help_title = "Information";
          let help_str   = "Askomics can not disable a single node.";
          displayModal(help_title, help_str, 'ok');
          return;
        }
        let countActif = 0;
        for(let i=0;i<new AskomicsGraphBuilder().nodes().length;i++) {
          if ( new AskomicsGraphBuilder().nodes()[i].actif) countActif++ ;
        }
        if (countActif <= 1) {
          let help_title = "Information";
          let help_str   = "Askomics can not disable all nodes.";
          displayModal(help_title, help_str, 'ok');
          return;
        }

        var node = new AskomicsGraphBuilder().getInstanciedNode(id);
        if ( node ) {
          node.switchActiveNode();

          if (node.actif) {
            $(this).removeClass('glyphicon-eye-close');
            $(this).addClass('glyphicon-eye-open');
          } else {
            $(this).removeClass('glyphicon-eye-open');
            $(this).addClass('glyphicon-eye-close');
          }
        }
        // link is not manage
    });

    // Node deletion
    $("#deleteNode").click(function() {
        let id = $("#objectName").attr("objid");
        let type = $("#objectName").attr("type");
        if ( type == "node" ) {
          let node = new AskomicsGraphBuilder().getInstanciedNode(id);
          if (node.id == new AskomicsGraphBuilder().nodes()[0].id) {
              let help_title = "Information";
              let help_str   = "Askomics can not delete the start node. Use the reset button to begin a new query!";
              displayModal(help_title, help_str, 'ok');
              return;
          }

          let listLinksRemoved = new AskomicsGraphBuilder().removeInstanciedNode(node);
          forceLayoutManager.removeSuggestions();
          forceLayoutManager.update();
          node.getPanelView().remove();
          for (let l of listLinksRemoved) {
            l.getPanelView().remove();
            forceLayoutManager.removeLinkSvgInformation(l);
          }
      } else if ( type == "link") {
        let link = new AskomicsGraphBuilder().getInstanciedLink(id);

        let removenode = new AskomicsGraphBuilder().removeInstanciedLink(link);
        forceLayoutManager.removeSuggestions();
        forceLayoutManager.update();
        link.getPanelView().remove();
        forceLayoutManager.removeLinkSvgInformation(link);
        if ( removenode ) {
          removenode.getPanelView().remove();
        }
      } else {
        throw "Unknown type of this Graph Object:"+type;
      }
    });

    $('#helpNode').click(function() {
      var id = $("#objectName").attr("objid");
      var type = $("#objectName").attr("type");

      let elem ;

      if ( type == "node") {
        elem = new AskomicsGraphBuilder().getInstanciedNode(id);
      } else if ( type == "link") {
        elem = new AskomicsGraphBuilder().getInstanciedLink(id);
      } else {
        throw "AskomisObjectView::help  ==> unkown type:"+type;
      }
      if ( elem !== undefined )
        elem.getPanelView().display_help();
    });
  }
}
