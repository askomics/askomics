/*jshint esversion: 6 */

/*

*/
class GOLinkView extends AskomicsObjectView {
  constructor(graphBuilder,node) {
    super(graphBuilder,node);
  }
  display_help() {
    let help_title = 'todo';
    let help_str = 'todo';
    displayModal(help_title, help_str, 'ok');
  }

  create() {
  }
}
