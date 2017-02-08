/*jshint esversion: 6 */

/*
  Manage Menu View to select and unselect proposition of element/link
*/
class AskomicsMenu {

  constructor (forceLayoutManager,nameMenu,buttonMenu,listObjectMenu,functFillMenu) {
    this.flm = forceLayoutManager;
    this.name = nameMenu;
    this.buttonMenu = buttonMenu;
    this.listObjectMenu = listObjectMenu ;
    this.func = functFillMenu ;
  }

  reset() {
    let menu = this ;
    // Remove onclick
    $("#"+menu.buttonMenu).unbind();
    $("#"+menu.listObjectMenu).empty();
  }

  start() {
    let menu = this ;
    $("#"+menu.buttonMenu)
    .on('mousedown', function(event) {
      if ( $("#"+menu.listObjectMenu).is(':visible') ) {
        $("#"+menu.listObjectMenu).slideUp();
      }
      else {
        $("#menuGraph").find("ul").slideUp();
        $("#"+menu.listObjectMenu).slideDown();
      }
      event.stopPropagation();
    });
    menu.func(menu);
    //hide by default
    $("#"+menu.listObjectMenu).hide();
  }
}

/**************************************************************************/
/**/
/**/
/* Shortcuts Menu */
/**/
/**/
var fileFuncMenu = function(menu) {
  //$("#uploadedQuery")
  $("#dwl-query").on('click', function(d) {
    var date = new Date().getTime();
    $(this).attr("href", "data:application/octet-stream," + encodeURIComponent(new AskomicsGraphBuilder().getInternalState())).attr("download", "query-" + date + ".json");
  });


  $("#dwl-query-sparql").on('click', function(d) {
    var service = new RestServiceJs("getSparqlQueryInTextFormat");
    var jdata = prepareQuery(false,0, false);
    var date = new Date().getTime();
    var current = this;
    var query = "" ;
    service.postsync(jdata,function(data) {
      query = data.query;
    });
    $(this).attr("href", "data:application/sparql-query," + encodeURIComponent(query)).attr("download", "query-" + date + ".rq");
  });
};


/**************************************************************************/
/**/
/**/
/* Shortcuts Menu */
/**/
/**/
var shortcutsFuncMenu = function(menu) {

  var buildLiView = function (uri,label,submenu) {

    var icheck = $("<span/>")
        .attr("class","glyphicon glyphicon-check")
        .css("visibility","hidden");

    var a = $("<a></a>")
            .attr("href","#")
            .attr("class","small")
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
  };


  let lshortcuts = new ShortcutsParametersView().getAllShortcuts();
  /*
  if (lshortcuts.length <= 0) {
    $("#buttonViewListShortcuts").removeClass('active');
    $("#buttonViewListShortcuts").addClass('disabled');

  } else {
    $("#buttonViewListShortcuts").removeClass('disabled');
    $("#buttonViewListShortcuts").addClass('active');
  }
*/
  //console.log(JSON.stringify(lshortcuts));
  $.each(lshortcuts, function(i) {
    var li = buildLiView(i,lshortcuts[i].label,false);
    menu.flm.offProposedUri("shortcuts",i);

    li.on('click', function() {
      var span = $(this).find(".glyphicon");
      var cur_uri = $(this).attr("uri");
      if ( span.css("visibility") == "visible" ) {
        span.css("visibility","hidden");
        menu.flm.offProposedUri("shortcuts",cur_uri);
      } else {
        span.css("visibility","visible");
        menu.flm.onProposedUri("shortcuts",cur_uri);
      }
      // remove old suggestion
      menu.flm.removeSuggestions();
      // insert new suggestion
      menu.flm.insertSuggestions();
      // regenerate the graph
      menu.flm.update();
    });
    $("#"+menu.listObjectMenu).append(li);
    $("#"+menu.listObjectMenu).append($("<li></li>").attr("class","divider"));
    /* next entity */
  });

};
/**************************************************************************/
/**/
/**/
/* Shortcuts Menu */
/**/
/**/
var entitiesAndRelationsFuncMenu = function(menu) {
  var buildLiView = function(uri,label,submenu,hidden) {

    var icheck = $("<span/>")
        .attr("class","glyphicon glyphicon-check");

    if (hidden) {
      icheck.css("visibility","hidden");
    }
    var a = $("<a></a>")
            .attr("href","#")
            .attr("class","small")
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
  };
  var menuView = menu;
  // <li><a href="#" class="small" data-value="option1" tabIndex="-1"><input type="checkbox"/>&nbsp;Option 1</a></li>
  let lentities = Object.keys(new AskomicsUserAbstraction().getEntities());

  $.each(lentities, function(i) {

    let node = new GraphObject({'uri' : lentities[i]});
    let nodeuri = node.uri;
    var li = buildLiView(nodeuri,node.removePrefix(),false,false);

    li.on('click', function() {
      var span = $(this).find(".glyphicon");
      var cur_uri = $(this).attr("uri");
      if ( span.css("visibility") == "visible" ) {
        span.css("visibility","hidden");
        menuView.flm.offProposedUri("node",cur_uri);
        // disable all predicate associated with this node
        $(this).parent().parent().find("li[nodeuri='"+cur_uri+"']").attr("class","disabled");
      } else {
        span.css("visibility","visible");
        menuView.flm.onProposedUri("node",cur_uri);
        // enable all predicate associated with this node
        $(this).parent().parent().find("li[nodeuri='"+cur_uri+"']").removeAttr("class");
      }
      // remove old suggestion
      menuView.flm.removeSuggestions();
      // insert new suggestion
      menuView.flm.insertSuggestions();
      // regenerate the graph
      menuView.flm.update();
    });

    $("#"+menuView.listObjectMenu).append(li);
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
        let li = buildLiView(rel,linkRel.removePrefix()+"&#8594;"+object.removePrefix(),true,false);

        li.attr("nodeuri",nodeuri)
          .on('click', function() {
            /* when this li is unavailable, we can do nothing */
            if ( $(this).attr("class") === "disabled" ) return ;

            var span = $(this).find(".glyphicon");
            var cur_uri = $(this).attr("uri");
            if ( span.css("visibility") == "visible" ) {
             span.css("visibility","hidden");
             menuView.flm.offProposedUri("link",cur_uri);
            } else {
             span.css("visibility","visible");
             menuView.flm.onProposedUri("link",cur_uri);
           }
           /* remove old suggestion */
           menuView.flm.removeSuggestions();
           /* insert new suggestion */
           menuView.flm.insertSuggestions();
           /* regenerate the graph */
           menuView.flm.update();
        });
        $("#"+menuView.listObjectMenu).append(li);
      });
    });
    $("#"+menuView.listObjectMenu).append($("<li></li>").attr("class","divider"));
    /* next entity */
  });

  let positionableEntities = new AskomicsUserAbstraction().getPositionableEntities();
  if (Object.keys(positionableEntities).length>0) {
    /* positionable object */
    let posuri = "positionable";
    let li = buildLiView(posuri,posuri,false,true);
    menuView.flm.offProposedUri("link",posuri);

    li.attr("nodeuri",posuri)
      .on('click', function() {
        var span = $(this).find(".glyphicon");
        var cur_uri = $(this).attr("uri");
        if ( span.css("visibility") == "visible" ) {
          span.css("visibility","hidden");
          menuView.flm.offProposedUri("link",cur_uri);
        } else {
          span.css("visibility","visible");
          menuView.flm.onProposedUri("link",cur_uri);
        }
        /* remove old suggestion */
        menuView.flm.removeSuggestions();
        /* insert new suggestion */
        menuView.flm.insertSuggestions();
        /* regenerate the graph */
        menuView.flm.update();
      });
      $("#"+menuView.listObjectMenu).append(li);
      //$("#viewListNodesAndLinks").append($("<li></li>").attr("class","divider"));
    }
};

/**************************************************************************/
/**/
/**/
/* Shortcuts Menu */
/**/
/**/
var graphFuncMenu = function(menu) {
  var buildLiView = function (uri,label,submenu) {

    var icheck = $("<span/>")
        .attr("class","glyphicon glyphicon-check");

    var a = $("<a></a>")
            .attr("href","#")
            .attr("class","small")
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
  };

  let listGraph = new AskomicsUserAbstraction().listGraphAvailable();

  $.each(listGraph, function(g) {
    let graph = g;
    let li = buildLiView(graph,graph,true);
    li.on('click',function() {
        var span = $(this).find(".glyphicon");
        var cur_uri = $(this).attr("uri");
        if ( span.css("visibility") == "visible" ) {
          span.css("visibility","hidden");
          new AskomicsUserAbstraction().unactiveGraph(cur_uri);
        } else {
          span.css("visibility","visible");
          new AskomicsUserAbstraction().activeGraph(cur_uri);
        }
        /* remove old suggestion */
        menu.flm.removeSuggestions();
        /* insert new suggestion */
        menu.flm.insertSuggestions();
        /* regenerate the graph */
        menu.flm.update();
      });
    $("#"+menu.listObjectMenu).append(li).append($("<li></li>"));
  });
};
