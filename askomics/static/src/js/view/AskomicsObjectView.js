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
        this.activeView();
      } else {
        this.unactiveView();
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

  unactiveView() {
    $("#showNode").removeClass('glyphicon-eye-open');
    $("#showNode").addClass('glyphicon-eye-close');
  }

  activeView(){
    $("#showNode").removeClass('glyphicon-eye-close');
    $("#showNode").addClass('glyphicon-eye-open');
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
                    orderAttributes.push({ 'uri' : uri , 'basic_type' : basic_type , 'actif' : false});
                  });
                  let l = $(this).parent().find("[urinode]") ;
                  if ( l.length === 0 ) {
                    throw "Devel Error :: Attribute list have to defined a urinode !!";
                  }
                  __ihm.getAbstraction().setOrderAttributesList(l.first().attr("urinode"),orderAttributes);
                }
              });

    this.details.append(ul);
  }

  addPanel(order, element) {
    order = Number(order);
    let ul = this.details.find("#sortableAttribute");
    if ( ul.length === 0 ) {
      this.details.append(element);
    } else {
      element.addClass("attribute");
      ul.append($("<li></li>")
        .attr("order", order)
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

  static start() {
    let mythis = this;
    // Switch between close and open eye icon for unselected
    $("#showNode").click(function() {
        let id = $("#objectName").attr("objid");

        let node = __ihm.getGraphBuilder().getInstanciedNode(id);
        if ( node ) {
          if ( ! node.sparqlgen ) // do nothing....
            return;
          if ( node.actif ) {
            let countActif = 0;
            for(let i=0;i<__ihm.getGraphBuilder().nodes().length;i++) {
              if ( __ihm.getGraphBuilder().nodes()[i].actif) countActif++ ;
            }
            if (countActif <= 1) {
              let help_title = "Information";
              let help_str   = "Askomics can not disable all nodes.";
              __ihm.displayModal(help_title, help_str, 'ok');
              return;
            }
          }
          node.switchActiveNode();

          if (node.actif) {
            $(this).removeClass('glyphicon-eye-close');
            $(this).addClass('glyphicon-eye-open');
          } else {
            $(this).removeClass('glyphicon-eye-open');
            $(this).addClass('glyphicon-eye-close');
          }
        }
        // link is not managed
    });

    // Node deletion
    $("#deleteNode").click(function() {
        let id = $("#objectName").attr("objid");
        let type = $("#objectName").attr("type");
        if ( type == "node" ) {
          let node = __ihm.getGraphBuilder().getInstanciedNode(id);
          if (node.id == __ihm.getGraphBuilder().nodes()[0].id) {
              let help_title = "Information";
              let help_str   = "Askomics can not delete the start node. Use the reset button to begin a new query!";
              __ihm.displayModal(help_title, help_str, 'ok');
              return;
          }

          let listLinksRemoved = __ihm.getGraphBuilder().removeInstanciedNode(node);
          __ihm.getSVGLayout().removeSuggestions();
          __ihm.getSVGLayout().update();
          node.getPanelView().remove();
          for (let l of listLinksRemoved) {
            l.getPanelView().remove();
            __ihm.getSVGLayout().removeLinkSvgInformation(l);
          }
      } else if ( type == "link") {
        let link = __ihm.getGraphBuilder().getInstanciedLink(id);

        let removenode = __ihm.getGraphBuilder().removeInstanciedLink(link);
        __ihm.getSVGLayout().removeSuggestions();
        __ihm.getSVGLayout().update();
        link.getPanelView().remove();
        __ihm.getSVGLayout().removeLinkSvgInformation(link);
        if ( removenode ) {
          removenode.getPanelView().remove();
        }
      } else {
        throw "Unknown type of this Graph Object:"+type;
      }
    });
  }
}
