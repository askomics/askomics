/*jshint esversion: 6 */

class AskomicsUser {

    constructor(username) {
        this.username = username ;
    }


    logUser() {
        // Show the loged_in buttons (integrate and admin)
        // $('#logeduser_buttons').show();

        // Show a logout button insted of a login button
        // ...

        // Show the name of the loged in user
        $('#navbar_title').empty();
        $('#navbar_title').append(this.username);
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
            }
        });
    }

    logout() {
        let service = new RestServiceJs('logout');

        displayModal('Please wait', '', 'Close');

        service.getAll(function() {
            hideModal();
        });
    }
}