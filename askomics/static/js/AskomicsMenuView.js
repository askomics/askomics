/*jshint esversion: 6 */

/*
  Manage Menu View to select and unselect proposition of element/link
*/
class AskomicsMenuView {

  constructor (_forceLayoutManager) {
    this.forceLayoutManager = _forceLayoutManager;
  }

  buildLiView(uri,label,submenu) {

    var icheck = $("<span/>")
        .attr("class","glyphicon glyphicon-check");

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
    $("#buttonViewListNodesAndLinks").unbind();
    $("#viewListNodesAndLinks").empty();
  }

  /* initialize the view. The abstraction have to be done */
  start(node) {
    let menuView = this;

    /* to close the menu when a click event outside */
    $(window).click(function() {
      $("#viewListNodesAndLinks").slideUp();
    });

    $("#buttonViewListNodesAndLinks")
    .on('mousedown', function(event) {
      if ( $("#viewListNodesAndLinks").is(':visible') ) {
        $("#viewListNodesAndLinks").slideUp();
      }
      else {
        $("#viewListNodesAndLinks").slideDown();
      }
    });

    $("#viewListNodesAndLinks")
      .css("display","table-row")
      /* let the menu open when something is clicked inside !! */
      .on('click', function(event) {
        event.stopPropagation();
      });


    // <li><a href="#" class="small" data-value="option1" tabIndex="-1"><input type="checkbox"/>&nbsp;Option 1</a></li>
    let lentities = new AskomicsUserAbstraction().getEntities();

    $.each(lentities, function(i) {
      let node = new GraphObject({'uri' : lentities[i]});
      let nodeuri = node.uri;
      var li = menuView.buildLiView(nodeuri,node.removePrefix(),false);

      li.on('click', function() {
        var span = $(this).find(".glyphicon");
        var cur_uri = $(this).attr("uri");
        if ( span.css("visibility") == "visible" ) {
          span.css("visibility","hidden");
          menuView.forceLayoutManager.offProposedUri("node",cur_uri);
          // disable all predicate associated with this node
          $(this).parent().parent().find("li[nodeuri='"+cur_uri+"']").attr("class","disabled");
        } else {
          span.css("visibility","visible");
          menuView.forceLayoutManager.onProposedUri("node",cur_uri);
          // enable all predicate associated with this node
          $(this).parent().parent().find("li[nodeuri='"+cur_uri+"']").removeAttr("class");
        }
        // remove old suggestion
        menuView.forceLayoutManager.removeSuggestions();
        // insert new suggestion
        menuView.forceLayoutManager.insertSuggestions();
        // regenerate the graph
        menuView.forceLayoutManager.update();
      });
      $("#viewListNodesAndLinks").append(li);
      /* --------------------------- */
      /* Adding filter on relations  */
      /* --------------------------- */

      let tab = new AskomicsUserAbstraction().getRelationsObjectsAndSubjectsWithURI(nodeuri);
      let listRelObj = tab[0];
      
      $.each(listRelObj, function(objecturi) {
        let object = new GraphObject({uri:objecturi});
        $.each(listRelObj[objecturi], function(idxrel) {
          let rel = listRelObj[objecturi][idxrel];
          let linkRel = new GraphObject({uri:rel});
          let li = menuView.buildLiView(rel,linkRel.removePrefix()+"&#8594;"+object.removePrefix(),true);
          li.attr("nodeuri",nodeuri)
            .on('click', function() {
              /* when this li is unavailable, we can do nothing */
              if ( $(this).attr("class") === "disabled" ) return ;

              var span = $(this).find(".glyphicon");
              var cur_uri = $(this).attr("uri");
              if ( span.css("visibility") == "visible" ) {
               span.css("visibility","hidden");
               menuView.forceLayoutManager.offProposedUri("link",cur_uri);
              } else {
               span.css("visibility","visible");
               menuView.forceLayoutManager.onProposedUri("link",cur_uri);
             }
             /* remove old suggestion */
             menuView.forceLayoutManager.removeSuggestions();
             /* insert new suggestion */
             menuView.forceLayoutManager.insertSuggestions();
             /* regenerate the graph */
             menuView.forceLayoutManager.update();
          });
          $("#viewListNodesAndLinks").append(li);
        });
      });
      $("#viewListNodesAndLinks").append($("<li></li>").attr("class","divider"));
      /* next entity */
    });

    let positionableEntities = new AskomicsUserAbstraction().getPositionableEntities();
    if (Object.keys(positionableEntities).length>0) {
      /* positionable object */
      let posuri = "positionable";
      let li = menuView.buildLiView(posuri,posuri,false);
      li.attr("nodeuri",posuri)
        .on('click', function() {
          var span = $(this).find(".glyphicon");
          var cur_uri = $(this).attr("uri");
          if ( span.css("visibility") == "visible" ) {
            span.css("visibility","hidden");
            menuView.forceLayoutManager.offProposedUri("link",cur_uri);
          } else {
            span.css("visibility","visible");
            menuView.forceLayoutManager.onProposedUri("link",cur_uri);
          }
          /* remove old suggestion */
          menuView.forceLayoutManager.removeSuggestions();
          /* insert new suggestion */
          menuView.forceLayoutManager.insertSuggestions();
          /* regenerate the graph */
          menuView.forceLayoutManager.update();
        });
        $("#viewListNodesAndLinks").append(li);
        //$("#viewListNodesAndLinks").append($("<li></li>").attr("class","divider"));
      }

      //hide by default
      $("#viewListNodesAndLinks").hide();
  }
}
