import unittest
import os
import tempfile, shutil
from pyramid.response import Response
from pyramid import testing
from pyramid.paster import get_appsettings
from askomics.upload import FileUpload

# from webob.multidict import MultiDict
# from cgi import FieldStorage

class FileUploadTests(unittest.TestCase):
    def setUp(self):
        self.settings = get_appsettings('configs/tests.ini', name='main')
        self.upload_min_size = self.settings['askomics.upload_min_size']
        self.upload_max_size = self.settings['askomics.upload_max_size']
        self.request = testing.DummyRequest()
        self.request.session['upload_directory'] = os.path.join(os.path.dirname(__file__), "..", "test-data")
        self.request.session['username'] = 'jdoe'
        self.request.session['group'] = 'base'

        self.temp_directory = tempfile.mkdtemp()
        self.request.registry.settings = self.settings



    def test_upload(self):
        """Test the upload method"""
        file_upload = FileUpload(self.request)
        result = file_upload.upload()
        
    def test_filepath(self):
        """Test the filepath method"""

        file_upload = FileUpload(self.request)
        result = file_upload.filepath('people.tsv')

        expected_path = self.settings["askomics.files_dir"] + '/jdoe/upload/people.tsv'
        assert result == expected_path

    def test_validate(self):
        """Test the validate method"""

        file_upload = FileUpload(self.request)
        result = file_upload.validate({'type': 'text/plain', 'size': int(self.upload_min_size)})
        assert result is True

        result = file_upload.validate({'type': 'text/plain', 'size': int(self.upload_min_size) -1})
        assert result is False

        result = file_upload.validate({'type': 'text/plain', 'size': int(self.upload_max_size)})
        assert result is True

        result = file_upload.validate({'type': 'text/plain', 'size': int(self.upload_max_size) +1})
        assert result is False

    def test_get_file_size(self):
        """Test the get_file_size method"""

        file_upload = FileUpload(self.request)
        file = open(self.request.session['upload_directory'] + '/people.tsv')
        result = file_upload.get_file_size(file)
        assert result == 174

    def test_fileinfo(self):
        """Test the fileinfo method"""

        file_upload = FileUpload(self.request)
        result = file_upload.fileinfo(self.request.session['upload_directory'] + '/people.tsv')
        assert result == {
            'delete_type': 'DELETE',
            'size': 174,
            'delete_url': self.request.session['upload_directory'] + '/people.tsv',
            'name': self.request.session['upload_directory'] + '/people.tsv'
        }

        result = file_upload.fileinfo(self.request.session['upload_directory'] + '/people.type')
        assert result is None

        file_upload.delete_method = 'OTHER'
        result = file_upload.fileinfo(self.request.session['upload_directory'] + '/people.tsv')
        assert result == {
            'delete_type': 'OTHER',
            'size': 174,
            'delete_url': self.request.session['upload_directory'] + '/people.tsv' + '&_method=DELETE',
            'name': self.request.session['upload_directory'] + '/people.tsv'
        }

    def test_options(self):
        """Test the options method"""

        file_upload = FileUpload(self.request)
        result = file_upload.options()
        assert isinstance(result, Response)

    #FIXME: don't pass on travis, but ok on local
    # def test_get(self):
    #     """Test the get method"""

    #     file_upload = FileUpload(self.request)
    #     file_upload.upload_dir = self.request.session['upload_directory']
    #     result = file_upload.get()
        # assert result == {
        #     'files': [{
        #         'name': 'transcript.tsv',
        #         'delete_url': 'transcript.tsv',
        #         'size': 772,
        #         'delete_type': 'DELETE'
        #     }, {
        #         'name': 'people.tsv',
        #         'delete_url': 'people.tsv',
        #         'size': 174,
        #         'delete_type': 'DELETE'
        #     }, {
        #         'name': 'turtle_data.ttl',
        #         'delete_url': 'turtle_data.ttl',
        #         'size': 5971,
        #         'delete_type': 'DELETE'
        #     }, {
        #         'name': 'instruments.tsv',
        #         'delete_url': 'instruments.tsv',
        #         'size': 232,
        #         'delete_type': 'DELETE'
        #     }, {
        #         'name': 'play_instrument.tsv',
        #         'delete_url': 'play_instrument.tsv',
        #         'size': 107,
        #         'delete_type': 'DELETE'
        #     }, {
        #         'name': 'qtl.tsv',
        #         'delete_url': 'qtl.tsv',
        #         'size': 172,
        #         'delete_type': 'DELETE'
        #     }, {
        #         'name': 'small_data.gff3',
        #         'delete_url': 'small_data.gff3',
        #         'size': 2266,
        #         'delete_type': 'DELETE'
        #     }, {
        #         'name': 'bed_example.bed',
        #         'delete_url': 'bed_example.bed',
        #         'size': 689,
        #         'delete_type': 'DELETE'
        #     }]
        # }

    #FIXME:
    # def test_delete(self):
    #     """Test the delete method"""

    #     file_upload = FileUpload(self.request)
    #     result = file_upload.delete()
    #     print(result)


    #FIXME:
    # def test_post(self):
        """Test the post method"""

        # file_upload = FileUpload(self.request)
        # file_upload.request.POST = {"'aa": 'AA', 'bb': 'BB'}
        # file_upload.request.POST = MultiDict([('files[]', FieldStorage('files[]', 'play_sport.tsv'))])
        # result = file_upload.post()

        # print(result)

        # assert result == {'files': []}
