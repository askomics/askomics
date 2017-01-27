import logging, hashlib
from validate_email import validate_email
import random

from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.rdfdb.SparqlQueryAuth import SparqlQueryAuth
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher


class Security(ParamManager):
    """[summary]

    [description]
    """

    def __init__(self, settings, session, username, email, password, password2):
        ParamManager.__init__(self, settings, session)

        self.log = logging.getLogger(__name__)
        self.username = str(username)
        self.email = str(email)
        self.pw = str(password)
        self.pw2 = str(password2)
        self.admin = False

        # concatenate askmics salt, password and random salt and hash it with sha256 function
        # see --"https://en.wikipedia.org/wiki/Salt_(cryptography)"-- for more info about salt
        alpabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        self.randomsalt = ''.join(random.choice(alpabet) for i in range(20))
        salted_pw = self.settings["askomics.salt"] + password + self.randomsalt
        self.sha256_pw = hashlib.sha256(salted_pw.encode('utf8')).hexdigest()

    def check_email(self):
        """
        Return true if email is a valid one
        """
        return validate_email(self.email)

    def check_passwords(self):
        """
        Return true if the 2 passwd are identical
        """
        return bool(self.pw == self.pw2)

    def check_password_length(self):
        """
        Return true if password have at least 8 char
        """
        return bool(len(self.pw) >= 1)

    def check_username_in_database(self):
        """
        Check if the username is present in the TS
        """

        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        result = query_laucher.process_query(sqa.check_username_presence(self.username).query)
        self.log.debug('---> result: ' + str(result))

        return bool(int(result[0]['status']))

    def check_email_in_database(self):
        """
        Check if the email is present in the TS
        """

        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        result = query_laucher.process_query(sqa.check_email_presence(self.email).query)

        return bool(int(result[0]['status']))

    def check_email_password(self):
        """
        check if the password is the good password associate with the email
        """

        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        result = query_laucher.process_query(sqa.get_password_with_email(self.email).query)

        ts_salt = result[0]['salt']
        ts_shapw = result[0]['shapw']

        concat = self.settings["askomics.salt"] + self.pw + ts_salt
        shapw = hashlib.sha256(concat.encode('utf8')).hexdigest()

        return bool(int(ts_shapw == shapw))

    def check_username_password(self):
        """
        check if the password is the good password associate with the username
        """

        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        result = query_laucher.process_query(sqa.get_password_with_username(self.username).query)

        ts_salt = result[0]['salt']
        ts_shapw = result[0]['shapw']

        concat = self.settings["askomics.salt"] + self.pw + ts_salt
        shapw = hashlib.sha256(concat.encode('utf8')).hexdigest()

        return bool(int(ts_shapw == shapw))

    def get_number_of_users(self):
        """
        get the number of users in the TS
        """

        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        result = query_laucher.process_query(sqa.get_number_of_users().query)

        self.log.debug(result)

        return int(result[0]['count'])


    def persist_user(self):
        """
        Persist all user infos in the TS
        """
        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        #check if user is the first. if yes, set him admin
        if self.get_number_of_users() == 0:
            admin = 'true'
            self.set_admin(True)
        else:
            admin = 'false'
            self.set_admin(False)

        chunk = ':' + self.username + ' rdf:type foaf:Person ;\n'
        indent = len(self.username) * ' ' + ' '
        chunk += indent + 'foaf:name \"' + self.username + '\" ;\n'
        chunk += indent + ':password \"' + self.sha256_pw + '\" ;\n'
        chunk += indent + 'foaf:mbox <mailto:' + self.email + '> ;\n'
        chunk += indent + ':isadmin \"' + admin + '\"^^xsd:boolean ;\n'
        chunk += indent + ':randomsalt \"' + self.randomsalt + '\" .\n'

        header_ttl = sqa.header_sparql_config(chunk)
        query_laucher.insert_data(chunk, self.settings["askomics.users_graph"], header_ttl)

    def create_user_graph(self):
        """
        Create a subgraph for the user. All his data will be inserted in this subgraph
        """

        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        ttl = '<' + self.settings['askomics.private_graph'] + ':' + self.username + '> rdfg:subGraphOf <' + self.settings['askomics.private_graph'] + '>'

        header_ttl = sqa.header_sparql_config(ttl)
        query_laucher.insert_data(ttl, self.settings["askomics.private_graph"], header_ttl)

    def set_admin(self, admin):
        """
        set self.admin at True if user is an admin
        """
        self.admin = admin
        self.session['admin'] = admin

    def get_admin_status_by_username(self):
        """
        get the admin status of the user by his username
        """
        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        result = query_laucher.process_query(sqa.get_admin_status_by_username(self.username).query)

        if len(result) == 0 :
            return False

        if not ('admin' in result[0]) :
            return False

        return bool(int(result[0]['admin']))

    def get_admin_status_by_email(self):
        """
        get the admin status of the user by his username
        """
        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        result = query_laucher.process_query(sqa.get_admin_status_by_email(self.email).query)

        self.log.debug(result)

        self.log.debug('===> ADMIN:')
        self.log.debug(bool(int(result[0]['admin'])))

        return bool(int(result[0]['admin']))

    def log_user(self, request):
        """
        log the user using pyramid's session
        """
        session = request.session
        session['username'] = self.username
        session['admin'] = self.admin
        session['graph'] = self.settings['askomics.private_graph'] + ':' + self.username

    def print_sha256_pw(self):
        """
        Just print the hashed password
        """
        self.log.debug('------------------------ sha256 password -----------------------')
        self.log.debug(self.sha256_pw)
        self.log.debug('----------------------------------------------------------------')
