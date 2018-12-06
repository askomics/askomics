/*jshint esversion: 6 */

/*
  Manage Menu View to select and unselect proposition of element/link
*/
class AskomicsMenu {

  constructor (nameMenu,buttonMenu,listObjectMenu,functFillMenu,removeWhenReset=true) {
    this.name = nameMenu;
    this.buttonMenu = buttonMenu;
    this.listObjectMenu = listObjectMenu ;
    this.func = functFillMenu ;
    this.removeWhenReset = removeWhenReset ;
  }

  reset() {
    let menu = this ;
    // Remove onclick
    $("#"+menu.buttonMenu).unbind();
    if (menu.removeWhenReset)
      $("#"+menu.listObjectMenu).empty();
  }

  start() {
    this.func(this);
  }

  slideUp() {
    $("#menuGraph").find("ul").slideUp();
  }
}

/**************************************************************************/
/**/
/**/
/* File Menu */
/**/
/**/
var fileFuncMenu = function(menu) {

  $("#dwl-query").on('click', function(d) {
    let date = new Date().getTime();
    $(this).attr("href", "data:application/octet-stream," + encodeURIComponent(__ihm.getGraphBuilder().getInternalState())).attr("download", "query-" + date + ".json");
  });


  $("#dwl-query-sparql").on('click', function(d) {
    let service = new RestServiceJs("getSparqlQueryInTextFormat");
    let jdata = __ihm.jobsview.prepareQuery();

    let current = this;
    $(current).removeAttr("href");
    service.postsync(jdata,function(data) {
      let date = new Date().getTime();
      $(current).attr("href", "data:application/sparql-query," + encodeURIComponent(data.query)).attr("download", "query-" + date + ".rq");
    });

  });

  $('#send-query-galaxy').on('click', function(d) {
    let service = new RestServiceJs('send_to_galaxy');
    let model = {};
    model.json =  __ihm.getGraphBuilder().getInternalState();
    service.post(model, function(data) {
      __ihm.manageErrorMessage(data);
    });
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

    let icheck = $("<span/>")
        .attr("class","glyphicon glyphicon-check")
        .css("visibility","hidden");

    let a = $("<a></a>")
            .attr("href","#")
            .attr("class","small")
            .attr("tabIndex","-1") ;
    if (submenu) {
      a.html($("<i></i>").append(label+"\t")).append(icheck);
    } else {
      a.html($("<b></b>").append(label+"\t")).append(icheck);
    }
    let li = $("<li></li>");
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
    let li = buildLiView(i,lshortcuts[i].label,false);
    __ihm.getSVGLayout().offProposedUri("shortcuts",i);

    li.on('click', function() {
      let span = $(this).find(".glyphicon");
      let cur_uri = $(this).attr("uri");
      if ( span.css("visibility") == "visible" ) {
        span.css("visibility","hidden");
        __ihm.getSVGLayout().offProposedUri("shortcuts",cur_uri);
      } else {
        span.css("visibility","visible");
        __ihm.getSVGLayout().onProposedUri("shortcuts",cur_uri);
      }
      // remove old suggestion
      __ihm.getSVGLayout().removeSuggestions();
      // insert new suggestion
      __ihm.getSVGLayout().insertSuggestions();
      // regenerate the graph
      __ihm.getSVGLayout().update();
    });
    $("#"+menu.listObjectMenu).append(li);
    $("#"+menu.listObjectMenu).append($("<li></li>").attr("class","divider"));
    /* next entity */
  });

  /* remove button if no shortcuts */
  if ( Object.keys(lshortcuts).length <= 0 ) {
    $("#"+menu.buttonMenu).prop('disabled', true);
  }

};
/**************************************************************************/
/**/
/**/
/* View Menu */
/**/
/**/
var entitiesAndRelationsFuncMenu = function(menu) {
  var buildLiView = function(uri,label,submenu,hidden) {

    let icheck = $("<span/>")
        .attr("class","glyphicon glyphicon-check");

    if (hidden) {
      icheck.css("visibility","hidden");
    }
    let a = $("<a></a>")
            .attr("href","#")
            .attr("class","small")
            .attr("tabIndex","-1") ;
    if (submenu) {
      a.html($("<i></i>").append(label+"\t")).append(icheck);
    } else {
      a.html($("<b></b>").append(label+"\t")).append(icheck);
    }
    let li = $("<li></li>");
    li.attr("uri",uri);
    li.css("display","table-cell");
    li.css("vertical-align","middle");
    li.append(a);
    return li;
  };
  let menuView = menu;
  // <li><a href="#" class="small" data-value="option1" tabIndex="-1"><input type="checkbox"/>&nbsp;Option 1</a></li>
  let lentities = Object.keys(__ihm.getAbstraction().getEntities());

  $.each(lentities, function(i) {

    let node = new GraphObject({'uri' : lentities[i]});
    let nodeuri = node.uri;
    let li = buildLiView(nodeuri,node.removePrefix(),false,false);

    li.on('click', function() {
      let span = $(this).find(".glyphicon");
      let cur_uri = $(this).attr("uri");
      if ( span.css("visibility") == "visible" ) {
        span.css("visibility","hidden");
        __ihm.getSVGLayout().offProposedUri("node",cur_uri);
        // disable all predicate associated with this node
        $(this).parent().parent().find("li[nodeuri='"+cur_uri+"']").attr("class","disabled");
      } else {
        span.css("visibility","visible");
        __ihm.getSVGLayout().onProposedUri("node",cur_uri);
        // enable all predicate associated with this node
        $(this).parent().parent().find("li[nodeuri='"+cur_uri+"']").removeAttr("class");
      }
      // remove old suggestion
      __ihm.getSVGLayout().removeSuggestions();
      // insert new suggestion
      __ihm.getSVGLayout().insertSuggestions();
      // regenerate the graph
      __ihm.getSVGLayout().update();
    });

    $("#"+menuView.listObjectMenu).append(li);
    /* --------------------------- */
    /* Adding filter on relations  */
    /* --------------------------- */

    let tab = __ihm.getAbstraction().getRelationsObjectsAndSubjectsWithURI(nodeuri);
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

            let span = $(this).find(".glyphicon");
            let cur_uri = $(this).attr("uri");
            if ( span.css("visibility") == "visible" ) {
             span.css("visibility","hidden");
             __ihm.getSVGLayout().offProposedUri("link",cur_uri);
            } else {
             span.css("visibility","visible");
             __ihm.getSVGLayout().onProposedUri("link",cur_uri);
           }
           /* remove old suggestion */
           __ihm.getSVGLayout().removeSuggestions();
           /* insert new suggestion */
           __ihm.getSVGLayout().insertSuggestions();
           /* regenerate the graph */
           __ihm.getSVGLayout().update();
        });
        $("#"+menuView.listObjectMenu).append(li);
      });
    });
    $("#"+menuView.listObjectMenu).append($("<li></li>").attr("class","divider"));
    /* next entity */
  });

  let positionableEntities = __ihm.getAbstraction().getPositionableEntities();
  if (Object.keys(positionableEntities).length>0) {
    /* positionable object */
    let posuri = "positionable";
    let li = buildLiView(posuri,posuri,false,true);
    __ihm.getSVGLayout().offProposedUri("link",posuri);

    li.attr("nodeuri",posuri)
      .on('click', function() {
        let span = $(this).find(".glyphicon");
        let cur_uri = $(this).attr("uri");
        if ( span.css("visibility") == "visible" ) {
          span.css("visibility","hidden");
          __ihm.getSVGLayout().offProposedUri("link",cur_uri);
        } else {
          span.css("visibility","visible");
          __ihm.getSVGLayout().onProposedUri("link",cur_uri);
        }
        /* remove old suggestion */
        __ihm.getSVGLayout().removeSuggestions();
        /* insert new suggestion */
        __ihm.getSVGLayout().insertSuggestions();
        /* regenerate the graph */
        __ihm.getSVGLayout().update();
      });
      $("#"+menuView.listObjectMenu).append(li);
      //$("#viewListNodesAndLinks").append($("<li></li>").attr("class","divider"));
    }
};

/**************************************************************************/
/**/
/**/
/* Graph Menu */
/**/
/**/
var graphFuncMenu = function(menu) {
  var buildLiView = function (uri,label,submenu) {

    let icheck = $("<span/>")
        .attr("class","glyphicon glyphicon-check");

    let a = $("<a></a>")
            .attr("href","#")
            .attr("class","small")
            .attr("tabIndex","-1") ;
    if (submenu) {
      a.html($("<i></i>").append(label+"\t")).append(icheck);
    } else {
      a.html($("<b></b>").append(label+"\t")).append(icheck);
    }
    let li = $("<li></li>");
    li.attr("uri",uri);
    li.css("display","table-cell");
    li.css("vertical-align","middle");
    li.append(a);
    return li;
  };

  let listGraph = __ihm.getAbstraction().listGraphAvailable();

  $.each(listGraph, function(endpoint) {
    let at = $("<li></li>").append($("<span></span>").attr("class","medium").append(endpoint));
  //  let at = $("<span></span>").attr("class","medium").append(endpoint);
    $("#"+menu.listObjectMenu).append(at);
    $.each(listGraph[endpoint], function(g) {
      let graph = listGraph[endpoint][g];
      let li = buildLiView(graph,__ihm.graphname(graph).name,true);
      li.on('click',function() {
        let span = $(this).find(".glyphicon");
        let cur_uri = $(this).attr("uri");
        if ( span.css("visibility") == "visible" ) {
          span.css("visibility","hidden");
          __ihm.getAbstraction().unactiveGraph(cur_uri);
        } else {
          span.css("visibility","visible");
          __ihm.getAbstraction().activeGraph(cur_uri);
        }
        /* update menu view with relations and objects availables */
        __ihm.menus.menuView.reset();
        __ihm.menus.menuView.start();

        /* remove old suggestion */
        __ihm.getSVGLayout().removeSuggestions();
        /* insert new suggestion */
        __ihm.getSVGLayout().insertSuggestions();
        /* regenerate the graph */
        __ihm.getSVGLayout().update();
      });
      $("#"+menu.listObjectMenu).append(li).append($("<li></li>"));
    });
  });
};
