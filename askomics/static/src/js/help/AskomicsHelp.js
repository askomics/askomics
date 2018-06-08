/*jshint multistr:true */
/*jshint esversion: 6 */

class AskomicsHelp {

  constructor() {

  }

  static checkFirstUseAskomics(nStartpoints) {
    if (__ihm.user.isLogin()) {
      /* Check if database have starting point */
      if (nStartpoints<=0) {
        AskomicsHelp.startIntegration();
      }
    } else {
      /* Check if database have none users */
      let service = new RestServiceJs('nbUsers');
      service.getAll()
      .done(function(data) {
        if (data.count<=0) {
          /* Display information to create an account */
          AskomicsHelp.startUserAccount();
        }
      })
      .fail(function(value) {
      });
    }
  }

  static wikiDocumentation () {
    return "<h4>User documentation</h4>\
    <p> \
    <ol>\
    <li><a target='_blank' href='https://github.com/askomics/askomics/wiki/Usage#create-an-account'> Create an account </a></li> \
    <li><a target='_blank' href='https://github.com/askomics/askomics/wiki/Usage#upload-your-data'> Upload your (local or remote) data (TSV/GFF/TTL/OWL/RDF-XML/N3/NT/JSON-LD) </a></li>\
    <li><a target='_blank' href='https://github.com/askomics/askomics/wiki/Usage#query-your-data'> Query your data </a></li>\
    </p>";
  }


  static startUserAccount(){
    introJs().setOptions({
      //showBullets: false,
      showStepNumbers: false,
      steps: [

        {
          element: '#navbar',
          intro: "<h3>Need Help to use Askomics ?</h3>                               \
          <p>AskOmics provide a visual                                               \
          representation of the user abstraction as a graph.                         \
          By starting from a node of interest and iteratively selecting its\
          neighbors, the user creates a path on an abstraction graph.\
          This path can then be transformed into a SPARQL query that can be\
          executed on the original dataset.</p>" + AskomicsHelp.wikiDocumentation(),
        },
        {
          element: '#login',
          intro: "<p>Create an user account to insert your own data</p>\n"+ AskomicsHelp.wikiDocumentation(),
          position: 'bottom'
        },
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

  static startIntegration(){

    introJs().setOptions({
      //showBullets: false,
      showStepNumbers: false,
      steps: [
{
  element: '#integration',
  intro: "<p>Database is empty. Upload your CSV/TSV/GFF/TTL files !<p>"+ AskomicsHelp.wikiDocumentation(),
  position: 'bottom'
},
{
  element: '#interrogation',
  intro: "<p>Create a request path to build a SPARQL query based on public and your own data.</p>"+ AskomicsHelp.wikiDocumentation(),
  position: 'bottom',
},
{
  element: '#jobsview',
  intro: 'Results Visualization Jobs',
  position: 'bottom'
},
{
  element: '#admin',
  intro: 'Datasets informations and managements of your own graphs.',
  position: 'bottom'
},
/*******************************************************************/
/*                   UPLOAD CONTAINER                              */
/*******************************************************************/
        {
          element: '#add_files_upload',
          intro: "Select CSV/TSV/GFF/TTL files that you want upload.",
          position: 'bottom',
        },
        {
          element: '#start_upload',
          intro: "Start upload of the selectionned files ",
          position: 'bottom',
        },
        {
          element: '#cancel_upload',
          intro: "Cancel upload",
          position: 'bottom',
        },
        {
          element: '#delete_upload',
          intro: "Delete uploaded files (Your local files are not deleted) ",
          position: 'bottom',
        },
        {
          element: '#integrate_upload',
          intro: "Start the data integration with a friendly user interface !",
          position: 'bottom',
        },

        /*******************************************************************/
        /*                   ASK CONTAINER                              */
        /*******************************************************************/
        {
          element: '#content_interrogation',
          intro: "Have you ever upload your data with the 'Upload' section ? Next this step, you can select a graph with an entity to start an askomics session with you integrated data.",
          position: 'bottom'
        },

        {
          element: '#content_interrogation #graph_startpoints',
          intro: "A graph contains all the information contained in a public or private data file.",
          position: 'bottom'
        },

        {
          element: '#content_interrogation #startpoints',
          intro: "A start entity allows to start a search on the integrated data.",
          position: 'right'
        },
        {
          element: '#content_interrogation #buttonViewFile',
          intro: "Save/load an AskOmics session. Download a SPARQL query.",
          position: 'right'
        },
        {
          element: '#content_interrogation #buttonViewListGraph',
          intro: "Select/Unselect graphs on your current session.",
          position: 'right'
        },
        {
          element: '#content_interrogation #buttonViewListNodesAndLinks',
          intro: "Select/Unselect links and nodes proposisitions on your current session.",
          position: 'right'
        },
        {
          element: '#content_interrogation #buttonViewListShortcuts',
          intro: "Select/Unselect shortcuts availables on this repository.",
          position: 'right'
        },
        {
          element: '#content_interrogation #buttonReset',
          intro: "Restart a new AskOmics session.",
          position: 'right'
        },

        {
          element: '.glyphicon-plus',
          intro: "<p>Match or negative match if the expression is not empty.</p><ul class=\"list-group\">\
            <li class=\"list-group-item\"><span class=\"glyphicon glyphicon-plus\">&nbsp;match</li>\
            <li class=\"list-group-item\"><span class=\"glyphicon glyphicon-minus\">&nbsp;negative match</li>\
            </ul>",
          position: 'left'
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
