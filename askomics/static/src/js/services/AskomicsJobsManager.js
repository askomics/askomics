/*jshint esversion: 6 */

  class AskomicsJobsViewManager {
    constructor() {

      this.integration_jobs = [];
      this.query_jobs = [];
      this.npreview=30 ; /* max data to transfert to IHM */
      this.maxrows=null;

    }

    addZero(x, n) {
      while (x.toString().length < n) {
        x = "0" + x;
      }
      return x;
    }

    getDuration(tstart,tend) {
      let elp  = new Date(tend - tstart);
      //let h = addZero(elp.getHours(), 2);
      let m = this.addZero(elp.getMinutes(), 2);
      let s = this.addZero(elp.getSeconds(), 2);
      let ms = this.addZero(elp.getMilliseconds(), 3);

      return m + " m:" + s + " s:" + ms +" ms";
    }

    getClassTr(state) {
      if (state.startsWith("Ok") ) return "bg-success";
      if (state == "Done" ) return "bg-info";
      if (state.startsWith("Error") )return "bg-danger";
      return "bg-warning";
    }

    loadjob(resolve) {
      return new Promise((resolve, reject) => {
        let service = new RestServiceJs('listjob');

        service.getAll((data) => {
          let integration_jobs = data.integration;
          let query_jobs = data.query;

          // format integration
          for (let i in integration_jobs) {
            integration_jobs[i].wait = (integration_jobs[i].state == "wait");
            integration_jobs[i].duration = this.getDuration(integration_jobs[i].start * 1000, integration_jobs[i].end * 1000);
            integration_jobs[i].start = new Date(integration_jobs[i].start * 1000).toLocaleString();
            integration_jobs[i].end = new Date(integration_jobs[i].end * 1000).toLocaleString();
          }

          // format query
          for (let i in query_jobs){
            query_jobs[i].wait = (query_jobs[i].state == "wait");
            query_jobs[i].duration = this.getDuration(query_jobs[i].start * 1000, query_jobs[i].end * 1000);
            query_jobs[i].start = new Date(query_jobs[i].start * 1000).toLocaleString();
            query_jobs[i].end = new Date(query_jobs[i].end * 1000).toLocaleString();
            query_jobs[i].classtr = this.getClassTr(query_jobs[i].state);
            query_jobs[i].warn = query_jobs[i].nrow == data.maxrows ? true : false;
            if (query_jobs[i].graph != '') {
              query_jobs[i].stateToReload = btoa(query_jobs[i].graph);
            }
            query_jobs[i].csv = query_jobs[i].file; // replace
            query_jobs[i].preview = $('<div></div>').html(query_jobs[i].preview);
          }

          this.integration_jobs = integration_jobs;
          this.query_jobs = query_jobs;
          this.maxrows = data.maxrows;

          resolve();
        });
      });
    }


    remove_job(id, index, table) {

      if (table == 'query') {
        let service = new RestServiceJs('del_csv/');
        service.get(this.query_jobs[index].csv);
      }

      let service = new RestServiceJs('deljob');
      let model = {table: table, jobid: id};

      service.post(model, () => {
        this.loadjob().then(() => {
          this.update_jobview();
        });
      });
    }

    prepareQuery() {
        //     Get JSON to ask for a SPARQL query corresponding to the graph
        //     and launch it according to given parameters.
        //
        //     :lim: LIMIT values for preview
        //console.log('+++ prepareQuery +++');

        let tab = __ihm.getGraphBuilder().buildConstraintsGraph();
        let tab2 = __ihm.getGraphBuilder().getEndpointAndGraph();

        return {
                  'endpoints'            : tab2[0],
                  'type_endpoints'       : tab2[1],
                  'graphs'               : tab2[2],
                  'variates'             : tab[0],
                  'constraintesRelations': tab[1],
                  'removeGraph'          : __ihm.getAbstraction().listUnactivedGraph(),
                  'requestGraph'         : __ihm.getGraphBuilder().getInternalState(),
                  'jobManager'           : true,
                  'limit'                : this.npreview          // number of data preview
               };
    }

    wait(ms) {
      let defer = $.Deferred();
      setTimeout(function() { defer.resolve(); }, ms);
      return defer;
    }

    createQueryJob() {
      //create state view
      let service = new RestServiceJs("sparqlquery");
      let jdata = this.prepareQuery();

      service.post(jdata, (data) => {
        this.loadjob().then(() => {
          this.update_jobview('query');
        });
      });

      // go to jobs page
      $('.nav li.active').removeClass('active');
      $("li#jobsview").addClass('active');
      if ( ! ( $("li#jobsview").attr('id') in { 'help' : '','admin':'', 'user_menu': '' }) ) {
        $('.container').hide();
        $('.container#navbar_content').show();
        $('.container#content_' + $("li#jobsview").attr('id')).show();
      } else {
        $('.container#navbar_content').show();
      }
    }

    update_jobview (active_tab) {

        if (!active_tab) {
          if ($("div#jobs_query").hasClass("active")) {
            active_tab = "query";
          }else{
            active_tab = "integration";
          }
        }

        let template = AskOmics.templates.jobs;

        let context = {integration: this.integration_jobs, query: this.query_jobs, galaxy: __ihm.user.galaxy, maxrows: this.maxrows};

        let html = template(context);

        $("#content_jobsview").empty();
        $("#content_jobsview").append(html);

        for ( let ij in this.query_jobs ) {

          if ( this.query_jobs[ij].data != undefined ) {
            let prev = new AskomicsResultsView(this.query_jobs[ij].data ,this.query_jobs[ij].variates).getPreviewResults() ;
            let r = $("#results_table_"+ij);
            r.append(

              $("<h3></h3>").addClass("header-div")
                            .css("text-align","center")
                            .html("Preview ("+Math.min(this.npreview, this.query_jobs[ij].nrows)+" rows)")
                          );

            r.append(prev);
          } else {
            if ( this.query_jobs[ij].preview != undefined ) {
              $("#results_table_"+ij).append(this.query_jobs[ij].preview);
            }
          }

          // active tab
          if (active_tab == "integration") {
            $("#integration-tab").addClass("active");
            $("#jobs_integration").addClass("in active");
          }else if (active_tab == "query"){
            $("#query-tab").addClass("active");
            $("#jobs_query").addClass("in active");
          }
        }
    }
}
