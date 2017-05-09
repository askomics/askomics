/*jshint esversion: 6 */

function RestServiceJs(newurl) {
//  if ( location.pathname.indexOf("http") > 0 ) {
  this.myurl = location.pathname + newurl;
  //} else { // TEST MODE IF FILE PATH WE SEARCH FOR A LOCAL SERVER on 6543 port
  //  this.myurl = "http://localhost:6543/" + newurl;
  //}

  this.error_management = function(req, status, ex) {
    let template = AskOmics.templates.error_message;
    let context = {
      message: ex
    };

    let html = template(context);
    $('body').append(html);
  };

  this.post = function(model, callback) {
    let mythis = this;
    $.ajax({
      type: 'POST',
      url: this.myurl,
      data: JSON.stringify(model), // '{"name":"' + model.name + '"}',
      dataType: 'json',
      processData: false,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) { mythis.error_management(req, status, ex); },
      timeout:0
    });
  };

  this.postsync = function(model, callback) {
    let mythis = this;
    $.ajax({
      async: false,
      type: 'POST',
      url: this.myurl,
      data: JSON.stringify(model), // '{"name":"' + model.name + '"}',
      dataType: 'json',
      processData: false,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) { mythis.error_management(req, status, ex); },
      timeout:0
    });
  };

  this.update = function(model, callback) {
    let mythis = this;
    $.ajax({
      type: 'PUT',
      url: this.myurl,
      data: JSON.stringify(model), // '{"name":"' + model.name + '"}',
      dataType: 'json',
      processData: false,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) { mythis.error_management(req, status, ex); },
      timeout:0
    });
  };

  this.get = function(id, callback) {
    let mythis = this;
    $.ajax({
      type: 'GET',
      url: this.myurl + '/' + id,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) { mythis.error_management(req, status, ex); },
      timeout:0
    });
  };

  this.getsync = function(callback) {
    let mythis = this;
    $.ajax({
      async: false,
      type: 'GET',
      url: this.myurl,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) { mythis.error_management(req, status, ex); },
      timeout:0
    });
  };

  this.getAll = function(callback) {
    let mythis = this;
    $.ajax({
      type: 'GET',
      url: this.myurl,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) { mythis.error_management(req, status, ex); },
      timeout:0
    });
  };

  this.remove = function(id, callback) {
    let mythis = this;
    $.ajax({
      type: 'DELETE',
      url: this.myurl + '/' + id,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) { mythis.error_management(req, status, ex); },
      timeout:0
    });
  };

}
