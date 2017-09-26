/*jshint esversion: 6 */

/*
  Manage Menu View to select and unselect proposition of element/link
*/

let instanceAskomicsGalaxyService = undefined ;

class AskomicsGalaxyService {

  constructor ()
  {
    /* Implement a Singleton */
    if ( instanceAskomicsGalaxyService !== undefined ) {
        return instanceAskomicsGalaxyService;
    }

      instanceAskomicsGalaxyService = this;
  }

  static show() {
    $('.send2galaxy-li').removeClass('hidden');
  }

  static send2galaxy(index,jobid,tstart,csv) {
    console.log(" -- send2galaxy -- ");
    console.log("jobid:"+jobid);
    console.log("tstart:"+tstart);
    console.log("csv:"+csv);

    let galaxy_dataset_name = 'askomics_result' + jobid + '_' + tstart + '.tsv';
    let service = new RestServiceJs('send_to_galaxy');
    let model = {'path': csv, 'name': galaxy_dataset_name, 'type': 'tabular'};
    $("#spinner_send_galaxy_" + index).removeClass('hidden');
    $("#check_send_galaxy_" + index).addClass('hidden');
    $("#cross_send_galaxy_" + index).addClass('hidden');
    service.post(model, function(data) {
      __ihm.manageErrorMessage(data);
      if (data.error) {
        $("#spinner_send_galaxy_" + index).addClass('hidden');
        $("#check_send_galaxy_" + index).addClass('hidden');
        $("#cross_send_galaxy_" + index).removeClass('hidden');
      }else{
        $("#spinner_send_galaxy_" + index).addClass('hidden');
        $("#check_send_galaxy_" + index).removeClass('hidden');
        $("#cross_send_galaxy_" + index).addClass('hidden');
      }
    });
  }
}
