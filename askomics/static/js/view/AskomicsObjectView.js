/*jshint esversion: 6 */

const AskomicsObjectView_prefix = "rightview_";
/* General class to manage Askomics Panel View*/
class AskomicsObjectView {

  constructor(objet) {
    this.objet = objet ;
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
    let details = $("<div></div>").attr("id",AskomicsObjectView_prefix+this.objet.id);
    return details;
  }

  static hideAll () {
    AskomicsObjectView.cleanTitleObjectView();
    $("div[id*='"+ AskomicsObjectView_prefix +"']" ).hide();
  }
  static defineClickMenu() {
    // Switch between close and open eye icon for unselected
    $("#showNode").click(function() {
        var id = $("#objectName").attr("objid");
        if (graphBuilder.nodes().length <= 1) {
          let help_title = "Information";
          let help_str   = "Askomics can not disable a single node.";
          displayModal(help_title, help_str, 'ok');
          return;
        }
        let countActif = 0;
        for(let i=0;i<graphBuilder.nodes().length;i++) {
          if ( graphBuilder.nodes()[i].actif) countActif++ ;
        }
        if (countActif <= 1) {
          let help_title = "Information";
          let help_str   = "Askomics can not disable all nodes.";
          displayModal(help_title, help_str, 'ok');
          return;
        }

        var node = graphBuilder.getInstanciedNode(id);
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
          console.debug("remove node");
          let node = graphBuilder.getInstanciedNode(id);

          if ( node ) {

            if (node.id == graphBuilder.nodes()[0].id) {
              let help_title = "Information";
              let help_str   = "Askomics can not delete the start node. Use the reset button to begin a new query!";
              displayModal(help_title, help_str, 'ok');
              return;
            }

            let listLinksRemoved = graphBuilder.removeInstanciedNode(node);
            forceLayoutManager.removeSuggestions();
            forceLayoutManager.update();
            node.getPanelView().remove();
            for (let l of listLinksRemoved) {
              l.getPanelView().remove();
            }
          }
      } else if ( type == "link") {
        console.debug("remove link");
        let link =graphBuilder.getInstanciedLink(id);
        let removenode = graphBuilder.removeInstanciedLink(link);
        forceLayoutManager.removeSuggestions();
        forceLayoutManager.update();
        link.getPanelView().remove();
        if ( removenode ) {
          removenode.getPanelView().remove();
        }
      } else {
        throw "Unknown type of this Graph Object:"+type;
      }
    });

    $('#help').click(function() {
      var id = $("#objectName").attr("objid");
      let elem = graphBuilder.getInstanciedNode(id);
      if (! elem)
        elem = graphBuilder.getInstanciedLink(id);
      if (elem)
        elem.getPanelView().display_help();
    });
  }

}
