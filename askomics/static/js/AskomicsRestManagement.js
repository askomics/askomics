function RestServiceJs(newurl) {
  if ( location.pathname.indexOf("http") > 0 ) {
    this.myurl = location.pathname + newurl;
  } else { // TEST MODE IF FILE PATH WE SEARCH FOR A LOCAL SERVER on 6543 port
    this.myurl = "http://localhost:6543/" + newurl;
  }

  this.post = function(model, callback) {
    $.ajax({
      type: 'POST',
      url: this.myurl,
      data: JSON.stringify(model), // '{"name":"' + model.name + '"}',
      dataType: 'json',
      processData: false,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) {alert('Request has failed.');},
      timeout:0
    });
  };

  this.postsync = function(model, callback) {
    $.ajax({
      async: false,
      type: 'POST',
      url: this.myurl,
      data: JSON.stringify(model), // '{"name":"' + model.name + '"}',
      dataType: 'json',
      processData: false,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) {alert('Request has failed.');},
      timeout:0
    });
  };

  this.update = function(model, callback) {
    $.ajax({
      type: 'PUT',
      url: this.myurl,
      data: JSON.stringify(model), // '{"name":"' + model.name + '"}',
      dataType: 'json',
      processData: false,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) {},
      timeout:0
    });
  };

  this.get = function(id, callback) {
    $.ajax({
      type: 'GET',
      url: this.myurl + '/' + id,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) {},
      timeout:0
    });
  };

  this.getsync = function(callback) {
    $.ajax({
      async: false,
      type: 'GET',
      url: this.myurl,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) {},
      timeout:0
    });
  };

  this.getAll = function(callback) {
    $.ajax({
      type: 'GET',
      url: this.myurl,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) {},
      timeout:0
    });
  };

  this.remove = function(id, callback) {
    $.ajax({
      type: 'DELETE',
      url: this.myurl + '/' + id,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) {},
      timeout:0
    });
  };

}
