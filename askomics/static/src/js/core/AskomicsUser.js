/*jshint esversion: 6 */

class AskomicsUser{

  constructor(){
    this.username = null;
    this.admin = null;
    this.blocked = null;
    this.galaxy = null;

    this.checkUser();
  }

  checkUser(){
    console.log("---> checkUser");
    let self = this;
    return new Promise(
    function(resolve, reject){
      let service = new RestServiceJs('checkuser');
      service.getAll(function(user){
        if (user.username == "") {
          __ihm.displayNavbar(false, '');
          // redirect to login page
          $("#login").click();
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

  logout(){
    let self = this;
    let service = new RestServiceJs('logout');
    service.getAll();
    AskomicsUser.cleanHtmlLogin();
    __ihm.displayNavbar(false, '');
    $('#interrogation').click();
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

  isAdmin() {
      return this.admin;
  }

  isBlocked() {
      return this.blocked;
  }

  isLogin() {
      return (this.username != undefined)&&(this.username != "");
  }

  haveGalaxy() {
      return this.galaxy;
  }


}