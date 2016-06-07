/*jshint esversion: 6 */

/*
  Manage Information Node View With a current selected node
*/
var AskomicsLinksView = function () {
  // take a string and return an entity with a sub index
  AskomicsLinksView.prototype.selectListLinksUser = function(links,node) {
    /* fix the first link associted with the new instanciate node TODO: propose an interface to select the link */
  for (var il in links) {
    var l = links[il];
    console.log("===>"+JSON.stringify(l));
    if ( l.suggested && (l.source.id == node.id || l.target.id == node.id) ) {
        return [links[il]];
    }
  }

  //$('#linksModal').modal('hide');
    /*
    for (var l of links) {
        if ( l.suggested ) {
          if (l.source.id == d.id || l.target.id == d.id ) {
            graphBuilder.instanciateLink(l);
            graphView.solidifyLink(l);
            break ; //only the link finded....
          }
        }
    }*/
  };
};
