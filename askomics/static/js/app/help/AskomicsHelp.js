/*jshint multistr:true */
/*jshint esversion: 6 */

class AskomicsHelp {

  constructor() {

  }

  static start(){

    introJs().setOptions({
      //showBullets: false,
      showStepNumbers: false,
      steps: [
/*
        {
          intro: "<h2>Need Help to use Askomics ?</h2>\
          <p>AskOmics provide a visual\
          representation of the user abstraction as a graph.\
          By starting from a node of interest and iteratively selecting its\
          neighbors, the user creates a path on an abstraction graph.\
          This path can then be transformed into a SPARQL query that can be\
          executed on the original dataset.</p>"
        },
        {
          intro: "You <b>don't need</b> to define element to focus, this is a floating tooltip."
        },
*/

/*******************************************************************/
/*                   UPLOAD CONTAINER                              */
/*******************************************************************/
        {
          element: '#add_files_upload',
          intro: "<p>Select CSV/TSV files that you want upload.</p>",
          position: 'bottom',
        },
        {
          element: '#start_upload',
          intro: "<p>Start upload of the selectionned files </p>",
          position: 'bottom',
        },
        {
          element: '#cancel_upload',
          intro: "<p>Cancel upload</p>",
          position: 'bottom',
        },
        {
          element: '#delete_upload',
          intro: "<p>Delete uploaded files (Your local files are not deleted) </p>",
          position: 'bottom',
        },
        {
          element: '#integrate_upload',
          intro: "<p>Start the data integration with a friendly user interface !</p>",
          position: 'bottom',
        },

        /*******************************************************************/
        /*                   ASK CONTAINER                              */
        /*******************************************************************/
        {
          element: '#content_interrogation #startpoints',
          intro: "Have you ever upload your data with the 'Upload' section ? Next this step, you can select a started element to begin an askomics session with you integrated data.",
          position: 'right'
        },

        {
          element: '.glyphicon-plus',
          intro: "<p>Match or negative match if the expression is not empty.</p><ul class=\"list-group\">\
            <li class=\"list-group-item\"><span class=\"glyphicon glyphicon-plus\">&nbsp;match</li>\
            <li class=\"list-group-item\"><span class=\"glyphicon glyphicon-minus\">&nbsp;negative match</li>\
            </ul>",
          position: 'left'
        },
        /* Keep at end */
/* =============================   NAV BAR ========================================================================*/
        {
          element: '#integration',
          intro: "<p>Upload your CSV/TSV user files.</p>",
          position: 'bottom'
        },
        {
          element: '#interrogation',
          intro: "<p>Create a path on your data and external services to build a SPARQL query based on your data.</p>",
          position: 'bottom',
        },
        {
          element: '#datasets',
          intro: 'Manage yours datasets.',
          position: 'bottom'
        },
        {
          element: '#statistics',
          intro: "Get some information about yours datasets(number of triplet, relation between entities, etc...).",
          position: 'bottom'
        },
        {
          element: '#administration',
          intro: 'Run/Stop services. Administration of external services (GO, UniProt,... )',
          position: 'bottom'
        }
      ].filter(function (obj) {
          if ( obj.element === undefined ) return true;
          return $(obj.element).is(':visible');
      })
    }).onbeforechange(function(targetElement) {

      if (targetElement === undefined || $(targetElement).is(':hidden')) // if targetElement does not exist or is hide
        {
        //  this.nextStep(); // go to the next step
        }
    }).start();
    return false;
  }
}
