/*jshint esversion: 6 */

class AskomicsUser {

    constructor(username, admin, blocked) {
        this.username = username===undefined?"":username ;
        this.admin    = admin===undefined?false:admin;
        this.blocked  = blocked===undefined?true:blocked;
        this.galaxy   = false ;

        /* check if a session is open */
        this.checkUser();


        /* set timeout to check if session is expired */
        if ( this.isLogin() ) {
          let user = this;
          this.intervalListener = setInterval(function(){
            user.checkUser();
          }, 15000);
        } else {
          if ( this.intervalListener != undefined ) {
            clearInterval(this.intervalListener);
          }
        }
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
        let service = new RestServiceJs("checkuser");
        let self = this;

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
            } else{
              AskomicsUser.cleanHtmlLogin();
              __ihm.displayNavbar(false, '');
              if (expired) {
                __ihm.displayModal('Session Expired', '', 'Close');
              }
              __ihm.start();
            }
          }
          // Show a galaxy dropdown if user have a galaxy connected

          if (self.haveGalaxy()) {
            console.log('user have galaxy');
            AskomicsGalaxyService.show();
          }
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
