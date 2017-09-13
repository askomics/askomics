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
          tend     : '-1',
          duration : '',
          nr       : '-1' ,
          classtr  : 'bg-info', //bg-primary,bg-success,bg-warning,bg-danger,bg-info
          stateToReload : JSON.stringify(__ihm.getGraphBuilder().getInternalState()),
          datable_preview : ''
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

    getJob(id) {
      for ( let ij in this.jobs ) {
          if (this.jobs[ij].jobid === id) {
            return this.jobs[ij];
          }
      }
      return undefined ;
    }

    savejob(jobid) {
      let service = new RestServiceJs('savejob');

      let model = {
        jobid           : this.jobs[jobid].jobid,
        state           : this.jobs[jobid].state,
        start           : this.jobs[jobid].start,
        tstart          : this.jobs[jobid].tstart,
        end             : this.jobs[jobid].end,
        tend            : this.jobs[jobid].tend,
        nr              : this.jobs[jobid].nr,
        duration        : this.jobs[jobid].duration,
        classtr         : this.jobs[jobid].classtr,
        stateToReload   : JSON.stringify(this.jobs[jobid].stateToReload),
        datable_preview : $('<div></div>').append($(this.jobs[jobid].datable_preview)).html()
      };

      service.post(model, function(data) {
      });
    }

    loadjob() {

      let service = new RestServiceJs('listjob');

      let model = {};

      service.post(model, function(data) {
        let ljobs = new AskomicsJobsViewManager().jobs ;
        ljobs.splice(0,ljobs.length);

        for (let i in data ) {
          let job = {} ;
          job.jobid = data[i].jobid ;
          job.state = data[i].state ;
          job.start = data[i].start ;
          job.tstart = data[i].tstart ;
          job.end = data[i].end ;
          job.tend = data[i].tend ;
          job.nr = data[i].nr ;
          job.duration = data[i].duration ;
          job.classtr = data[i].classtr ;
          job.stateToReload = JSON.parse(data[i].stateToReload) ;
          job.datable_preview = $('<div></div>').html(data[i].datable_preview) ;

          let idx = 0;
          for (idx;idx<ljobs.length;idx++) {
            if ( job.jobid < ljobs[idx] ) break;
          }

          ljobs.splice(idx, 0, job);
        }
        let __inst = new AskomicsJobsViewManager() ;
        __inst.jobGenId=__inst.jobs.length;
        __inst.listJobs();
      });
    }

    deletejob(job) {
      let service = new RestServiceJs('deljob');

      let model = {
        jobid : job.jobid
      };

      service.post(model, function(data) {

      });
    }


    changeOkState(id,data,preview_func) {
      let job = this.getJob(id);
      let time = $.now() ;

      job.tend = time ;

      let elp  = new Date(job.tend - job.tstart);
      //let h = addZero(elp.getHours(), 2);
      let m = this.addZero(elp.getMinutes(), 2);
      let s = this.addZero(elp.getSeconds(), 2);
      let ms = this.addZero(elp.getMilliseconds(), 3);

      job.end   = new Date(time).toLocaleString();
      job.wait  = false;
      job.state = "Ok";
      if ( 'nrow' in data ) {
        job.nr    = data.nrow;
      }
      if ( 'file' in data ) {
          job.csv   = data.file;
      }
      job.duration = m + " m:" + s + " s:" + ms +" ms";
      job.classtr = "bg-success";
      job.datable_preview = preview_func() ; //new AskomicsResultsView(data).getPreviewResults();

      this.savejob(job.jobid);
      new AskomicsJobsViewManager().listJobs();
    }

    changeKoState(id,messErr) {
      let job = this.getJob(id);
      job.tend = $.now() ;
      job.wait  = false;
      job.end   = new Date(job.tend).toLocaleString();

      let elp  = new Date(job.tend - job.tstart);
      //let h = addZero(elp.getHours(), 2);
      let m = this.addZero(elp.getMinutes(), 2);
      let s = this.addZero(elp.getSeconds(), 2);
      let ms = this.addZero(elp.getMilliseconds(), 3);
      job.duration = m + " m:" + s + " s:" + ms +" ms";

      job.state = messErr ;
      job.classtr = "bg-danger";

      this.savejob(job.jobid);
      new AskomicsJobsViewManager().listJobs();

    }

    removeJob(index) {
      if ('csv' in this.jobs[index] ) {
        let service = new RestServiceJs('del_csv/');//location.href='del_csv/{{this.csv}}';
        service.get(this.jobs[index].csv);
      }
      this.deletejob(this.jobs[index]);
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
          return new AskomicsResultsView(data).getPreviewResults() ;
        });
      });

      let job = this.getJob(curId);
      this.savejob(job.jobid);
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

      let job = this.getJob(curId);
      this.savejob(job.jobid);

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
