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
      this.galaxy = false;

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

      this.listJobs();
      return curId;
    }

    changeOkState(id,data,preview_func) {
      function addZero(x, n) {
        while (x.toString().length < n) {
          x = "0" + x;
        }
        return x;
      }

      let time = $.now() ;

      for ( let ij in this.jobs ) {
          if (this.jobs[ij].jobid === id) {

            this.jobs[ij].tend = time ;

            let elp  = new Date(this.jobs[ij].tend - this.jobs[ij].tstart);
            //let h = addZero(elp.getHours(), 2);
            let m = addZero(elp.getMinutes(), 2);
            let s = addZero(elp.getSeconds(), 2);
            let ms = addZero(elp.getMilliseconds(), 3);

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
      this.listJobs();
    }

    changeKoState(id,messErr) {
      for ( let ij in this.jobs ) {
          if (this.jobs[ij].jobid === id) {
            this.jobs[ij].end = $.now() ;
            this.jobs[ij].wait  = false;
            this.jobs[ij].state = messErr ;
            this.jobs[ij].duration = this.jobs.end - this.jobs.start ;
            this.jobs[ij].classtr = "bg-danger";
          }
      }
      this.listJobs();
    }

    removeJob(index) {
      if ('csv' in this.jobs[index] ) {
        let service = new RestServiceJs('del_csv/');//location.href='del_csv/{{this.csv}}';
        service.get(this.jobs[index].csv);
      }
      this.jobs.splice(index, 1);
      this.listJobs();
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
      let curId = this.createWaitState();
      let service = new RestServiceJs("sparqlquery");
      let jdata = this.prepareQuery();
      let self = this;

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
          self.changeKoState(curId,data.error);
          return;
        }

        // Check if a galaxy is connected to display a button
        self.galaxy = data.galaxy;

        self.changeOkState(curId,data,function(d) {
          return new AskomicsResultsView(data).getPreviewResults(d) ;
        });
      });
      /* position on job list view */
      $("#jobsview").trigger( "click" );
    }

    send2galaxy(index) {
      let job = this.jobs[index];
      let galaxy_dataset_name = 'AskOmics_query_' + job.jobid + '_' + job.tstart + '.tsv';
      let file = job.csv;
      let service = new RestServiceJs('send_to_galaxy');
      let model = {'path': file, 'name': galaxy_dataset_name};
      $("#spinner_send_galaxy").removeClass('hidden');
      $("#check_send_galaxy").addClass('hidden');
      $("#cross_send_galaxy").addClass('hidden');
      service.post(model, function(data) {
        __ihm.manageErrorMessage(data);
        if (data.error) {
          $("#spinner_send_galaxy").addClass('hidden');
          $("#check_send_galaxy").addClass('hidden');
          $("#cross_send_galaxy").removeClass('hidden');
        }else{
          $("#spinner_send_galaxy").addClass('hidden');
          $("#check_send_galaxy").removeClass('hidden');
          $("#cross_send_galaxy").addClass('hidden');
        }
      });
    }

    createModuleJob(bool,urimo,name) {
      //create state view
      let curId = this.createWaitState();
      let service = new RestServiceJs("manage_module");

      let param = {
        'checked' : bool,
        'uri'     : urimo,
        'name'    : name
      } ;
      let self = this;
      service.post(param,function(data) {
        if ('error' in data) {
          //alert(data.error);
          self.changeKoState(curId,data.error);
          return;
        }

        self.changeOkState(curId,data,function(d) { return "<p>Import "+name+" is done !</p>";});
        new ModulesParametersView().updateModules();
      });
      /* position on job list view */
      $("#jobsview").trigger( "click" );
    }

    listJobs() {

      let template = AskOmics.templates.jobs;
      let context = {jobs: this.jobs, galaxy: this.galaxy};
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
