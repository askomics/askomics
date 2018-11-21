# import unittest
# import os
# import re
# import tempfile, shutil

# from pyramid import testing
# from pyramid.paster import get_appsettings
# from askomics.libaskomics.SourceFileConvertor import SourceFileConvertor

# from interface_tps_db import InterfaceTpsDb

# class tripleStoreExplorerTests(unittest.TestCase):
#     def setUp( self ):
#         self.settings = get_appsettings('configs/tests.ini', name='main')
#         self.request = testing.DummyRequest()
#         self.request.session['username'] = 'jdoe'
#         self.request.session['group']    = 'base'

#         self.request.session['upload_directory'] = os.path.join( os.path.dirname( __file__ ), "..", "test-data")
#         self.temp_directory = tempfile.mkdtemp()

#         self.it = InterfaceTpsDb(self.settings,self.request)
#         self.it.empty()

#     def tearDown( self ):
#         shutil.rmtree( self.temp_directory )

#     def test_load_data(self):
#         self.it.load_test1()
