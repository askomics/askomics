import logging
import random
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

    def get_owner_apikey(self, key):
        """Get the owner of the API key"""

        return self.build_query_on_the_fly({
            'select': '?username',
            'query': 'GRAPH <' + self.get_param('askomics.users_graph') + '> {' +
                     '\t?URIusername rdf:type foaf:Person .\n' +
                     '\t?URIusername :keyid ?keyid .\n' +
                     '\t?keyid :key "' + key + '" .\n' +
                     '\t?URIusername foaf:name ?username .\n' +
                     '}'
            }, True)

    def ckeck_key_belong_user(self, username, key):
        """Chek if a key belong to a user"""

        return self.build_query_on_the_fly({
            'select': '(COUNT(*) AS ?count)',
            'query': "GRAPH <"+ self.get_param("askomics.users_graph") + "> {" +
                     '\n?URIusername rdf:type foaf:Person .\n' +
                     '\t?URIusername foaf:name "' + username + '" .\n' +
                     '\t?URIusername :keyid ?URIkeyid .\n'+
                     '\t?URIkeyid :key "' + key + '"'
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

    def get_users_infos(self, username):
        """
        Get users infos exept me
        """
        return self.build_query_on_the_fly({
            'select': '?username ?email ?admin ?blocked',
            'query': "GRAPH <"+ self.get_param("askomics.users_graph") + "> {" +
                     '\t?URIusername rdf:type foaf:Person .\n' +
                     '\t?URIusername foaf:name ?username .\n' +
                     '\t?URIusername foaf:mbox ?email .\n' +
                     '\t?URIusername :isadmin ?admin .\n'+
                     '\t?URIusername :isblocked ?blocked .' +
                     '\tFILTER NOT EXISTS { ?URIusername foaf:name "' + username + '" . }\n' +
                     "}"
        }, True)

    def get_user_infos(self, username):
        """
        Get infos about one user
        """
        return self.build_query_on_the_fly({
            'select': '?email ?admin ?blocked ?keyname ?apikey',
            'query': "GRAPH <"+ self.get_param("askomics.users_graph") + "> {" +
                     '\t?URIusername rdf:type foaf:Person .\n' +
                     '\t?URIusername foaf:name "' + username + '" .\n' +
                     '\t?URIusername foaf:mbox ?email .\n' +
                     '\t?URIusername :isadmin ?admin .\n'+
                     '\t?URIusername :isblocked ?blocked .\n\n' +
                     '\tOPTIONAL {\n' +
                     '\t?URIusername :keyid ?URIkeyid .\n' +
                     '\t?URIkeyid rdfs:label ?keyname .\n' +
                     '\t?URIkeyid :key ?apikey .\n' +
                     '\t}\n' +
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

    def update_mail(self, username, email):
        """
        update the email of user
        """
        return self.prepare_query(
            """
            WITH GRAPH <""" + self.get_param('askomics.users_graph') + """>
            DELETE { :""" + username + """ foaf:mbox ?email }
            INSERT { :""" + username + """ foaf:mbox <mailto:""" + email + """> }
            WHERE { :""" + username + """ foaf:mbox ?email }
            """)

    def update_passwd(self, username, shapw, salt):
        """
        update the email of user
        """
        return self.prepare_query(
            """
            WITH GRAPH <""" + self.get_param('askomics.users_graph') + """>
            DELETE { :""" + username + """ :password ?passwd .
                     :""" + username + """ :randomsalt ?salt . }
            INSERT { :""" + username + """ :password \"""" + shapw + """\" .
                     :""" + username + """ :randomsalt \"""" + salt + """\" . }
            WHERE { :""" + username + """ :password ?passwd .
                    :""" + username + """ :randomsalt ?salt . }
            """)

    def add_apikey(self, username, keyname):
        """Insert a new api key"""

        key = self.get_random_key()
        keyid = keyname + '_' + key[:5]

        return self.prepare_query(
            """
            INSERT DATA {
                GRAPH <""" + self.get_param('askomics.users_graph') + """> {
                    :""" + username + """ :keyid :""" + keyid + """ .
                    :""" + keyid + """ rdf:type :apikey .
                    :""" + keyid + """ rdfs:label \"""" + keyname + """\" .
                    :""" + keyid + """ :key \"""" + key + """\" .
                }
            }
            """)

    @staticmethod
    def get_random_key():
        """return a random string of 10 character"""
        # self.log.debug('get_random_key')

        # alpabet = "!$%&()*+,-./:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~1234567890"
        alpabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123567890'
        return ''.join(random.choice(alpabet) for i in range(20))

    def delete_apikey(self, key):
        """
        Delet all info of a user
        """
        return self.prepare_query(
            """
            DELETE WHERE {
                GRAPH <"""+self.get_param('askomics.users_graph')+"""> {
                    ?URIusername :keyid ?URIkeyid .
                    ?URIkeyid :key \"""" + key + """\" .
                    ?URIkeyid rdf:type :apikey .
                    ?URIkeyid rdfs:label ?keyname .
                }
            }
            """)
