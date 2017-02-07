/*jshint esversion: 6 */

function prepareQuery(exp, roq) {
    //     Get JSON to ask for a SPARQL query corresponding to the graph
    //     and launch it according to given parameters.
    //
    //     :exp: false = results overview
    //           true = complete results file generation
    //     :lim: LIMIT value in the SPARQL query
    //     :roq: bool, if true, don't launch the query, only return it
    console.log('+++ prepareQuery +++');

    var tab = new AskomicsGraphBuilder().buildConstraintsGraph();
    return {
              'export'               : exp,
              'variates'             : tab[0],
              'constraintesRelations': tab[1],
              'constraintesFilters'  : tab[2],
              'limit'                : 500
           };
}

function viewQueryResults() {

    //new AskomicsJobsViewManager().createJob();
    //if (true) return ;

    $("#btn-down").prop("disabled", false);
    displayModal('Please wait', '', 'Close');

    let time = $.now();
    let service = new RestServiceJs("sparqlquery");
    let jdata = prepareQuery(false, false);
    service.post(jdata,function(data) {
      hideModal();
      let new_time = $.now();
      let exec_time = new_time - time;
      console.log('===> query executed in '+exec_time+' ms');
      if ('error' in data) {
        alert(data.error);
        return;
      }
      new AskomicsResultsView(data).displayResults();
      //resize graph if fullscreen
      if ($('#icon-resize-graph').attr('value') == 'full') {
        forceLayoutManager.normalsizeGraph();
      }
    });
}

function downloadResultsFile() {
    displayModal('Generating results file ...', '', 'Close');
    var service = new RestServiceJs("sparqlquery");
    var jdata = prepareQuery(true,false);
    service.post(jdata, function(data) {
        hideModal();
        window.location.href = data.file;
    });
}
