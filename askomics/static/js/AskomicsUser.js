/*jshint esversion: 6 */

class AskomicsUser {

    constructor(username, admin) {
        this.username = username ;
        this.admin = admin;
    }


    logUser() {
        displayNavbar(true, this.username, this.admin);
    }

    checkUser() {
        let service = new RestServiceJs("checkuser");
        let self = this;

        displayModal('Please wait', '', 'Close');

        service.getAll(function(data) {
            hideModal();
            if (data.username) {
                self.username = data.username;
                self.admin = data.admin;
                self.logUser();
            }else{
                displayNavbar(false, '');
            }
        });
    }

    logout() {
        let service = new RestServiceJs('logout');

        displayModal('Please wait', '', 'Close');

        service.getAll(function() {
            hideModal();
        });
        displayNavbar(false, '');
    }
}