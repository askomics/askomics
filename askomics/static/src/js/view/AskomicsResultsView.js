/*jshint esversion: 6 */

class AskomicsResultsView {
  constructor(data,variates) {
    this.data = data ;
    this.variates = variates ;

    //to put href attribute when uri
    this.colWithUri             = {};
    //uri by default is undisplayed
    this.colDisplay             = {};

    this.orderDisplay           = [] ;

    //detect node vs attribute
    for (let i=0;i<this.variates.length;i++) {
      let nameCol = this.variates[i].replace(/^\?/,"");

      if (this.variates[i].startsWith("?URI")) {
        let variable = this.variates[i].replace("?URI","");
        this.colWithUri[variable] = true ;
        this.colDisplay[nameCol] = false ;
      } else {
        this.colDisplay[nameCol] = true ;
      }
    }

    //check if node name is present otherwise URI is displayed.
    for (let v in this.colDisplay) {

      if ( this.colDisplay[v] ) continue;
      let namenode = v.replace(/^URI/,"");
      if ( ! (namenode in this.colDisplay) ) this.colDisplay[v] = true;
    }

    //order to display
    for (let v in this.colDisplay) {
      let idx = v.match(/\d+$/)[0];
      if (idx == undefined) throw "AskomicsResultsView :: Can not retrieve index Node of attribute/node:"+nameCol;
      if (! (idx in this.orderDisplay) ) this.orderDisplay[idx] = [];
      this.orderDisplay[idx].push(v);
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
    for (let headLabel in this.colDisplay ) {
      if ( ! this.colDisplay[headLabel] ) continue ;

        row.append($('<th></th>')
           .html(headLabel));
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
      for ( let j=0;j<=this.orderDisplay.length;j++) {
        if (! (j in this.orderDisplay) ) continue ;
        for ( let jname = 0 ; jname< this.orderDisplay[j].length; jname++ ) {
      //for (let headerName in this.colDisplay ) {
          let headerName = this.orderDisplay[j][jname];
          if (! this.colDisplay[headerName]) continue;
          let val = this.data[i][headerName];

          if ( headerName in this.colWithUri ) {
            let valWithPrefix = __ihm.getAbstraction().shortRDF(val);
            let url = this.data[i]["URI"+headerName];
            row.append($('<td></td>').html($('<a></a>').attr('href',url).attr('target','_blank').text(valWithPrefix)));
          } else {
            if ( val.startsWith("http://") ) {
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
