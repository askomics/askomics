import logging
# from pprint import pformat
# from string import Template

# from askomics.libaskomics.rdfdb.SparqlQuery import SparqlQuery
# from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder

class SparqlQueryAuth(SparqlQueryBuilder):
    """
    This class contain method to build a sparql query to
    extract data from the users graph
    """

    def __init__(self, settings, session):
        SparqlQueryBuilder.__init__(self, settings, session)
        self.log = logging.getLogger(__name__)


    def check_username_presence(self, username):
        """
        Check if a username is present in users graph
        """
        return self.build_query_for_users_graph({
            'select': '?status',
            'query': 'BIND(EXISTS {:' + username + ' rdf:type :user} AS ?status)'
        })

    def check_email_presence(self, email):
        """
        Check if an email is present in users graph
        """
        return self.build_query_for_users_graph({
            'select': '?status',
            'query': 'BIND(EXISTS {?uri :email \"' + email + '\"} AS ?status)'
        })

    def get_password_with_email(self, email):
        """
        Check the password of a user by his email
        """
        return self.build_query_for_users_graph({
            'select': '?salt ?shapw',
            'query': '?URIusername rdf:type :user .\n' +
                     '\t?URIusername rdf:type :user .\n' +
                     '\t?URIusername :email \"' + email + '\" .\n' +
                     '\t?URIusername :randomsalt ?salt .\n' +
                     '\t?URIusername :password ?shapw .'
        })

    def get_password_with_username(self, username):
        """
        Check the password of a user by his username
        """
        return self.build_query_for_users_graph({
            'select': '?salt ?shapw',
            'query': '?URIusername rdf:type :user .\n' +
                     '\t?URIusername rdf:type :user .\n' +
                     '\t?URIusername rdfs:label \"' + username + '\" .\n' +
                     '\t?URIusername :randomsalt ?salt .\n' +
                     '\t?URIusername :password ?shapw .'
        })

    def get_number_of_users(self):
        """
        Get the number of users
        """
        return self.build_query_for_users_graph({
            'select': '(count(*) AS ?count)',
            'query': '?s rdf:type :user .'
        })

    def get_admin_status_by_username(self, username):
        """
        get if a user is admin, by his username
        """
        return self.build_query_for_users_graph({
            'select': '?admin',
            'query': '?URIusername rdf:type :user .\n' +
                     '\t?URIusername rdfs:label \"' + username + '\" .\n' +
                     '\t?URIusername :isadmin ?admin .'
        })

    def get_admin_status_by_email(self, email):
        """
        get if a user is admin, by his email
        """
        return self.build_query_for_users_graph({
            'select': '?admin',
            'query': '?URIusername rdf:type :user .\n' +
                     '\t?URIusername :email \"' + email + '\" .\n' +
                     '\t?URIusername :isadmin ?admin .'
        })

    def get_users_infos(self):
        """
        Get users infos
        """
        return self.build_query_for_users_graph({
            'select': '?username ?email ?admin',
            'query': '?URIusername rdf:type :user .\n' +
                     '\t?URIusername rdfs:label ?username .\n' +
                     '\t?URIusername :email ?email .\n' +
                     '\t?URIusername :isadmin ?admin .'
        })
