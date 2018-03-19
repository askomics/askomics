/*jshint esversion: 6 */
let instanceAskomicsJobsViewManager ;

  class AskomicsJobsViewManager {
    constructor() {
      /* Implement a Singleton */
      if ( instanceAskomicsJobsViewManager !== undefined ) {
          return instanceAskomicsJobsViewManager;
      }

      this.jobs = [];
      this.npreview=30 ; /* max data to transfert to IHM */

      instanceAskomicsJobsViewManager = this;

    }

    static addZero(x, n) {
      while (x.toString().length < n) {
        x = "0" + x;
      }
      return x;
    }

    static getDuration(tstart,tend) {
      let elp  = new Date(tend - tstart);
      //let h = addZero(elp.getHours(), 2);
      let m = AskomicsJobsViewManager.addZero(elp.getMinutes(), 2);
      let s = AskomicsJobsViewManager.addZero(elp.getSeconds(), 2);
      let ms = AskomicsJobsViewManager.addZero(elp.getMilliseconds(), 3);

      return m + " m:" + s + " s:" + ms +" ms";
    }

    static getClassTr(state) {
      if (state.startsWith("Ok") ) return "bg-success";
      if (state == "Done" ) return "bg-info";
      if (state.startsWith("Error") )return "bg-danger";
      return "bg-warning";
    }

    loadjob(resolve) {
      return new Promise(function(resolve,reject) {
        let service = new RestServiceJs('listjob');

        let model = {};

        service.post(model, function(data) {
          let ljobs = new AskomicsJobsViewManager().jobs ;
          ljobs.splice(0,ljobs.length);

          for (let i in data ) {

            let job = {} ;
            job.jobid = data[i].jobid ;
            job.type = data[i].type ;
            job.wait = (data[i].state == "Wait");
            job.state = data[i].state ;
            job.tstart = data[i].start*1000 ;
            job.tend = data[i].end*1000 ;

            job.start = new Date(job.tstart).toLocaleString() ;

            job.end = new Date(job.tend).toLocaleString() ;

            job.nr = data[i].nr ;
            job.duration = AskomicsJobsViewManager.getDuration(job.tstart,job.tend) ;
            job.classtr = AskomicsJobsViewManager.getClassTr(job.state) ;
            if ( data[i].requestGraph != '') {
              //console.log("requestGraph======>"+JSON.stringify(data[i].requestGraph));
              job.stateToReload = btoa(data[i].requestGraph);
            }
            if ( 'file' in data[i] ) {
              job.csv   = data[i].file;
            }

            job.preview = $('<div></div>').html(data[i].preview) ;
            job.data = undefined;
            if ( 'data' in data[i] ) job.data = data[i].data ;
            job.variates = data[i].variates;

            let idx = 0;
            for (idx;idx<ljobs.length;idx++) {
              if ( job.jobid < ljobs[idx] ) break;
            }

            ljobs.splice(idx, 0, job);
          }
          resolve();
        });
      });
    }

    deletejob(job) {
      let service = new RestServiceJs('deljob');

      let model = {
        jobid : job.jobid
      };

      service.post(model, function(data) {
        new AskomicsJobsViewManager().listJobs();
      });
    }

    removeJob(index) {
      if ('csv' in this.jobs[index] ) {
        let service = new RestServiceJs('del_csv/');//location.href='del_csv/{{this.csv}}';
        service.get(this.jobs[index].csv);
      }
      this.deletejob(this.jobs[index]);
      this.jobs.splice(index, 1);
      if (this.jobs.length<=0) $("#interrogation").trigger( "click" );

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
                  'constraintesFilters'  : tab[2],
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
      let self = this;

      service.post(jdata,function(data) {
        new AskomicsJobsViewManager().listJobs();
      });

      this.wait(50).then( function() {
        $("#jobsview").trigger( "click" );
      });
    }

    listJobs() {
      this.loadjob().then(function () {
        let __inst = new AskomicsJobsViewManager();
        let template = AskOmics.templates.jobs;

        let context = {jobs: __inst.jobs, galaxy: __ihm.user.haveGalaxy()};
        let html = template(context);

        $("#content_jobsview").empty();
        $("#content_jobsview").append(html);

        for ( let ij in __inst.jobs ) {

          if ( __inst.jobs[ij].data != undefined ) {
          //  let struct = JSON.parse(atob(__inst.jobs[ij].stateToReload));
            let prev = new AskomicsResultsView(__inst.jobs[ij].data,__inst.jobs[ij].variates).getPreviewResults() ;
            let r = $("#results_table_"+ij);
            r.append(

              $("<h3></h3>").addClass("header-div")
                            .css("text-align","center")
                            .html("Preview ("+Math.min(__inst.npreview,__inst.jobs[ij].nr)+" rows)")
                          );

            r.append(prev);
          } else {
            if ( __inst.jobs[ij].preview != undefined ) {
              $("#results_table_"+ij).append(__inst.jobs[ij].preview);
            }
          }
        }
      });
    }
}
