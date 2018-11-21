/*jshint esversion: 6 */

class AskomicsUser{

  constructor(){
    this.username = null;
    this.admin = null;
    this.blocked = null;
    this.galaxy = null;
    this.error = null;
  }

  checkUser(){
    let self = this;
    return new Promise(
    function(resolve, reject){
      let service = new RestServiceJs('checkuser');
      service.getAll(function(user){
        if (user.username == "") {
          __ihm.displayNavbar(false, '');
          // redirect to login page
        }else{
          // there is a user logged
          self.username = user.username;
          self.admin = user.admin;
          self.blocked = user.blocked;
          self.galaxy = user.galaxy;
          __ihm.displayNavbar(true, self.username, self.admin, self.blocked);
          if (self.galaxy) {
            AskomicsGalaxyService.show();
          }
          AskomicsUser.cleanHtmlLogin();
          resolve();
        }
      });
    });
  }

  signup(username, email, password, password2, callback){

    let self = this;

    let service = new RestServiceJs('signup');
    let model = {'username': username,
                 'email': email,
                 'password': password,
                 'password2': password2 };

    service.post(model, function(data){
      if(data.error.length !== 0){
        self.error = data.error;
      }else{
        self.username = data.username;
        self.admin = data.admin;
        self.blocked = data.blocked;
        self.galaxy = data.galaxy;
      }
      callback(self);
    });

  }

  login(username_email, password, callback){

    let self = this;

    let service = new RestServiceJs('login');
    let model = {
      'username_email': username_email,
      'password': password
    };
    service.post(model, function(data){
      if (data.error.length !== 0) {
        self.error = data.error;
      }else{
        self.username = data.username;
        self.admin = data.admin;
        self.blocked = data.blocked;
        self.galaxy = data.galaxy;
      }
      callback(self);
    });
  }

  logout(){
    let self = this;
    let service = new RestServiceJs('logout');
    service.getAll(function(){
      AskomicsUser.cleanHtmlLogin();
      __ihm.displayNavbar(false, '');
    });
  }

  static cleanHtmlLogin() {
    $('#login_error').hide();
    $('#spinner_login').addClass('hidden');
    $('#cross_login').addClass('hidden');
    $('#login_password').val('');
  }

  static errorHtmlLogin() {
    $('#login_error').show();
    $('#spinner_login').addClass('hidden');
    $('#cross_login').removeClass('hidden');
  }

  isLogin() {
      return (this.username != undefined)&&(this.username != "");
  }
}