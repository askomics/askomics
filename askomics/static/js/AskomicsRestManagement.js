function RestServiceJs(newurl) {
  this.myurl = location.pathname + newurl;

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
