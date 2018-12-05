#! /usr/bin/env python3

## AIMS  : Test the QueryLauncher classes.
## USAGE : python -m unittest  QueryLauncher_test.py
## NOTE  : ?

import unittest
import os.path

import sys
import pprint
PP = pprint.PrettyPrinter( indent=4, stream=sys.stderr )

from askomics.libaskomics.rdfdb.QueryLauncher import *

# ================================================
generic_query = "SELECT * WHERE { ?domain ?prop ?range } LIMIT 1"

# default attributes
d_attributes = {
                'name': None,
                'endpoint': None,
                'username': None,
                'password': None,
                'urlupdate': None,
                'auth': 'Basic',
                'allowUpdate': False,
               }

class QueryLauncherTests( unittest.TestCase ):
    """Test the QueryLauncher class."""
    def setUp( self ):
        #~ self._obj = QueryLauncher()
        self._d_generic_param = {
                'name'      : '',
                'endpoint'  : '',
                'username'  : '',
                'password'  : '',
                'url_update': '',
            }
    #~ def tearDown( self ):
        #~ pass

    def test_constructors_empty_conf( self ):
        o_ql = QueryLauncher( {},{} )
        d_expected = d_attributes
        self.__check_attributes( o_ql, d_expected, 'Empty conf' )

    def test_constructors_named_param( self ):
        d_params = {
                'name'      : 'Test',
                'endpoint'  : 'EP',
                'username'  : 'Toto',
                'password'  : 'Otot',
                'auth'      : 'Digest',
                'urlupdate': 'UP',
            }

        o_ql = QueryLauncher( {},{}, **d_params )
        d_expected = d_attributes
        d_expected.update(d_params)
        self.__check_attributes( o_ql, d_expected, 'Setting conf' )

    def __check_attributes( self, o_ql, d_expected, test_title ):
        d_attr = {}
        for attr in ( 'name', 'endpoint', 'username', 'password', \
                      'urlupdate', 'auth', 'allowUpdate' ):
            d_attr[attr] = o_ql.__dict__.get( attr, None )

        self.assertEqual( d_attr, d_expected, test_title )

    def test_test_endpoint__good_input( self ):
        #Here I test QL not specific to askomics.
        query = generic_query
        ep_uri = 'http://dbpedia.org/sparql'
        o_ql = QueryLauncher_( {},{}, endpoint=ep_uri )
        self.assertEquals( None, o_ql.test_endpoint() ) # not sure of the assertion to make.

    @unittest.skip("Problem detecting the URI is not an endpoint.")
    def test_test_endpoint__bad_input( self ):
        query = generic_query
        ep_uri = 'http://example.com/'
        o_ql = QueryLauncher_( {},{}, endpoint=ep_uri )
        self.assertRaises( NotEndpoint, o_ql.test_endpoint )

    def test_test_endpoint__wrong_input( self ):
        query = generic_query
        ep_uri = 'http://aqw.com/'
        o_ql = QueryLauncher_( {},{}, endpoint=ep_uri )
        self.assertRaises( NotEndpoint, o_ql.test_endpoint )
