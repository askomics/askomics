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
    return new Promise((resolve, reject) => {
      let service = new RestServiceJs('checkuser');
      service.getAll((user) => {
        if (user.username == "") {
          __ihm.displayNavbar(false, '');
          // redirect to login page
        }else{
          // there is a user logged
          this.username = user.username;
          this.admin = user.admin;
          this.blocked = user.blocked;
          this.galaxy = user.galaxy;
          __ihm.displayNavbar(true, this.username, this.admin, this.blocked);
          if (this.galaxy) {
            AskomicsGalaxyService.show();
          }
          AskomicsUser.cleanHtmlLogin();
          resolve();
        }
      });
    });
  }

  signup(username, email, password, password2, callback){

    let service = new RestServiceJs('signup');
    let model = {'username': username,
                 'email': email,
                 'password': password,
                 'password2': password2 };

    service.post(model, (data) => {
      if(data.error.length !== 0){
        this.error = data.error;
      }else{
        this.username = data.username;
        this.admin = data.admin;
        this.blocked = data.blocked;
        this.galaxy = data.galaxy;
      }
      callback(this);
    });

  }

  login(username_email, password, callback){

    let service = new RestServiceJs('login');
    let model = {
      'username_email': username_email,
      'password': password
    };
    service.post(model, (data) => {
      if (data.error.length !== 0) {
        this.error = data.error;
      }else{
        this.username = data.username;
        this.admin = data.admin;
        this.blocked = data.blocked;
        this.galaxy = data.galaxy;
      }
      callback(this);
    });
  }

  logout(callback){
    let service = new RestServiceJs('logout');
    service.getAll(() => {
      AskomicsUser.cleanHtmlLogin();
      __ihm.displayNavbar(false, '');
      callback(this);
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
      return (this.username != undefined) && (this.username != "");
  }
}