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


class Security(ParamManager):
    """[summary]

    [description]
    """

    def __init__(self, settings, session, username, email, password, password2):
        ParamManager.__init__(self, settings, session)

        self.log = logging.getLogger(__name__)
        self.username = str(username)
        self.email = str(email)
        self.passwd = str(password)
        self.passwd2 = str(password2)
        self.admin = False
        self.blocked = True
        self.galaxy = False

        # concatenate askmics salt, password and random salt and hash it with sha512 function
        # see --"https://en.wikipedia.org/wiki/Salt_(cryptography)"-- for more info about salt
        alpabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        self.randomsalt = ''.join(random.choice(alpabet) for i in range(20))
        salted_pw = self.settings["askomics.salt"] + self.passwd + self.randomsalt
        self.sha256_pw = hashlib.sha512(salted_pw.encode('utf8')).hexdigest()

    def get_username(self):
        """get the username"""
        return self.username

    def get_sha256_pw(self):
        """Get the hashed-salted password

        :returns: the hashed-salted password
        :rtype: string
        """
        return self.sha256_pw

    def check_email(self):
        """
        Return true if email is a valid one
        """
        return validate_email(self.email)

    def check_passwords(self):
        """
        Return true if the 2 passwd are identical
        """
        return self.passwd == self.passwd2

    def check_password_length(self):
        """
        Return true if password have at least 8 char
        """
        return len(self.passwd) >= 1

    def check_username_in_database(self):
        """
        Check if the username is present in the DB
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT username FROM users
        WHERE username=?
        '''

        rows = database.execute_sql_query(query, (self.username, ))

        if len(rows) <= 0:
            return False
        return True

    def check_email_in_database(self):
        """
        Check if the email is present in the DB
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT email FROM users
        WHERE email=?
        '''

        rows = database.execute_sql_query(query, (self.email, ))

        if len(rows) <= 0:
            return False
        return True

    def set_username_by_email(self):
        """Get the username of a user by his email"""

        database = DatabaseConnector(self.settings, self.session)
        query='''
        SELECT username FROM users
        WHERE email=?
        '''

        rows = database.execute_sql_query(query, (self.email, ))

        self.username = rows[0][0]

    def check_email_password(self):
        """
        check if the password is the good password associate with the email
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT password, salt FROM users
        WHERE email=?
        '''
        rows = database.execute_sql_query(query, (self.email, ))

        if len(rows) <= 0:
            db_salt = ""
            db_shapw = ""
        else:
            db_salt = rows[0][1]
            db_shapw = rows[0][0]

        concat = self.settings["askomics.salt"] + self.passwd + db_salt
        shapw = hashlib.sha512(concat.encode('utf8')).hexdigest()

        return db_shapw == shapw

    def check_username_password(self):
        """
        check if the password is the good password associate with the username
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT password, salt FROM users
        WHERE username=?
        '''
        rows = database.execute_sql_query(query, (self.username, ))

        if len(rows) <= 0:
            db_salt = ""
            db_shapw = ""
        else:
            db_salt = rows[0][1]
            db_shapw = rows[0][0]

        concat = self.settings["askomics.salt"] + self.passwd + db_salt
        shapw = hashlib.sha512(concat.encode('utf8')).hexdigest()

        return db_shapw == shapw

    def get_owner_of_apikey(self, key):
        """Get the owner of an API kei

        [description]
        :param key: The API key
        :type key: string
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT username FROM users
        WHERE apikey=?
        '''

        rows = database.execute_sql_query(query, (key, ))

        if rows:
            self.username = rows[0][0]

    def ckeck_key_belong_user(self, key):
        """Check if a key belong to a user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT username FROM users
        WHERE apikey=?
        '''

        rows = database.execute_sql_query(query, (key, ))

        if rows:
            return True
        return False

    def renew_apikey(self):
        """renew apikey of user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        UPDATE users SET
        apikey=?
        WHERE username=?
        '''

        database.execute_sql_query(query, (self.get_random_string(20), self.username))


    @staticmethod
    def get_random_string(number):
        """return a random string of n character"""
        # self.log.debug('get_random_key')

        # alpabet = "!$%&()*+,-./:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~1234567890"
        alpabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        return ''.join(random.choice(alpabet) for i in range(number))


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

    def persist_user(self,host_url):
        """
        Persist all user infos in the TS
        """

        database = DatabaseConnector(self.settings, self.session)

        #check if user is the first. if yes, set him admin
        if self.get_number_of_users() == 0:
            admin = 'true'
            blocked = 'false'
            self.set_admin(True)
            self.set_blocked(False)
        else:
            admin = 'false'
            blocked = 'true'
            self.set_admin(False)
            self.set_blocked(False)

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
        database.execute_sql_query(query, (self.username, self.email, self.sha256_pw, self.randomsalt, self.get_random_string(20), admin, blocked))

        # Send a mail to all admins
        emails = self.get_admins_emails()
        body = 'Hello,\n'
        body += 'User \'' + self.username + '\' just created an account on Askomics.\n'
        body += 'Log into the admin interface in order to manage this user, or contact him '
        body += 'at ' + self.email + '.\n\n\n'
        body += host_url + '\n\n'

        self.send_mails(host_url, emails, '[AskOmics@'+ host_url + '] New account created', body)


    def create_user_graph(self):
        """
        Create a subgraph for the user. All his data will be inserted in this subgraph
        """

        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        ttl = '<' + self.settings['askomics.graph'] + ':' + self.username + \
            '> rdfg:subGraphOf <' + self.settings['askomics.graph'] + '>'

        header_ttl = sqa.header_sparql_config(ttl)
        query_laucher.insert_data(ttl, self.settings["askomics.graph"], header_ttl)

    def get_admins_emails(self):
        """
        Get all admins emails
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT email FROM users
        WHERE admin="true"
        '''

        rows = database.execute_sql_query(query)

        email_list = [email[0] for email in rows]

        return email_list

    def set_admin(self, admin):
        """
        set self.admin at True if user is an admin
        """
        self.admin = admin
        self.session['admin'] = admin

    def set_galaxy(self, galaxy):
        """
        set self.galaxy at True if user has a connected galaxy account
        """
        self.galaxy = galaxy
        self.session['galaxy'] = galaxy

    def set_blocked(self, blocked):
        """
        set self.blocked at True if user is a blocked
        """
        self.blocked = blocked
        self.session['blocked'] = blocked

    def get_admin_blocked_by_username(self):
        """
        get the admin status of the user by his username
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT admin, blocked
        FROM users
        WHERE username=?
        '''

        rows = database.execute_sql_query(query, (self.username, ))

        results = {}

        if len(rows) <= 0:
            results['blocked'] = True
            results['admin'] = False
        else:
            results['blocked'] = ParamManager.Bool(rows[0][1])
            results['admin'] = ParamManager.Bool(rows[0][0])

        return results

    def get_user_id_by_username(self):
        """get user id by is username"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT user_id
        FROM users
        WHERE username=?
        '''

        rows = database.execute_sql_query(query, (self.username, ))

        if len(rows) <= 0:
            return 0

        return rows[0][0]


    def get_admin_blocked_by_email(self):
        """
        get the admin status of the user by his username
        """
        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT admin, blocked
        FROM users
        WHERE email=?
        '''

        rows = database.execute_sql_query(query, (self.email, ))

        results = {}

        if len(rows) <= 0:
            results['blocked'] = True
            results['admin'] = False
        else:
            results['blocked'] = ParamManager.Bool(rows[0][1])
            results['admin'] = ParamManager.Bool(rows[0][0])

        return results

    def log_user(self, request):
        """
        log the user using pyramid's session
        """
        session = request.session
        session['username'] = self.username
        session['admin'] = self.admin
        session['blocked'] = self.blocked
        session['graph'] = self.settings['askomics.graph'] + ':' + self.username
        session['galaxy'] = self.galaxy

    def update_email(self):
        """
        change the mail of a user
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        UPDATE users SET
        email=?
        WHERE username=?
        '''

        database.execute_sql_query(query, (self.email, self.username))

    def update_passwd(self):
        """
        Change the password of a user, and his randomsalt
        """

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        UPDATE users SET
        password=?,
        salt=?
        WHERE username=?
        '''

        database.execute_sql_query(query, (self.sha256_pw, self.randomsalt, self.username))


    def add_galaxy(self, url, key):
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

        database.execute_sql_query(query, (self.get_user_id_by_username(), url, key))

    def get_galaxy_infos(self):
        """Get Galaxy url and apikey of a user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT url, apikey
        FROM galaxy_accounts
        WHERE user_id=?
        '''

        rows = database.execute_sql_query(query, (self.get_user_id_by_username(), ))

        if rows:
            return [rows[0][0], rows[0][1]]
        return []

    def check_galaxy(self):
        """Check if user have a galaxy account"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT *
        FROM galaxy_accounts
        WHERE user_id=?
        '''

        rows = database.execute_sql_query(query, (self.get_user_id_by_username(), ))

        if rows:
            return True
        return False

    def delete_galaxy(self):
        """Delete galaxy account for the user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        DELETE FROM galaxy_accounts
        WHERE user_id=?
        '''

        database.execute_sql_query(query, (self.get_user_id_by_username(), ))

    def get_users_infos(self):
        """get all about all user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT username, email, admin, blocked
        FROM users
        '''

        rows = database.execute_sql_query(query)
        results = []

        if rows:
            for elem in rows:
                user = {}
                user['username'] = elem[0]
                user['email'] = elem[1]
                user['admin'] = self.Bool(elem[2])
                user['blocked'] = self.Bool(elem[3])
                results.append(user)

            return results
        return []

    def get_user_infos(self):
        """get all about a user"""

        database = DatabaseConnector(self.settings, self.session)
        query = '''
        SELECT email, admin, blocked, apikey
        FROM users
        WHERE username=?
        '''

        rows = database.execute_sql_query(query, (self.username, ))
        galaxy_infos = self.get_galaxy_infos()

        if rows:
            return [[rows[0][0], self.Bool(rows[0][1]), self.Bool(rows[0][2]), rows[0][3]], galaxy_infos]
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
