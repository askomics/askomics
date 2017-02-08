import logging, hashlib
from validate_email import validate_email
import random
import smtplib
import re

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
        self.passwd = str(password)
        self.passwd2 = str(password2)
        self.admin = False
        self.blocked = True

        # concatenate askmics salt, password and random salt and hash it with sha256 function
        # see --"https://en.wikipedia.org/wiki/Salt_(cryptography)"-- for more info about salt
        alpabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        self.randomsalt = ''.join(random.choice(alpabet) for i in range(20))
        salted_pw = self.settings["askomics.salt"] + self.passwd + self.randomsalt
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
        return bool(self.passwd == self.passwd2)

    def check_password_length(self):
        """
        Return true if password have at least 8 char
        """
        return bool(len(self.passwd) >= 1)

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

        concat = self.settings["askomics.salt"] + self.passwd + ts_salt
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

        concat = self.settings["askomics.salt"] + self.passwd + ts_salt
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
            blocked = 'false'
            self.set_admin(True)
            self.set_blocked(False)
        else:
            admin = 'false'
            blocked = 'true'
            self.set_admin(False)
            self.set_blocked(True)

        chunk = ':' + self.username + ' rdf:type foaf:Person ;\n'
        indent = len(self.username) * ' ' + ' '
        chunk += indent + 'foaf:name \"' + self.username + '\" ;\n'
        chunk += indent + ':password \"' + self.sha256_pw + '\" ;\n'
        chunk += indent + 'foaf:mbox <mailto:' + self.email + '> ;\n'
        chunk += indent + ':isadmin \"' + admin + '\"^^xsd:boolean ;\n'
        chunk += indent + ':isblocked \"' + blocked + '\"^^xsd:boolean ;\n'
        chunk += indent + ':randomsalt \"' + self.randomsalt + '\" .\n'

        header_ttl = sqa.header_sparql_config(chunk)
        query_laucher.insert_data(chunk, self.settings["askomics.users_graph"], header_ttl)

        emails = self.get_admins_emails()

        # Send a mail to all admins
        body = 'Hello, ' + self.username + ' just create an account.\n'
        body += 'Log into the admin interface in order to unblock this user, or contact him '
        body += 'at ' + self.email + '.\n\n\n'
        body += 'Cordialy, the AskOmics server'

        self.send_mails(emails, '[AskOmics] New account created', body)


    def send_mails(self, dests, subject, text):
        """
        Send a mail to a list of Recipients
        """

        # Don't send mail if the smtp server is not in
        # the config file
        if not self.get_param('smtp.host'):
            return


        sender = self.get_param('smtp.host')

        message = """
        From: %s
        To: %s
        Subject: %s

        %s
        """ % (sender, ", ".join(dests), subject, text)

        try:
            smtp = smtplib.SMTP('localhost')
            smtp.sendmail(sender, dests, message)
            self.log.debug("Successfully sent email")
        except Exception as e:
            self.log.debug("Error: unable to send email: " + str(e))


    def create_user_graph(self):
        """
        Create a subgraph for the user. All his data will be inserted in this subgraph
        """

        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        ttl = '<' + self.settings['askomics.graph'] + ':' + self.username + '> rdfg:subGraphOf <' + self.settings['askomics.graph'] + '>'

        header_ttl = sqa.header_sparql_config(ttl)
        query_laucher.insert_data(ttl, self.settings["askomics.graph"], header_ttl)

    def get_admins_emails(self):
        """
        Get all admins emails
        """
        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        result = query_laucher.process_query(sqa.get_admins_emails().query)

        email_list = []
        for dic in result:
            email_list.append(re.sub(r'^mailto:', '', dic['email']))

        return email_list

    def set_admin(self, admin):
        """
        set self.admin at True if user is an admin
        """
        self.admin = admin
        self.session['admin'] = admin

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
        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        result = query_laucher.process_query(sqa.get_admin_blocked_by_username(self.username).query)

        # if len(result) == 0 :
        #     admin = False
        #     blocked = True

        # if not ('admin' in result[0]) :
        #     admin = False

        # if not ('blocked' in result[0]) :
        #     blocked = True

        results = {}

        results['blocked'] = bool(int(result[0]['blocked']))
        results['admin'] = bool(int(result[0]['admin']))

        return results

    def get_admin_blocked_by_email(self):
        """
        get the admin status of the user by his username
        """
        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        result = query_laucher.process_query(sqa.get_admin_blocked_by_email(self.email).query)

        results = {}

        results['blocked'] = bool(int(result[0]['blocked']))
        results['admin'] = bool(int(result[0]['admin']))

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

    def print_sha256_pw(self):
        """
        Just print the hashed password
        """
        self.log.debug('------------------------ sha256 password -----------------------')
        self.log.debug(self.sha256_pw)
        self.log.debug('----------------------------------------------------------------')

    def update_email(self):
        """
        change the mail of a user
        """
        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        query_laucher.process_query(sqa.update_mail(self.username, self.email).query)

    def update_passwd(self):
        """
        Change the password of a user, and his randomsalt
        """
        query_laucher = QueryLauncher(self.settings, self.session)
        sqa = SparqlQueryAuth(self.settings, self.session)

        query_laucher.process_query(sqa.update_passwd(self.username, self.sha256_pw, self.randomsalt).query)
