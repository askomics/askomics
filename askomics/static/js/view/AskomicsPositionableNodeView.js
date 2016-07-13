/*jshint esversion: 6 */

/*
  Manage Information Link View With a current selected link
*/
class AskomicsPositionableNodeView extends AskomicsNodeView {
  constructor(node) {
    super(node);
  }
  display_help() {
    let help_title = 'positionable node '+this.node.label;
    let help_str = this.node.label+' is a positionable node. You can click on the positionable link to change the query.';
    help_str += ' Choose which attributes you want to see on the right panel.';
    help_str += ' Filter this attributes by choosing values';
    displayModal(help_title, help_str, 'ok');
  }
}
