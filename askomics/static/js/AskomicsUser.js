/*jshint esversion: 6 */

class AskomicsUser {

    constructor(username) {
        this.username = username ;
    }


    logUser() {
        displayNavbar(true, this.username);
    }

    checkUser() {
        let service = new RestServiceJs("checkuser");
        let self = this;

        displayModal('Please wait', '', 'Close');

        service.getAll(function(data) {
            hideModal();
            if (data.username) {
                self.username = data.username;
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