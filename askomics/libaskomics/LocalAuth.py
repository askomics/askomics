import logging
import hashlib
import random
import re
from validate_email import validate_email
from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.rdfdb.SparqlQueryAuth import SparqlQueryAuth
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.GalaxyConnector import GalaxyConnector
from askomics.libaskomics.DatabaseConnector import DatabaseConnector

from validate_email import validate_email
import humanize

class LocalAuth(ParamManager):
    """[summary]

    [description]
    """

    def __init__(self, settings, session, auth_type='local'):
        ParamManager.__init__(self, settings, session)

        self.log = logging.getLogger(__name__)

        self.auth_type = auth_type

    def set_auth_type(self, auth_type):
        self.auth_type = auth_type


    def get_galaxy_infos(self, user_id):
        """Get Galaxy url and apikey of a user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT url, apikey
        FROM galaxy_accounts
        WHERE user_id=?
        '''

        rows = database.execute_sql_query(query, (user_id, ))

        if rows:
            return {'url': rows[0][0], 'key': rows[0][1]}
        return {}

    def get_user_infos(self, login):
        """get all about a user"""

        login_type = 'username'
        if validate_email(login):
            login_type = 'email'

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT user_id, username, email, password, salt, admin, blocked, apikey
        FROM users
        WHERE {}=?
        '''.format(login_type)

        rows = database.execute_sql_query(query, (login, ))

        if rows:
            galaxy_infos = self.get_galaxy_infos(rows[0][0])
            auth_type = 'local'
            if rows[0][3] is None:
                auth_type = 'ldap'
            return {
                'id': rows[0][0],
                'username': rows[0][1],
                'email': rows[0][2],
                'password': rows[0][3],
                'salt': rows[0][4],
                'admin': self.Bool(rows[0][5]),
                'blocked': self.Bool(rows[0][6]),
                'apikey': rows[0][7],
                'galaxy': galaxy_infos,
                'auth_type': auth_type
            }

        self.log.debug('No user registered in local database with ' + login)
        return None

    def get_user_infos_api_key(self, apikey):
        """get all about a user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT user_id, username, email, password, salt, admin, blocked, apikey
        FROM users
        WHERE apikey=?
        '''

        rows = database.execute_sql_query(query, (apikey, ))

        if rows:
            galaxy_infos = self.get_galaxy_infos(rows[0][0])
            auth_type = 'local'
            if rows[0][3] is None:
                auth_type = 'ldap'
            return {
                'id': rows[0][0],
                'username': rows[0][1],
                'email': rows[0][2],
                'password': rows[0][3],
                'salt': rows[0][4],
                'admin': self.Bool(rows[0][5]),
                'blocked': self.Bool(rows[0][6]),
                'apikey': rows[0][7],
                'galaxy': galaxy_infos,
                'auth_type': auth_type
            }

        self.log.debug('No user registered in local database with this apikey')
        return None


    def is_username_in_db(self, username):
        """
        Check if the username is present in the DB
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT username, password FROM users
        WHERE username=?
        '''

        rows = database.execute_sql_query(query, (username, ))

        if len(rows) <= 0:
            return False
        return True

    def is_email_in_db(self, email):
        """
        Check if the email is present in the DB
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT email FROM users
        WHERE email=?
        '''

        rows = database.execute_sql_query(query, (email, ))

        if len(rows) <= 0:
            return False
        return True


    def is_user_in_db(self, login):

        if validate_email(login):
            return self.is_email_in_db(login)
        return self.is_username_in_db(login)

    def get_auth_type(self, login):

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT COUNT(*)
        FROM users
        WHERE password IS NULL and username=?
        '''

        result = database.execute_sql_query(query, (self.username, ))

        if result[0][0] == 1:
            return 'ldap'
        return 'local'
        # [(1,)]



    def persist_user(self, username, email, password=None):
        """
        Persist all user infos in the TS
        """

        database = DatabaseConnector(self.settings, self.session)

        #check if user is the first. if yes, set him admin
        if self.get_number_of_users() == 0:
            admin = 'true'
            blocked = 'false'

        else:
            admin = 'false'
            blocked = self.settings['askomics.locked_account']

        api_key = self.get_random_string(20)

        query = '''
        INSERT INTO users VALUES(
            NULL,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
        '''

        if self.auth_type == 'local' and password is not None:
            # Create a salt
            salt = self.get_random_string(20)
            # Concat askomics_salt + user_password + salt
            salted_pw = self.settings['askomics.salt'] + password + salt
            # hash
            sha512_pw = hashlib.sha512(salted_pw.encode('utf8')).hexdigest()
            # Store in db
        elif self.auth_type == 'ldap':
            salt = None
            sha512_pw = None

        # Store user in db
        user_id = database.execute_sql_query(query, (username, email, sha512_pw, salt, api_key, admin, blocked))
        # Return user infos
        return {
            'id': user_id,
            'username': username,
            'email': email,
            'password': sha512_pw,
            'salt': salt,
            'admin': self.Bool(admin),
            'blocked': self.Bool(blocked),
            'apikey': api_key,
            'galaxy': {},
            'auth_type': self.auth_type
        }

    def get_number_of_users(self):
        """
        get the number of users in the TS
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT COUNT(*)
        FROM users
        '''

        rows = database.execute_sql_query(query)

        return rows[0][0]

    def authenticate_user(self, login, password):

        if validate_email(login):
            return self.authenticate_user_with_email(login, password)
        return self.authenticate_user_with_username(login, password)


    def authenticate_user_with_email(self, email, password):
        """
        check if the password is the good password associate with the email
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT password, salt FROM users
        WHERE email=?
        '''
        rows = database.execute_sql_query(query, (email, ))

        if len(rows) <= 0:
            db_salt = ""
            db_shapw = ""
        else:
            db_salt = rows[0][1]
            db_shapw = rows[0][0]

        concat = self.settings["askomics.salt"] + password + db_salt
        if len(db_shapw) == 64:
            # Use sha256 (old askomics database use sha256)
            shapw = hashlib.sha256(concat.encode('utf8')).hexdigest()
        else:
            # Use sha512
            shapw = hashlib.sha512(concat.encode('utf8')).hexdigest()

        if db_shapw == shapw:
            return True
        self.log.debug('Wrong password for ' + email)
        return False

    def authenticate_user_with_username(self, username, password):
        """
        check if the password is the good password associate with the username
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT password, salt FROM users
        WHERE username=?
        '''
        rows = database.execute_sql_query(query, (username, ))

        if len(rows) <= 0:
            db_salt = ""
            db_shapw = ""
        else:
            db_salt = rows[0][1]
            db_shapw = rows[0][0]

        concat = self.settings["askomics.salt"] + password + db_salt
        if len(db_shapw) == 64:
            # Use sha256 (old askomics database use sha256)
            shapw = hashlib.sha256(concat.encode('utf8')).hexdigest()
        else:
            # Use sha512
            shapw = hashlib.sha512(concat.encode('utf8')).hexdigest()

        if db_shapw == shapw:
            return True
        self.log.debug('Wrong password for local user ' + username)
        return False

    def create_user_graph(self, username):
        """
        Create a subgraph for the user. All his data will be inserted in this subgraph
        """

        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        ttl = '<' + self.settings['askomics.graph'] + ':' + username + \
            '> rdfg:subGraphOf <' + self.settings['askomics.graph'] + '>'

        header_ttl = sqa.header_sparql_config(ttl)
        query_laucher.insert_data(ttl, self.settings["askomics.graph"], header_ttl)

    def renew_apikey(self, username):
        """renew apikey of user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        UPDATE users SET
        apikey=?
        WHERE username=?
        '''

        database.execute_sql_query(query, (self.get_random_string(20), username))


    def delete_galaxy(self, user_id):
        """Delete galaxy account for the user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        DELETE FROM galaxy_accounts
        WHERE user_id=?
        '''

        database.execute_sql_query(query, (user_id, ))

    def add_galaxy(self, url, key, user_id):
        """Connect a galaxy account to Askomics

        add triples for the url of galaxy, and the user api key

        :param self; url: the galaxy url
        :type self; url: string
        :param key: the galaxy user api key
        :type key: string
        """

        # try to connect to the galaxy server
        galaxy = GalaxyConnector(self.settings, self.session, url, key)
        try:
            galaxy.check_galaxy_instance()
        except Exception as e:
            raise e

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        INSERT INTO galaxy_accounts VALUES(
            NULL,
            ?,
            ?,
            ?
        )
        '''

        database.execute_sql_query(query, (user_id, url, key))

    def get_all_users_infos(self):
        """get all about all user"""

        database = DatabaseConnector(self.settings, self.session)

        query = '''
        SELECT u.username, u.email, u.password, u.admin, u.blocked, g.url, COUNT(distinct q.id) AS nquery, COUNT(distinct i.id) AS nintegration
        FROM users u
        LEFT JOIN galaxy_accounts g ON u.user_id=g.user_id
        LEFT JOIN query q ON u.user_id=q.user_id
        LEFT JOIN integration i ON u.user_id=i.user_id
        GROUP BY u.username, u.email, u.admin, u.blocked
        '''

        rows = database.execute_sql_query(query)
        results = []

        if rows:
            for elem in rows:
                dir_size = self.get_size(self.get_user_dir_path(elem[0]))
                user = {}
                user['ldap'] = True if elem[2] is None else False
                user['username'] = elem[0]
                user['email'] = elem[1]
                user['admin'] = self.Bool(elem[3])
                user['blocked'] = self.Bool(elem[4])
                user['gurl'] = elem[5] if elem[5] else None
                user['nquery'] = elem[6]
                user['nintegration'] = elem[7]
                user['dirsize'] = dir_size
                user['hdirsize'] = humanize.naturalsize(dir_size)
                results.append(user)

            return results
        return []

    def lock_user(self, new_status, username):
        """lock a user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        UPDATE users SET
        blocked=?
        WHERE username=?
        '''

        database.execute_sql_query(query, (new_status, username))

    def admin_user(self, new_status, username):
        """adminify a user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        UPDATE users SET
        admin=?
        WHERE username=?
        '''

        database.execute_sql_query(query, (new_status, username))

    def delete_user(self, username):
        """delete a user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        DELETE FROM users
        WHERE username=?
        '''

        database.execute_sql_query(query, (username, ))

    def update_email(self, username, new_email):
        """
        change the mail of a user
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        UPDATE users SET
        email=?
        WHERE username=?
        '''

        database.execute_sql_query(query, (new_email, username))

    def update_password(self, username, password):
        """
        Change the password of a user, and his randomsalt
        """

        # Create a salt
        salt = self.get_random_string(20)
        # Concat askomics_salt + user_password + salt
        salted_pw = self.settings['askomics.salt'] + password + salt
        # hash
        sha512_pw = hashlib.sha512(salted_pw.encode('utf8')).hexdigest()


        database = DatabaseConnector(self.settings, self.session)
        query = '''
        UPDATE users SET
        password=?,
        salt=?
        WHERE username=?
        '''

        database.execute_sql_query(query, (sha512_pw, salt, username))

    def get_galaxy_infos(self, user_id):
        """Get Galaxy url and apikey of a user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT url, apikey
        FROM galaxy_accounts
        WHERE user_id=?
        '''

        rows = database.execute_sql_query(query, (user_id, ))

        if rows:
            return {'url': rows[0][0], 'key': rows[0][1]}
        return {}

    @staticmethod
    def get_random_string(number):
        """return a random string of n character"""
        # self.log.debug('get_random_key')

        # alpabet = "!$%&()*+,-./:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~1234567890"
        alpabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        return ''.join(random.choice(alpabet) for i in range(number))