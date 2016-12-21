import logging, hashlib
from validate_email import validate_email
import random

from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
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

        ql = QueryLauncher(self.settings, self.session)
        sqb = SparqlQueryBuilder(self.settings, self.session)

        result = ql.process_query(sqb.check_username_presence(self.username).query)
        self.log.debug('---> result: ' + str(result))

        return bool(int(result[0]['status']))

    def check_email_in_database(self):
        """
        Check if the email is present in the TS
        """

        ql = QueryLauncher(self.settings, self.session)
        sqb = SparqlQueryBuilder(self.settings, self.session)

        result = ql.process_query(sqb.check_email_presence(self.email).query)

        return bool(int(result[0]['status']))

    def check_email_password(self):
        """
        check if the password is the good password associate with the email
        """

        ql = QueryLauncher(self.settings, self.session)
        sqb = SparqlQueryBuilder(self.settings, self.session)

        result = ql.process_query(sqb.get_password_with_email(self.email).query)

        ts_salt = result[0]['salt']
        ts_shapw = result[0]['shapw']

        concat = self.settings["askomics.salt"] + self.pw + ts_salt
        shapw = hashlib.sha256(concat.encode('utf8')).hexdigest()

        return bool(int(ts_shapw == shapw))

    def check_username_password(self):
        """
        check if the password is the good password associate with the username
        """

        ql = QueryLauncher(self.settings, self.session)
        sqb = SparqlQueryBuilder(self.settings, self.session)

        ql = QueryLauncher(self.settings, self.session)
        sqb = SparqlQueryBuilder(self.settings, self.session)

        result = ql.process_query(sqb.get_password_with_username(self.username).query)

        ts_salt = result[0]['salt']
        ts_shapw = result[0]['shapw']

        concat = self.settings["askomics.salt"] + self.pw + ts_salt
        shapw = hashlib.sha256(concat.encode('utf8')).hexdigest()

        return bool(int(ts_shapw == shapw))

    def persist_user(self):
        """
        Persist all user infos in the TS
        """
        ql = QueryLauncher(self.settings, self.session)
        sqb = SparqlQueryBuilder(self.settings, self.session)

        chunk = ':' + self.username + ' rdf:type :user ;\n'
        indent = len(self.username) * ' ' + ' '
        chunk += indent + 'rdfs:label \"' + self.username + '\" ;\n'
        chunk += indent + ':password \"' + self.sha256_pw + '\" ;\n'
        chunk += indent + ':email \"' + self.email + '\" ;\n'
        chunk += indent + ':isadmin \"false\"^^xsd:boolean ;\n'
        chunk += indent + ':randomsalt \"' + self.randomsalt + '\" .\n'

        header_ttl = sqb.header_sparql_config(chunk)
        ql.insert_data(chunk, self.settings["askomics.graph"], header_ttl)

    def log_user(self, request):
        """
        log the user using pyramid's session
        """
        session = request.session
        session['username'] = self.username
        session['admin'] = self.admin


    def print_sha256_pw(self):
        """
        Just print the hashed password
        """
        self.log.debug('------------------------ sha256 password -----------------------')
        self.log.debug(self.sha256_pw)
        self.log.debug('----------------------------------------------------------------')
