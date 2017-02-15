/*jshint esversion: 6 */

class AskomicsUser {

    constructor(username, admin, blocked) {
        this.username = username===undefined?"":username ;
        this.admin    = admin===undefined?false:admin;
        this.blocked  = blocked===undefined?true:blocked;
    }

    isAdmin() {
        return this.admin;
    }

    isBlocked() {
        return this.blocked;
    }

    logUser() {
        // displayNavbar(true, this.username, this.admin, this.blocked);
        // location.reload();
        setTimeout(function() {
            // $('.container#content_login').hide();
            // $('.container#content_signup').hide();
            // $('.container#content_interrogation').show();
            location.reload();
        }, 1000);
    }

    checkUser() {
        let service = new RestServiceJs("checkuser");
        let self = this;

        // __ihm.displayModal('Please wait', '', 'Close');

        service.getAll(function(data) {
            // __ihm.hideModal();
            if (data.username) {
                self.username = data.username;
                self.admin = data.admin;
                self.blocked = data.blocked;
                // self.logUser();
                __ihm.displayNavbar(true, self.username, self.admin, self.blocked);
            }else{
                __ihm.displayNavbar(false, '');
            }
        });
    }

    logout() {
        let service = new RestServiceJs('logout');

        __ihm.displayModal('Please wait', '', 'Close');

        service.getAll(function() {
            location.reload();
        });

    }
}
