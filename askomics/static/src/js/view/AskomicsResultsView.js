/*jshint esversion: 6 */

class AskomicsResultsView {
  constructor(data,variates) {
    this.data = data ;
    this.variates = variates ;

    //to put href attribute when uri
    this.colWithUri             = {};
    //uri by default is undisplayed
    this.colDisplay             = {};

    //detect node vs attribute
    for (let entite in this.variates) {
      this.colDisplay[entite] = [];
      for (let i=0;i<this.variates[entite].length;i++) {
        let nameCol = this.variates[entite][i].replace(/^\?/,"");

        if (this.variates[entite][i].startsWith("?URI")) {
          let variable = this.variates[entite][i].replace("?URI","");
          this.colWithUri[variable] = true ;
          this.colDisplay[entite][nameCol] = false ;
        } else {
          this.colDisplay[entite][nameCol] = true ;
        }
      }
    }

    //check if node name is present otherwise URI is displayed.
    for (let entite in this.colDisplay) {
      for (let v in this.colDisplay[entite]) {
        if ( this.colDisplay[entite][v] ) continue;
        let namenode = v.replace(/^URI/,"");
        if ( ! (namenode in this.colDisplay[entite]) ) this.colDisplay[entite][v] = true;
      }
    }
  }

  is_valid() {
    if ( this.data === undefined ) throw "AskomicsResultsView :: data prototyperty in unset!";
  }

  getPreviewResults() {
    /* new presentation by entity */
    let table = $('<table></table>')
                  .addClass('table')
                  .addClass('table-striped')
                  .addClass('table-bordered')
                  .addClass('table-condensed')
                  .css("overflow","scroll")
                  .css("height","80px")
                  .css("width","100%")
                  .css("overflow-y","auto");

    table.append(this.build_simple_subheader_results())
         .append(this.build_body_results());

      return table;
  }

  build_simple_subheader_results() {

    this.is_valid();

    let head = $('<thead></thead>');
    let row = $('<tr></tr>');
    for (let entite in this.colDisplay ) {
      for (let headLabel in this.colDisplay[entite] ) {
        if ( ! this.colDisplay[entite][headLabel] ) continue ;
          row.append($('<th></th>')
           .html(headLabel));
      }
    }
    head.append(row);
    return head;
  }

  build_body_results() {

    this.is_valid();

    let body = $('<tbody></tbody')
                .css("overflow-y","auto")
                .css("height","100px");

    for (let i=0;i<this.data.length;i++ ) {
      let row = $('<tr></tr>');
      for (let entite in this.colDisplay ) {
        for (let headerName in this.colDisplay[entite] ) {
          if (! this.colDisplay[entite][headerName]) continue;
          let val = this.data[i][headerName];

          if ( headerName in this.colWithUri ) {
            let valWithPrefix = __ihm.getAbstraction().shortRDF(val);
            let url = this.data[i]["URI"+headerName];
            row.append($('<td></td>').html($('<a></a>').attr('href',url).attr('target','_blank').text(valWithPrefix)));
          } else {
            if (val === undefined) {
                row.append($('<td></td>').text(""));
            } else if ( val.startsWith("http://") ) {
              let valWithPrefix = __ihm.getAbstraction().shortRDF(val);
              row.append($('<td></td>').html($('<a></a>').attr('href',val).attr('target','_blank').text(valWithPrefix)));
            } else
              row.append($('<td></td>').text(val));
          }
        }
      }
      body.append(row);
    }
    return body;
  }

}
