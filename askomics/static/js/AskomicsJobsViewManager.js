/*jshint esversion: 6 */
let instanceAskomicsJobsViewManager ;

/* constructeur de AskomicsGraphBuilder */
  class AskomicsJobsViewManager {
    constructor() {
      /* Implement a Singleton */
      if ( instanceAskomicsJobsViewManager !== undefined ) {
          return instanceAskomicsJobsViewManager;
      }
      console.log("$$$$$$$$$$$$$ CONSTRUCTOR $$$$$$$$$$$$$$$$$$$$$$$");

      this.jobs = [];
      this.jobGenId=0;

      instanceAskomicsJobsViewManager = this;
    }

    createWaitState() {
      console.log("WAIT");

      let time = $.now();
      let curId = this.jobGenId++;

      /* Create Job in status wait */
      this.jobs.push({
          jobid    : curId ,
          user     : 'toto',
          state    : 'wait',
          start    : time,
          end      : '',
          duration : '',
          nr       : '' ,
          classtr  : 'bg-info' //bg-primary,bg-success,bg-warning,bg-danger,bg-info
      });
      new AskomicsJobsViewManager().listJobs();
      return curId;
    }

    changeOkState(id,ndata) {
      for ( let ij in this.jobs ) {
          if (this.jobs[ij].jobid === id) {
            this.jobs[ij].end = $.now() ;
            this.jobs[ij].state = "Ok";
            this.jobs[ij].nr    = ndata;
            this.jobs[ij].duration = JSON.stringify(this.jobs[ij].end - this.jobs[ij].start)+"ms" ;
            this.jobs[ij].classtr = "bg-success";
          }
      }
      new AskomicsJobsViewManager().listJobs();
    }

    changeKoState(id,messErr) {
      for ( let ij in this.jobs ) {
          if (this.jobs[ij].jobid === id) {
            this.jobs[ij].end = $.now() ;
            this.jobs[ij].state = messErr ;
            this.jobs[ij].duration = this.jobs.end - this.jobs.start ;
            this.jobs[ij].classtr = "bg-danger";
          }
      }
      new AskomicsJobsViewManager().listJobs();
    }

    createJob() {

      //create state view
      let curId = new AskomicsJobsViewManager().createWaitState();
      let service = new RestServiceJs("sparqlquery");
      let jdata = prepareQuery(false, false);
      service.post(jdata,function(data) {
        hideModal();
        if ('error' in data) {
          //alert(data.error);
          new AskomicsJobsViewManager().changeKoState(curId,data.error);
          return;
        }

        new AskomicsJobsViewManager().changeOkState(curId,data.values.length);

        //new AskomicsResultsView(data).displayResults();
        //resize graph if fullscreen
        //if ($('#icon-resize-graph').attr('value') == 'full') {
        //  forceLayoutManager.normalsizeGraph();
        //}
      });
      /* position on job list view */
      $("#jobsview").trigger( "click" );
    }

    listJobs() {

      let source = $('#template-admin-jobs').html();
      let template = Handlebars.compile(source);
/*
      let ljobs = [];

      ljobs[0] = {
        jobid    : '12233',
        user     : 'toto',
        state    : 'wait',
        start    : '12/12/12',
        end      : '14/12/223',
        duration : '122233',
        nr       : 10 ,
        classtr  : 'bg-success' //bg-primary,bg-success,bg-warning,bg-danger,bg-info
      };*/
      console.log("SIZE JOBSLIST="+this.jobs.length);
      let context = {jobs: this.jobs };
      let html = template(context);

      $("#content_jobsview").empty();
      $("#content_jobsview").append(html);
    }
}
