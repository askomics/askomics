"""contain SecurityTests Class"""

import unittest
from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.Security import Security

from SetupTests import SetupTests
from interface_tps_db import InterfaceTpsDb

class SecurityTests(unittest.TestCase):
    """Test for the Security class"""

    def setUp(self):
        """Set up the settings and session"""

        self.settings = get_appsettings('configs/tests.ini', name='main')
        self.request = testing.DummyRequest()
        self.request.session['username'] = 'jdoe'
        self.request.session['group'] = 'base'
        self.request.session['admin'] = False
        self.request.session['blocked'] = True

        SetupTests(self.settings, self.request.session)

        self.tps = InterfaceTpsDb(self.settings, self.request)


    def test_get_sha256_pw(self):
        """Test get_sha256_pw"""

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')

        assert len(security.get_sha256_pw()) == 128 # We cant predict the string cause there is random for salt

    def test_check_email(self):
        """Test for check_email"""

        # Test if good mail return True
        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')
        assert security.check_email()

        # Test if wrong email return False
        security = Security(self.settings, self.request.session, 'jdoe', 'wrong_email', 'iamjohndoe', 'iamjohndoe')
        assert not security.check_email()

    def test_check_passwords(self):
        """Test for check_passwords"""

        # Test if identical passwords return True
        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')
        assert security.check_passwords()

        # Test if different passwords return False
        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'second_wrong_password')
        assert not security.check_passwords()


    def test_check_password_length(self):
        """Test for check_password_length"""

        # Test if long passwords return True
        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')
        assert security.check_password_length()

        # Test if short passwords return False
        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'a', 'a')
        # assert not security.check_password_length() #FIXME: not working because max lenght is 1



    def test_check_username_in_database(self):
        """test check_username_in_database

        Insert jdoe and test if jdoe is in database, then test
        jsmith is not in database
        """

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')

        # test with same username
        assert security.check_username_in_database()

        security = Security(self.settings, self.request.session, 'jsmith', 'jsmith@example.com', 'iamjohnsmith', 'iamjohnsmith')

        # test with a different username
        assert not security.check_username_in_database()


    def test_check_email_in_database(self):
        """test check_username_in_database

        Insert jdoe and test if jdoe is in database, then test
        jsmith is not in database
        """

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')

        # test with same username
        assert security.check_email_in_database()

        security = Security(self.settings, self.request.session, 'jsmith', 'jsmith@example.com', 'iamjohnsmith', 'iamjohnsmith')

        # test with a different username
        assert not security.check_email_in_database()


    def test_set_username_by_email(self):
        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')
        security.set_username_by_email()

    def test_get_owner_of_apikey(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')
        security.get_owner_of_apikey("test")

    def test_ckeck_key_belong_user(self):
        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')
        security.ckeck_key_belong_user("test")


    def test_check_email_password(self):
        """Test check_email_password

        Insert jdoe and check the password
        """

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')

        # try with the good password
        assert security.check_email_password()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'wrong_password', 'wrong_password')

        # Try with a wrong password
        assert not security.check_email_password()

    def test_check_username_password(self):
        """Test check_username_password

        Insert jdoe and check the password
        """

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')

        # try with the good password
        assert security.check_username_password()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'wrong_password', 'wrong_password')

        # Try with a wrong password
        assert not security.check_username_password()

    def test_get_number_of_users(self):
        """Test get_number_of_users

        test the method with 0, 1 and 2 users
        """

        self.tps.clean_up()

        security = Security(self.settings, self.request.session, '', '', '', '')

        assert security.get_number_of_users() == 0

        self.tps.add_jdoe_in_users()

        assert security.get_number_of_users() == 1

        self.tps.add_jsmith_in_users()

        assert security.get_number_of_users() == 2


    def test_persist_user(self):
        """Test persist_user

        Insert a user and test if get_number_of_user return 1
        """

        self.tps.clean_up()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')
        assert security.get_number_of_users() == 0
        security.persist_user('http://localhost')

        assert security.get_number_of_users() == 1
        #assert security.
        security = Security(self.settings, self.request.session, 'jdoe2', 'jdoe2@example.com', 'iamjohndoe', 'iamjohndoe')

        security.persist_user('http://localhost')

        assert security.get_number_of_users() == 2


    def test_send_mails(self):
        """Test send_mails"""

        #TODO: how to test mail ?
        pass

    def test_create_user_graph(self):
        """Test create_user_graph

        create the graph, and then test the presence of the triple
        """


        self.tps.clean_up()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')

        security.create_user_graph()

        assert self.tps.test_triple_presence('urn:sparql:test_askomics', '<urn:sparql:test_askomics:jdoe> rdfg:subGraphOf <urn:sparql:test_askomics>')
        assert not self.tps.test_triple_presence('urn:sparql:test_askomics', '<urn:sparql:test_askomics:jsmith> rdfg:subGraphOf <urn:sparql:test_askomics>')


    def test_get_admins_emails(self):
        """Test get_admins_emails

        Test the finction with nobody, 1, 2 non admin users, and with 1 and 2 admins users
        """

        self.tps.clean_up()

        security = Security(self.settings, self.request.session, '', '', '', '')

        assert security.get_admins_emails() == []

        self.tps.add_jdoe_in_users()

        assert security.get_admins_emails() == []

        self.tps.add_jsmith_in_users()

        assert security.get_admins_emails() == []

        self.tps.add_admin_in_users()

        assert security.get_admins_emails() == ['king@example.com']

        self.tps.add_another_admin_in_users()

        res_emails = security.get_admins_emails()

        assert len(res_emails) == 2
        assert 'king@example.com' in res_emails
        assert 'queen@example.com' in res_emails

    def test_set_admin(self):
        """Test set_admin"""


        self.tps.clean_up()

        security = Security(self.settings, self.request.session, 'jdoe', '', '', '')

        assert not self.request.session['admin']

        security.set_admin(True)

        assert self.request.session['admin']

    def test_set_galaxy(self):
        """Test set_admin"""


        self.tps.clean_up()

        security = Security(self.settings, self.request.session, 'jdoe', '', '', '')

        security.set_galaxy(True)

        assert self.request.session['galaxy']


    def test_set_blocked(self):
        """Test set_blocked"""


        self.tps.clean_up()

        security = Security(self.settings, self.request.session, 'jdoe', '', '', '')

        assert self.request.session['blocked']

        security.set_blocked(False)

        assert not self.request.session['blocked']


    def test_get_admin_blocked_by_usrnm(self):
        """Test get_admin_blocked_by_username"""

        self.tps.clean_up()

        self.tps.add_jdoe_in_users()
        self.tps.add_admin_in_users()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')

        assert security.get_admin_blocked_by_username() == {'blocked': False, 'admin': False}

        security = Security(self.settings, self.request.session, 'king', 'king@example.com', 'iamadmin', 'iamadmin')

        assert security.get_admin_blocked_by_username() == {'blocked': False, 'admin': True}

    def test_get_admin_blocked_by_email(self):
        """Test get_admin_blocked_by_email"""

        self.tps.clean_up()

        self.tps.add_jdoe_in_users()
        self.tps.add_admin_in_users()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'iamjohndoe', 'iamjohndoe')

        assert security.get_admin_blocked_by_email() == {'blocked': False, 'admin': False}

        security = Security(self.settings, self.request.session, 'king', 'king@example.com', 'iamadmin', 'iamadmin')

        assert security.get_admin_blocked_by_email() == {'blocked': False, 'admin': True}

    def test_log_user(self):
        """Test log_user"""

        self.tps.clean_up()


        security = Security(self.settings, self.request.session, 'testlog', 'testlog@example.com', 'testlog', 'testlog')

        security.log_user(self.request)

        assert self.request.session['username'] == 'testlog'
        assert not self.request.session['admin']
        assert self.request.session['blocked']
        assert self.request.session['graph'] == 'urn:sparql:test_askomics:testlog'


    def test_update_email(self):
        """Test update_mail"""

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        security = Security(self.settings, self.request.session, 'jdoe', 'newemail@example.com', 'iamjohndoe', 'iamjohndoe')

        security.update_email()

        assert self.tps.test_row_presence('users', 'email', ('newemail@example.com', ))
        assert not self.tps.test_row_presence('users', 'email', ('jdoe@example.com', ))


    def test_update_passwd(self):
        """Test update_mail"""

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        security = Security(self.settings, self.request.session, 'jdoe', 'jdoe@example.com', 'newpasswd', 'newpasswd')

        security.update_passwd()

        assert self.tps.test_row_presence('users', 'password', (security.get_sha256_pw(), ))
        assert not self.tps.test_row_presence('users', 'password', ('23df582b51c3482b677c8eac54872b8bd0a49bfadc853628b8b8bd4806147b54', ))
