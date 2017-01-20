/*jshint esversion: 6 */

/*
  Manage Menu View to select and unselect proposition of element/link
*/
class AskomicsMenuShortcuts {

  constructor (_forceLayoutManager) {
    this.forceLayoutManager = _forceLayoutManager;
  }

  buildLiView(uri,label,submenu) {

    var icheck = $("<span/>")
        .attr("class","glyphicon glyphicon-check")
        .css("visibility","hidden");

    var a = $("<a></a>")
            .attr("href","#")
            .attr("class","small")
            .attr("data-value","option1")
            .attr("tabIndex","-1") ;
    if (submenu) {
      a.html($("<i></i>").append(label+"\t")).append(icheck);
    } else {
      a.html($("<b></b>").append(label+"\t")).append(icheck);
    }
    var li = $("<li></li>");
    li.attr("uri",uri);
    li.css("display","table-cell");
    li.css("vertical-align","middle");
    li.append(a);
    return li;
  }

  reset() {
    // Remove onclick
    $("#buttonViewListShortcuts").unbind();
    $("#viewListShortcuts").empty();
  }

  /* initialize the view. The abstraction have to be done */
  start(node) {
    let menuShortcuts = this;

    /* to close the menu when a click event outside */
    $(window).click(function() {
      $("#viewListShortcuts").slideUp();
    });

    $("#buttonViewListShortcuts")
    .on('mousedown', function(event) {
      if ( $("#viewListShortcuts").is(':visible') ) {
        $("#viewListShortcuts").slideUp();
      }
      else {
        $("#viewListShortcuts").slideDown();
      }
    });

    $("#viewListShortcuts")
      .css("display","table-row")
      /* let the menu open when something is clicked inside !! */
      .on('click', function(event) {
        event.stopPropagation();
      });

    let lshortcuts = new ShortcutsParametersView().getAllShortcuts();
    
    //console.log(JSON.stringify(lshortcuts));
    $.each(lshortcuts, function(i) {
      console.log(JSON.stringify(lshortcuts[i]));
      var li = menuShortcuts.buildLiView(i,lshortcuts[i].label,false);
      menuShortcuts.forceLayoutManager.offProposedUri("shortcuts",i);

      li.on('click', function() {
        var span = $(this).find(".glyphicon");
        var cur_uri = $(this).attr("uri");
        if ( span.css("visibility") == "visible" ) {
          span.css("visibility","hidden");
          menuShortcuts.forceLayoutManager.offProposedUri("shortcuts",cur_uri);
        } else {
          span.css("visibility","visible");
          menuShortcuts.forceLayoutManager.onProposedUri("shortcuts",cur_uri);
        }
        // remove old suggestion
        menuShortcuts.forceLayoutManager.removeSuggestions();
        // insert new suggestion
        menuShortcuts.forceLayoutManager.insertSuggestions();
        // regenerate the graph
        menuShortcuts.forceLayoutManager.update();
      });
      $("#viewListShortcuts").append(li);
      $("#viewListShortcuts").append($("<li></li>").attr("class","divider"));
      /* next entity */
    });

      //hide by default
      $("#viewListShortcuts").hide();
  }
}
