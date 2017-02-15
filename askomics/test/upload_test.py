# import unittest
# import os
# import tempfile, shutil

# from pyramid import testing
# from pyramid.paster import get_appsettings
# from askomics.upload import FileUpload

# class FileUploadTests(unittest.TestCase):
#     def setUp( self ):
#         self.settings = get_appsettings('configs/development.virtuoso.ini', name='main')
#         self.request = testing.DummyRequest()
#         self.request.session['upload_directory'] = os.path.join( os.path.dirname( __file__ ), "..", "test-data")
#         self.request.session['username'] = 'jdoe'
#         self.request.session['group']    = 'base'

#         self.temp_directory = tempfile.mkdtemp()
#         self.request.registry.settings = self.settings

#     def tearDown( self ):
#         shutil.rmtree( self.temp_directory )

#     def test_upload(self):
#         fu = FileUpload(self.request);
#         fu.upload()

#     def test_filepath(self):
#         fu = FileUpload(self.request);
#         fu.filepath('toto')

#     def test_validate(self):

#         fu = FileUpload(self.request);
#         nefi = {}
#         nefi['size']=0
#         fu.validate(nefi)
#         nefi['size']=99999999999
#         fu.validate(nefi)

#     def test_fileinfo(self):
#         fu = FileUpload(self.request);
#         fu.fileinfo("personne.tsv")
