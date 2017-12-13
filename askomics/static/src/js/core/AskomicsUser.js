/*jshint esversion: 6 */

window.onload = function() {
  if ( (sessionStorage.expired !== undefined ) && sessionStorage.expired == "true" ) {
    $("#login").click();
    sessionStorage.expired = "false" ;
  }
};

class AskomicsUser {

    constructor(username, admin, blocked) {
        this.username = username===undefined?"":username ;
        this.admin    = admin===undefined?false:admin;
        this.blocked  = blocked===undefined?true:blocked;
        this.galaxy   = false ;

        let user = this;

        /* check if a session is open */
        this.checkUser().then(
          function() {
            /* set timeout to check if session is expired */
            if ( user.isLogin() ) {
              user.intervalListener = setInterval(function(){
                user.checkUser();
              }, 30000);
              __ihm.displayNavbar(true, user.username, user.admin, user.blocked);
            } else {
              if ( user.intervalListener != undefined ) {
                clearInterval(user.intervalListener);
              }
              __ihm.displayNavbar(false, '');
            }
          })
          .catch (function () {} );
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

    logUser() {
        $('#interrogation').click();
    }

    checkUser() {

      let self = this;

      return new Promise(
        function(resolve,reject) {
          let service = new RestServiceJs("checkuser");

          service.getAll(function(data) {

            let expired = false;
            let change  = false;

            if ( (self.username != data.username) ||
                (self.admin != data.admin) ||
                (self.blocked != data.blocked) ||
                (self.galaxy != data.galaxy)) {
                  if ( self.username != "" && data.username == "") {
                    expired = true;
                    console.debug("session expired !");
                  }

                  self.username = data.username;
                  self.admin = data.admin;
                  self.blocked = data.blocked;
                  self.galaxy = data.galaxy;
                  change  = true;
                }

                if ( change ) {
                  if ((data.username != undefined) && (data.username != '') ) {

                    __ihm.displayNavbar(true, self.username, self.admin, self.blocked);
                  } else {
                    AskomicsUser.cleanHtmlLogin();
                    __ihm.displayNavbar(false, '');
                    if (expired) {
                      /* redirect to login page when user is disconnect */
                      sessionStorage.expired = "true" ;

                      __ihm.displayModal('Session Expired', '', 'Close').click(function() {
                        location.reload();
                      });
                    }
                  }
                }
                // Show a galaxy dropdown if user have a galaxy connected

                if (self.haveGalaxy()) {
                  AskomicsGalaxyService.show();
                }
                resolve();
              });
            });
    }

    logout() {
        let service = new RestServiceJs('logout');
        service.getAll(function() {
            location.reload();
        });

    }

    static cleanHtmlLogin() {
      $('#login_error').hide();
      $('#spinner_login').addClass('hidden');
      $('#tick_login').removeClass('hidden');
      $('#cross_login').addClass('hidden');
    }

    static errorHtmlLogin() {
      $('#login_error').show();
      $('#spinner_login').addClass('hidden');
      $('#tick_login').addClass('hidden');
      $('#cross_login').removeClass('hidden');
    }
}
