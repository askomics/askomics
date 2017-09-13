/*jshint esversion: 6 */

class AskomicsUser {

    constructor(username, admin, blocked) {
        this.username = username===undefined?"":username ;
        this.admin    = admin===undefined?false:admin;
        this.blocked  = blocked===undefined?true:blocked;

        new AskomicsJobsViewManager().loadjob();
    }

    isAdmin() {
        return this.admin;
    }

    isBlocked() {
        return this.blocked;
    }

    logUser() {
        setTimeout(function() {
            location.reload();
        }, 1000);
    }

    checkUser() {
        let service = new RestServiceJs("checkuser");
        let self = this;

        service.getAll(function(data) {
            if (data.username) {
                self.username = data.username;
                self.admin = data.admin;
                self.blocked = data.blocked;
                __ihm.displayNavbar(true, self.username, self.admin, self.blocked);
            }else{
                __ihm.displayNavbar(false, '');
            }
        });
    }

    logout() {
        let service = new RestServiceJs('logout');
        service.getAll(function() {
            location.reload();
        });

    }
}
