import os
import unittest
import humanize
from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.LocalAuth import LocalAuth

from SetupTests import SetupTests
from interface_tps_db import InterfaceTpsDb

class LocalAuthTests(unittest.TestCase):

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

    def test_set_auth_type(self):

        local_auth = LocalAuth(self.settings, self.request.session)

        assert local_auth.auth_type == "local"

        local_auth.set_auth_type('ldap')

        assert local_auth.auth_type == "ldap"

    def test_get_galaxy_infos(self):

        self.tps.clean_up()
        self.tps.add_galaxy_account()

        local_auth = LocalAuth(self.settings, self.request.session)
        galaxy_infos = local_auth.get_galaxy_infos(1)

        assert galaxy_infos == {'url': 'http://locahost/galaxy', 'key': 'fake_api_key'}

    def test_get_user_infos(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()
        self.tps.add_jsmith_in_users()
        self.tps.add_galaxy_account()

        local_auth = LocalAuth(self.settings, self.request.session)

        user_infos_jdoe_username = local_auth.get_user_infos('jdoe')
        user_infos_jdoe_email = local_auth.get_user_infos('jdoe@example.com')
        user_infos_jsmith_username = local_auth.get_user_infos('jsmith')
        assert user_infos_jdoe_username == user_infos_jdoe_email
        assert user_infos_jdoe_username == {'id': 1, 'username': 'jdoe', 'email': 'jdoe@example.com', 'password': 'f49d76161eb1617568fedf0a0adc92532cc81c1a2626ec0e2d5fa36bd600f55b17f599a4a343a5ccdc907a2831db70c7a390a9f96afbf346190e6fe3d6ed836f', 'salt': '00000000000000000000', 'admin': False, 'blocked': False, 'apikey': 'jdoe_apikey', 'galaxy': {'url': 'http://locahost/galaxy', 'key': 'fake_api_key'}, 'auth_type': 'local'}
        assert user_infos_jsmith_username == {'id': 2, 'username': 'jsmith', 'email': 'jsmith@example.com', 'password': 'a23fb3f4b3f3448d98db675b1e3e1a5458a4a512c695aed4fbe33b538e8bea18199b96a1b114403013fcfe0d5e3efce65b70bee85be7c4582aeafbaba13cbf12', 'salt': '00000000000000000000', 'admin': False, 'blocked': False, 'apikey': 'jsmith_apikey', 'galaxy': None, 'auth_type': 'local'}

    def test_get_user_infos_api_key(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()
        self.tps.add_jsmith_in_users()
        self.tps.add_galaxy_account()

        local_auth = LocalAuth(self.settings, self.request.session)

        user_infos_jdoe = local_auth.get_user_infos_api_key('jdoe_apikey')
        user_infos_jsmith = local_auth.get_user_infos_api_key('jsmith_apikey')
        assert user_infos_jdoe == {'id': 1, 'username': 'jdoe', 'email': 'jdoe@example.com', 'password': 'f49d76161eb1617568fedf0a0adc92532cc81c1a2626ec0e2d5fa36bd600f55b17f599a4a343a5ccdc907a2831db70c7a390a9f96afbf346190e6fe3d6ed836f', 'salt': '00000000000000000000', 'admin': False, 'blocked': False, 'apikey': 'jdoe_apikey', 'galaxy': {'url': 'http://locahost/galaxy', 'key': 'fake_api_key'}, 'auth_type': 'local'}
        assert user_infos_jsmith == {'id': 2, 'username': 'jsmith', 'email': 'jsmith@example.com', 'password': 'a23fb3f4b3f3448d98db675b1e3e1a5458a4a512c695aed4fbe33b538e8bea18199b96a1b114403013fcfe0d5e3efce65b70bee85be7c4582aeafbaba13cbf12', 'salt': '00000000000000000000', 'admin': False, 'blocked': False, 'apikey': 'jsmith_apikey', 'galaxy': None, 'auth_type': 'local'}

    def test_is_username_in_db(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert local_auth.is_username_in_db('jdoe')
        assert not local_auth.is_username_in_db('jsmith')

    def test_is_email_in_db(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert local_auth.is_email_in_db('jdoe@example.com')
        assert not local_auth.is_email_in_db('jsmith@example.com')

    def test_is_user_in_db(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert local_auth.is_user_in_db('jdoe')
        assert local_auth.is_user_in_db('jdoe@example.com')
        assert not local_auth.is_user_in_db('jsmith')
        assert not local_auth.is_user_in_db('jsmith@example.com')

    def test_get_auth_type(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()
        self.tps.add_ldap_jdoe_user_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert local_auth.get_auth_type('jdoe') == 'local'
        assert local_auth.get_auth_type('ldap_jdoe') == 'ldap'

    def test_persist_user(self):

        self.tps.clean_up()

        local_auth = LocalAuth(self.settings, self.request.session)
        local_auth.persist_user('jdoe', 'jdoe@example.com', 'jdoe')
        local_auth.persist_user('jsmith', 'jsmith@example.com', 'jsmith')
        local_auth.set_auth_type('ldap')
        local_auth.persist_user('ldap_jdoe', 'ldap_jdoe@example.com')

        assert self.tps.test_row_presence('users', 'username, email, password', ('ldap_jdoe', 'ldap_jdoe@example.com', None))
        assert self.tps.test_row_presence('users', 'username, email', ('jdoe', 'jdoe@example.com'))
        assert self.tps.test_row_presence('users', 'username, email', ('jsmith', 'jsmith@example.com'))

    def test_get_number_of_users(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()
        self.tps.add_jsmith_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert local_auth.get_number_of_users() == 2

    def test_authenticate_user(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert local_auth.authenticate_user('jdoe', 'iamjohndoe')
        assert local_auth.authenticate_user('jdoe@example.com', 'iamjohndoe')
        assert not local_auth.authenticate_user('jsmith', 'iamjanesmith')
        assert not local_auth.authenticate_user('jsmith@example.com', 'iamjanesmith')

    def test_authenticate_user_with_username(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert local_auth.authenticate_user_with_username('jdoe', 'iamjohndoe')
        assert not local_auth.authenticate_user_with_username('jsmith', 'iamjanesmith')

    def test_authenticate_user_with_email(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert local_auth.authenticate_user_with_email('jdoe@example.com', 'iamjohndoe')
        assert not local_auth.authenticate_user_with_email('jsmith@example.com', 'iamjanesmith')

    def test_create_user_graph(self):

        local_auth = LocalAuth(self.settings, self.request.session)
        local_auth.create_user_graph('jdoe')

        assert self.tps.test_triple_presence('urn:sparql:test_askomics', '<urn:sparql:test_askomics:jdoe> rdfg:subGraphOf <urn:sparql:test_askomics>')
        assert not self.tps.test_triple_presence('urn:sparql:test_askomics', '<urn:sparql:test_askomics:jsmith> rdfg:subGraphOf <urn:sparql:test_askomics>')


    def test_renew_apikey(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert self.tps.test_row_presence('users', 'username, email, apikey', ('jdoe', 'jdoe@example.com', 'jdoe_apikey'))

        local_auth.renew_apikey('jdoe')

        assert not self.tps.test_row_presence('users', 'username, email, apikey', ('jdoe', 'jdoe@example.com', 'jdoe_apikey'))
        assert self.tps.test_row_presence('users', 'username, email', ('jdoe', 'jdoe@example.com'))

    def test_add_galaxy(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        galaxy_url = self.settings['askomics.testing_galaxy_url']
        galaxy_key = self.settings['askomics.testing_galaxy_key']

        local_auth = LocalAuth(self.settings, self.request.session)

        local_auth.add_galaxy(galaxy_url, galaxy_key, 1)

        assert self.tps.test_row_presence('galaxy_accounts', '*', (1, 1, galaxy_url, galaxy_key))

    def test_get_all_users_infos(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()
        self.tps.add_ldap_jdoe_user_in_users()
        self.tps.add_jsmith_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)
        all_users = local_auth.get_all_users_infos()

        # Get dir size
        path = self.settings['askomics.files_dir'] + '/jdoe'
        size = 0
        for dirpath, dirnames, filenames in os.walk(path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                size += os.path.getsize(fp)
        hsize = humanize.naturalsize(size)

        assert all_users == [{'ldap': False, 'username': 'jdoe', 'email': 'jdoe@example.com', 'admin': False, 'blocked': False, 'gurl': None, 'nquery': 0, 'nintegration': 0, 'dirsize': size, 'hdirsize': hsize}, {'ldap': False, 'username': 'jsmith', 'email': 'jsmith@example.com', 'admin': False, 'blocked': False, 'gurl': None, 'nquery': 0, 'nintegration': 0, 'dirsize': 0, 'hdirsize': '0 Bytes'}, {'ldap': True, 'username': 'ldap_jdoe', 'email': 'ldap_jdoe@example.com', 'admin': False, 'blocked': False, 'gurl': None, 'nquery': 0, 'nintegration': 0, 'dirsize': 0, 'hdirsize': '0 Bytes'}]

    def test_lock_user(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert self.tps.test_row_presence('users', 'username, admin, blocked', ('jdoe', 'false', 'false'))

        local_auth.lock_user('true', 'jdoe')

        assert self.tps.test_row_presence('users', 'username, admin, blocked', ('jdoe', 'false', 'true'))

    def test_admin_user(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert self.tps.test_row_presence('users', 'username, admin, blocked', ('jdoe', 'false', 'false'))

        local_auth.admin_user('true', 'jdoe')

        assert self.tps.test_row_presence('users', 'username, admin, blocked', ('jdoe', 'true', 'false'))

    def test_delete_user(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert self.tps.test_row_presence('users', 'username', ('jdoe', ))

        local_auth.delete_user('jdoe')

        assert not self.tps.test_row_presence('users', 'username', ('jdoe', ))

    def test_update_email(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert self.tps.test_row_presence('users', 'username, email', ('jdoe', 'jdoe@example.com'))

        local_auth.update_email('jdoe', 'newmail@example.com')

        assert self.tps.test_row_presence('users', 'username, email', ('jdoe', 'newmail@example.com'))

    def test_update_password(self):

        self.tps.clean_up()
        self.tps.add_jdoe_in_users()

        local_auth = LocalAuth(self.settings, self.request.session)

        assert self.tps.test_row_presence('users', 'username, password, salt', ('jdoe', 'f49d76161eb1617568fedf0a0adc92532cc81c1a2626ec0e2d5fa36bd600f55b17f599a4a343a5ccdc907a2831db70c7a390a9f96afbf346190e6fe3d6ed836f', '00000000000000000000'))

        local_auth.update_password('jdoe', 'newpass')

        assert not self.tps.test_row_presence('users', 'username, password, salt', ('jdoe', 'f49d76161eb1617568fedf0a0adc92532cc81c1a2626ec0e2d5fa36bd600f55b17f599a4a343a5ccdc907a2831db70c7a390a9f96afbf346190e6fe3d6ed836f', '00000000000000000000'))

    def test_get_random_string(self):

        local_auth = LocalAuth(self.settings, self.request.session)

        assert len(local_auth.get_random_string(20)) == 20