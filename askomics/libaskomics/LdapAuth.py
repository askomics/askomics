import logging
import ldap

from askomics.libaskomics.ParamManager import ParamManager

class LdapAuth(ParamManager):
    """[summary]

    [description]
    """

    def __init__(self, settings, session):
        ParamManager.__init__(self, settings, session)

        self.log = logging.getLogger(__name__)

        self.ldap_server = self.settings['askomics.ldap_host']
        self.ldap_port = self.settings['askomics.ldap_port']
        self.ldap_bind_dn = self.settings['askomics.ldap_bind_dn']
        self.ldap_bind_passwd = self.settings['askomics.ldap_bind_passwd']
        self.ldap_user_search_base = self.settings['askomics.ldap_user_search_base']
        self.ldap_user_filter = self.settings['askomics.ldap_user_filter']
        self.ldap_username_attr = self.settings['askomics.ldap_username_attr']
        self.ldap_email_attr = self.settings['askomics.ldap_email_attr']

        self.username = None
        self.password = None
        self.email = None

    def get_user(self, login):

        try:
            connect = ldap.initialize('ldap://' + self.ldap_server + ':' + self.ldap_port)
            connect.set_option(ldap.OPT_REFERRALS, 0)
            # connect.simple_bind_s(self.ldap_bind_dn , self.ldap_bind_passwd)
            search_filter=self.ldap_user_filter.replace('%s', login)
            ldap_user = connect.search_s(self.ldap_user_search_base, ldap.SCOPE_SUBTREE, search_filter, [self.ldap_username_attr, self.ldap_email_attr])
        except ldap.INVALID_CREDENTIALS as e:
            self.log.debug('Invalid ldap bind credentials')
            raise e
        except ldap.SERVER_DOWN as e:
            raise e
        
        if not ldap_user:
            return None

        return {
            'dn': ldap_user[0][0],
            'mail': ldap_user[0][1]['mail'][0].decode(),
            'username': ldap_user[0][1]['uid'][0].decode()
        }


    def authenticate_user(self, username, password):
        try:
            ldap_client = ldap.initialize('ldap://' + self.ldap_server + ':' + self.ldap_port)
            ldap_client.set_option(ldap.OPT_REFERRALS,0)
            ldap_user = self.get_user(username)
            if not ldap_user:
                self.log.debug("No user registered in ldap with " + username)
                return None
            user_dn = ldap_user['dn']
            ldap_client.simple_bind_s(user_dn, password)
        except ldap.INVALID_CREDENTIALS:
            self.log.debug('Wrong password for ldap user ' + username)
            ldap_client.unbind()
            return None
        except ldap.SERVER_DOWN as e:
            raise e
        ldap_client.unbind()
        return ldap_user

    def check_password(self, username, password):

        if self.authenticate_user(username, password):
            return True
        return False
