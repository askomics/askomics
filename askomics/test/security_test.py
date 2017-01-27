import unittest
import os

from askomics.libaskomics.Security import Security

class SecurityTests(unittest.TestCase):
    def setUp( self ):
        self.settings = get_appsettings('configs/development.virtuoso.ini', name='main')
        self.request = testing.DummyRequest()
        self.request.session['username'] = 'jdoe'
        self.request.session['group']    = 'base'


    def tearDown( self ):
        shutil.rmtree( self.temp_directory )
