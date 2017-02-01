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
        return self.build_query_on_the_fly({
            'select': '?status',
            'query': "GRAPH <"+ self.get_param("askomics.users_graph") + "> {" +
                     'BIND(EXISTS {:' + username + ' rdf:type foaf:Person} AS ?status)' +
                     "}"
        }, True)

    def check_email_presence(self, email):
        """
        Check if an email is present in users graph
        """
        return self.build_query_on_the_fly({
            'select': '?status',
            'query': "GRAPH <"+ self.get_param("askomics.users_graph") + "> {" +
                     'BIND(EXISTS { ?uri foaf:mbox <mailto:' + email + '> } AS ?status)'+
                     "}"
        }, True)

    def get_password_with_email(self, email):
        """
        Check the password of a user by his email
        """
        return self.build_query_on_the_fly({
            'select': '?salt ?shapw',
            'query': "GRAPH <"+ self.get_param("askomics.users_graph") + "> {" +
                     '\t?URIusername rdf:type foaf:Person .\n' +
                     '\t?URIusername foaf:mbox <mailto:' + email + '> .\n' +
                     '\t?URIusername :randomsalt ?salt .\n' +
                     '\t?URIusername :password ?shapw .\n'+
                     "}"
        }, True)

    def get_password_with_username(self, username):
        """
        Check the password of a user by his username
        """
        return self.build_query_on_the_fly({
            'select': '?salt ?shapw',
            'query': "GRAPH <"+ self.get_param("askomics.users_graph") + "> {" +
                     '\t?URIusername rdf:type foaf:Person .\n' +
                     '\t?URIusername foaf:name \"' + username + '\" .\n' +
                     '\t?URIusername :randomsalt ?salt .\n' +
                     '\t?URIusername :password ?shapw .\n'+
                     "}"
        }, True)

    def get_number_of_users(self):
        """
        Get the number of users
        """
        return self.build_query_on_the_fly({
            'select': '(count(*) AS ?count)',
            'query': "GRAPH <"+ self.get_param("askomics.users_graph") + "> {" +
                     '?s rdf:type foaf:Person .\n'
                     "}"
        }, True)

    def get_admin_blocked_by_username(self, username):
        """
        get if a user is admin, by his username
        """
        return self.build_query_on_the_fly({
            'select': '?admin ?blocked',
            'query': "GRAPH <"+ self.get_param("askomics.users_graph") + "> {" +
                     '\t?URIusername rdf:type foaf:Person .\n' +
                     '\t?URIusername foaf:name \"' + username + '\" .\n' +
                     '\t?URIusername :isadmin ?admin .\n'+
                     '\t?URIusername :isblocked ?blocked .'
                     "}"
        }, True)

    def get_admin_blocked_by_email(self, email):
        """
        get if a user is admin, by his email
        """
        return self.build_query_on_the_fly({
            'select': '?admin ?blocked',
            'query': "GRAPH <"+ self.get_param("askomics.users_graph") + "> {" +
                     '\n?URIusername rdf:type foaf:Person .\n' +
                     '\t?URIusername foaf:mbox <mailto:' + email + '> .\n' +
                     '\t?URIusername :isadmin ?admin .\n'+
                     '\t?URIusername :isblocked ?blocked .'
                     "}"
        }, True)

    def get_users_infos(self):
        """
        Get users infos
        """
        return self.build_query_on_the_fly({
            'select': '?username ?email ?admin ?blocked',
            'query': "GRAPH <"+ self.get_param("askomics.users_graph") + "> {" +
                     '\t?URIusername rdf:type foaf:Person .\n' +
                     '\t?URIusername foaf:name ?username .\n' +
                     '\t?URIusername foaf:mbox ?email .\n' +
                     '\t?URIusername :isadmin ?admin .\n'+
                     '\t?URIusername :isblocked ?blocked .'
                     "}"
        }, True)

    def get_admins_emails(self):
        """
        Get emails of all admins
        """
        return self.build_query_on_the_fly({
            'select': '?email',
            'query': "GRAPH <"+ self.get_param("askomics.users_graph") + "> {" +
                     '\t?URIusername rdf:type foaf:Person .\n' +
                     '\t?URIusername foaf:mbox ?email .\n' +
                     '\t?URIusername :isadmin "true"^^xsd:boolean .\n'+
                     "}"
        }, True)
