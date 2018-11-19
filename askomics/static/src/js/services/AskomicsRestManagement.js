/*jshint esversion: 6 */

function RestServiceJs(newurl) {
//  if ( location.pathname.indexOf("http") > 0 ) {
  this.myurl = location.pathname + newurl;
  //} else { // TEST MODE IF FILE PATH WE SEARCH FOR A LOCAL SERVER on 6543 port
  //  this.myurl = "http://localhost:6543/" + newurl;
  //}
  this.displayBlockedPage = function (username) {
    console.log('-+-+- displayBlockedPage -+-+-');
    $('#content_blocked').empty();
    let template = AskOmics.templates.blocked;
    let context = {name: username};
    let html = template(context);

    $('.container').hide();
    $('.container#navbar_content').show();
    $('#content_blocked').append(html).show();
    __ihm.hideModal();
  } ;

  this.showLoginForm = function () {
    __ihm.user.logout();
    $(".container:not(#navbar_content)").hide();
    $('#content_login').show();
    $('.nav li.active').removeClass('active');
    $("#login").addClass('active');
    __ihm.displayNavbar(false, '');
    __ihm.hideModal();
  } ;

  this.displayBadRequest = function () {
        $('.modal-sm').hide();
        $('#modal').modal('show');
        return $('#modal');
  } ;

  this.error_management = function(req, status, ex) {
    console.log("req:"+JSON.stringify(req));
    console.log("status:"+JSON.stringify(status));
    console.log("ex:"+JSON.stringify(ex));
    //https://fr.wikipedia.org/wiki/Liste_des_codes_HTTP

    $('#error_div').remove();

    if ( ex == 'Locked' ) {
      this.displayBlockedPage(__ihm.user.username);
      return;
    }
    if ( ex == 'Unauthorized' ) {
      console.log('show login form');
      this.showLoginForm('');
      // $("#login").click();
      return;
    }
    if ( ex == 'Forbidden' ) {
      __ihm.hideModal();
      let template = AskOmics.templates.error_message;
      let context = { message: 'Forbidden' };
      let html = template(context);
      this.displayBadRequest().append(html);
      return;
    }
    if ( ex == 'Bad Request' ) {
      let template = AskOmics.templates.error_message;
      let context = { message: req.responseJSON.error };
      let html = template(context);
      this.displayBadRequest().append(html);
      return;
    }

    /* This kind of exception is not catched by Askomics */
    if ( ex == "Internal Server Error") {
      $('body').html(req.responseText);
      return ;
    }

    let context = {
      message:ex
    };
    let template = AskOmics.templates.error_message;
    let html = template(context);
    $('body').append(html);
    __ihm.hideModal();

  };

  this.post = function(model, callback) {
    let mythis = this;
    return $.ajax({
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
    return $.ajax({
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
    return $.ajax({
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
    return $.ajax({
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
    return $.ajax({
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
    return $.ajax({
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
    return $.ajax({
      type: 'DELETE',
      url: this.myurl + '/' + id,
      contentType: 'application/json',
      success: callback,
      error: function(req, status, ex) { mythis.error_management(req, status, ex); },
      timeout:0
    });
  };

}
