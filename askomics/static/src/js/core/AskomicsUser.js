/*jshint esversion: 6 */

class AskomicsUser {

    constructor(username, admin, blocked) {
        this.username = username===undefined?"":username ;
        this.admin    = admin===undefined?false:admin;
        this.blocked  = blocked===undefined?true:blocked;

        /* navbar according if user is logged */
        if (this.username != "" ) {
           __ihm.displayNavbar(true, self.username, self.admin, self.blocked);
         } else {
           __ihm.displayNavbar(false, '');
         }
         /* load job user */
        new AskomicsJobsViewManager().loadjob();

        /* set timeout to chck if session is expired */
          if ( this.isLogin() ) {
            let user = this;
            setInterval(function(){
              user.checkUser();
          }, 15000);
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

    logUser() {
        $('#interrogation').click();
    }

    checkUser() {
        let service = new RestServiceJs("checkuser");
        let self = this;

        service.getAll(function(data) {
          let change = false;

          if ( (self.username != data.username)|| (self.admin != data.admin)| (self.blocked != data.blocked) ) {
                self.username = data.username;
                self.admin = data.admin;
                self.blocked = data.blocked;
                change = true;
          }
          if ((data.username != undefined) && (data.username != '') ) {
              if (change) __ihm.displayNavbar(true, self.username, self.admin, self.blocked);
          }else{
              if (change) {
                AskomicsUser.cleanHtmlLogin();
                __ihm.displayNavbar(false, '');
                 //location.reload();
                __ihm.displayModal('Session Expired', '', 'Close');

                __ihm.start();
               }
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
