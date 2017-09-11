/*jshint esversion: 6 */
let instanceAskomicsJobsViewManager ;

  class AskomicsJobsViewManager {
    constructor() {
      /* Implement a Singleton */
      if ( instanceAskomicsJobsViewManager !== undefined ) {
          return instanceAskomicsJobsViewManager;
      }

      this.jobs = [];
      this.jobGenId=0   ;
      this.npreview=30 ; /* max data to transfert to IHM */

      instanceAskomicsJobsViewManager = this;
    }

    createWaitState() {
      let time = $.now();
      let curId = this.jobGenId++;

      /* Create Job in status wait */
      this.jobs.push({
          jobid    : curId ,
          wait     : true,
          state    : 'wait',
          tstart   : time,
          start    : new Date(time).toLocaleString(),
          end      : '',
          duration : '',
          nr       : '' ,
          classtr  : 'bg-info', //bg-primary,bg-success,bg-warning,bg-danger,bg-info
          stateToReload : JSON.stringify(__ihm.getGraphBuilder().getInternalState())
      });

      new AskomicsJobsViewManager().listJobs();
      return curId;
    }

    addZero(x, n) {
      while (x.toString().length < n) {
        x = "0" + x;
      }
      return x;
    }

    changeOkState(id,data,preview_func) {

      let time = $.now() ;

      for ( let ij in this.jobs ) {
          if (this.jobs[ij].jobid === id) {

            this.jobs[ij].tend = time ;

            let elp  = new Date(this.jobs[ij].tend - this.jobs[ij].tstart);
            //let h = addZero(elp.getHours(), 2);
            let m = this.addZero(elp.getMinutes(), 2);
            let s = this.addZero(elp.getSeconds(), 2);
            let ms = this.addZero(elp.getMilliseconds(), 3);

            this.jobs[ij].end   = new Date(time).toLocaleString();
            this.jobs[ij].wait  = false;
            this.jobs[ij].state = "Ok";
            if ( 'nrow' in data ) {
              this.jobs[ij].nr    = data.nrow;
            }
            if ( 'file' in data ) {
              this.jobs[ij].csv   = data.file;
            }
            this.jobs[ij].duration = m + " m:" + s + " s:" + ms +" ms";
            this.jobs[ij].classtr = "bg-success";
            this.jobs[ij].datable_preview = preview_func(this.jobs[ij].stateToReload) ; //new AskomicsResultsView(data).getPreviewResults(this.jobs[ij].stateToReload);
          }
      }
      new AskomicsJobsViewManager().listJobs();
    }

    changeKoState(id,messErr) {
      for ( let ij in this.jobs ) {
          if (this.jobs[ij].jobid === id) {
            this.jobs[ij].tend = $.now() ;
            this.jobs[ij].wait  = false;
            this.jobs[ij].end   = new Date(this.jobs[ij].tend).toLocaleString();

            let elp  = new Date(this.jobs[ij].tend - this.jobs[ij].tstart);
            //let h = addZero(elp.getHours(), 2);
            let m = this.addZero(elp.getMinutes(), 2);
            let s = this.addZero(elp.getSeconds(), 2);
            let ms = this.addZero(elp.getMilliseconds(), 3);
            this.jobs[ij].duration = m + " m:" + s + " s:" + ms +" ms";

            this.jobs[ij].state = messErr ;
            this.jobs[ij].classtr = "bg-danger";
          }
      }
      new AskomicsJobsViewManager().listJobs();
    }

    removeJob(index) {
      if ('csv' in this.jobs[index] ) {
        let service = new RestServiceJs('del_csv/');//location.href='del_csv/{{this.csv}}';
        service.get(this.jobs[index].csv);
      }
      this.jobs.splice(index, 1);
      new AskomicsJobsViewManager().listJobs();
      if (this.jobs.length<=0) $("#interrogation").trigger( "click" );
    }

    prepareQuery() {
        //     Get JSON to ask for a SPARQL query corresponding to the graph
        //     and launch it according to given parameters.
        //
        //     :lim: LIMIT values for preview
        console.log('+++ prepareQuery +++');

        let tab = __ihm.getGraphBuilder().buildConstraintsGraph();
        return {
                  'variates'             : tab[0],
                  'constraintesRelations': tab[1],
                  'constraintesFilters'  : tab[2],
                  'removeGraph'          : __ihm.getAbstraction().listUnactivedGraph(),
                  'limit'                : this.npreview          // number of data preview
               };
    }

    createQueryJob() {
      //create state view
      let curId = new AskomicsJobsViewManager().createWaitState();
      let service = new RestServiceJs("sparqlquery");
      let jdata = this.prepareQuery();

      // Get ordered headers
      let result_view = new AskomicsResultsView({});
      result_view.setActivesAttributes();
      let attributes = result_view.getActivesAttributes();
      let ordered_headers = [];
      $.map(attributes, function(value, key) {
        $.merge(ordered_headers, value);
      });

      jdata.headers = ordered_headers;

      service.post(jdata,function(data) {
        if ('error' in data) {
          new AskomicsJobsViewManager().changeKoState(curId,data.error);
          return;
        }

        new AskomicsJobsViewManager().changeOkState(curId,data,function(d) {
          return new AskomicsResultsView(data).getPreviewResults(d) ;
        });
      });
      /* position on job list view */
      $("#jobsview").trigger( "click" );
    }

    insertQueue(trigger) {
      //create state view
      let curId = new AskomicsJobsViewManager().createWaitState();

      trigger(
        function (message,data) {
          new AskomicsJobsViewManager().changeOkState(curId,data,function(d) { return message;});
      },
        function (errorMessage) {
          new AskomicsJobsViewManager().changeKoState(curId,errorMessage);
      });

      /* position on job list view */
      $("#jobsview").trigger( "click" );
    }

    listJobs() {

      let template = AskOmics.templates.jobs;

      let context = {jobs: this.jobs };
      let html = template(context);

      $("#content_jobsview").empty();
      $("#content_jobsview").append(html);

      for ( let ij in this.jobs ) {
        if (this.jobs[ij].datable_preview !== undefined ) {
          let r = $("#results_table_"+ij);
          r.append(

            $("<h3></h3>").addClass("header-div")
                          .css("text-align","center")
                          .html("Preview ("+Math.min(this.npreview,this.jobs[ij].nr)+" rows)")
                        );

          r.append(this.jobs[ij].datable_preview);
        }
      }
    }
}
