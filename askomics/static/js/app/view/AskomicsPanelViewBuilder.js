/*jshint esversion: 6 */

let instancePanelViewBuilder ;

class AskomicsPanelViewBuilder {
  constructor() {

    /* Implement a Singleton */
    if ( instancePanelViewBuilder !== undefined ) {
        return instancePanelViewBuilder;
    }

    this.lViews = {};
    instancePanelViewBuilder = this;
  }

  removeAll() {
    instancePanelViewBuilder.lViews = {};
  }

  getPanelView(obj) {
    if (obj.id in instancePanelViewBuilder.lViews) {
      return instancePanelViewBuilder.lViews[obj.id];
    }
    
    if ( obj instanceof AskomicsPositionableLink ) {
      instancePanelViewBuilder.lViews[obj.id] = new AskomicsPositionableLinkView(obj);
    } else if ( obj instanceof AskomicsPositionableNode ) {
      instancePanelViewBuilder.lViews[obj.id] = new AskomicsPositionableNodeView(obj);
    } else if (obj instanceof AskomicsNode ) {
      instancePanelViewBuilder.lViews[obj.id] = new AskomicsNodeView(obj);
    } else if ( obj instanceof AskomicsLink ) {
      instancePanelViewBuilder.lViews[obj.id] = new AskomicsLinkView(obj);

    }else {
      throw 'AskomicsPanelViewBuilder:getPanelNodeView unknown type '+ obj.constructor.name +' Cannot instanciate view !';
    }

    return instancePanelViewBuilder.lViews[obj.id] ;
  }
}
