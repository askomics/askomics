/*jshint esversion: 6 */

class AskomicsResultsView {
  constructor(data,variates) {

    this.data = data ;
    this.variates = variates ;
    //uri by default is undisplayed
    this.colDisplay             = {};

    //detect node vs attribute
    for (let entite in this.variates) {
      if (this.variates[entite].length>0) {
        this.colDisplay[entite] = {};
        for (let i=0;i<this.variates[entite].length;i++) {
          let nameCol = this.variates[entite][i].replace(/^\?/,"");
          this.colDisplay[entite][nameCol] = true ;
        }
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
      row.append($('<th></th>').attr("colspan", Object.keys(this.colDisplay[entite]).length).html(entite));
    }
    head.append(row);
    row = $('<tr></tr>');
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

  isValidURL(string) {
    let res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null);
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
          let val = this.data[i][headerName];

          if (val === undefined) {
              row.append($('<td></td>').text(""));
          } else if ( this.isValidURL(val) ) {
            let valWithPrefix = __ihm.getAbstraction().shortRDF(val);
            row.append($('<td></td>').html($('<a></a>').attr('href', val).attr('target','_blank').text(val.split('#')[1])));
          } else
            row.append($('<td></td>').text(val));
        }
      }
      body.append(row);
    }
    return body;
  }

}
