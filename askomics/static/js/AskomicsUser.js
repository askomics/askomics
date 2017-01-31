/*jshint esversion: 6 */

class AskomicsUser {

    constructor(username, admin, blocked) {
        this.username = username ;
        this.admin = admin;
        this.blocked = blocked;
    }


    logUser() {
        // displayNavbar(true, this.username, this.admin, this.blocked);
        location.reload();
        // setTimeout(function() {
        //     $('.container#content_login').hide();
        //     $('.container#content_signup').hide();
        //     $('.container#content_interrogation').show();
        // }, 1000);
    }

    checkUser() {
        let service = new RestServiceJs("checkuser");
        let self = this;

        // displayModal('Please wait', '', 'Close');

        service.getAll(function(data) {
            // hideModal();
            if (data.username) {
                self.username = data.username;
                self.admin = data.admin;
                self.blocked = data.blocked;
                // self.logUser();
                displayNavbar(true, self.username, self.admin, self.blocked);
            }else{
                displayNavbar(false, '');
            }
        });
    }

    logout() {
        let service = new RestServiceJs('logout');

        displayModal('Please wait', '', 'Close');

        service.getAll(function() {
            location.reload();
        });
    }
}
