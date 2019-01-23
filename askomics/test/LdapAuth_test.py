import unittest
from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.LdapAuth import LdapAuth

from SetupTests import SetupTests
from interface_tps_db import InterfaceTpsDb

class LdapAuthTests(unittest.TestCase):

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

    def test_get_user_test(self):

        ldap = LdapAuth(self.settings, self.request.session)

        user = ldap.get_user('jwick')

        assert user == {'dn': 'uid=jwick,ou=Users,dc=askotest,dc=org', 'mail': 'jwick@askotest.org', 'username': 'jwick'}

    def test_authenticate_user(self):

        ldap = LdapAuth(self.settings, self.request.session)

        auth_success = ldap.authenticate_user('jwick', 'iamjohnwick')
        auth_failure = ldap.authenticate_user('jwick', 'fakepassword')

        assert auth_success == {'dn': 'uid=jwick,ou=Users,dc=askotest,dc=org', 'mail': 'jwick@askotest.org', 'username': 'jwick'}
        assert auth_failure is None

    def test_check_password(self):

        ldap = LdapAuth(self.settings, self.request.session)

        auth_success = ldap.check_password('jwick', 'iamjohnwick')
        auth_failure = ldap.check_password('jwick', 'fakepassword')

        assert auth_success
        assert not auth_failure