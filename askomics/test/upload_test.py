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
        self.settings = get_appsettings('configs/development.virtuoso.ini', name='main')
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

        assert result == {'html': '<div>\n\n  <p>Supported file: CSV, TSV, GFF, TTL</p>\n\n  <p><mark>the maximum file upload size is ___SIZE_UPLOAD____</mark></p>\n\n  <hr/>\n\n    <!-- The file upload form used as target for the file upload widget -->\n\n    <form id="fileupload" action="/up/" method="POST" enctype="multipart/form-data">\n\n        <!-- Redirect browsers with JavaScript disabled to the origin page -->\n\n      <!--  <noscript><input type="hidden" name="redirect" value="https://bipaa.genouest.org/askomics"></noscript> -->\n\n        <!-- The fileupload-buttonbar contains buttons to add/delete files and start/cancel the upload -->\n\n        <div class="row fileupload-buttonbar">\n\n            <div class="col-lg-7">\n\n                <div class="btn-group" role="group" aria-label="...">\n\n                    <span id="add_files_upload" class="btn btn-default fileinput-button">\n\n                    <i class="fa fa-plus text-success" aria-hidden="true"></i> Add files ...\n\n                        <input type="file" name="files[]" multiple>\n\n                    </span>\n\n                  <button id=\'start_upload\' type="button" class="btn btn-default start"><i class="fa fa-arrow-circle-o-up text-default" aria-hidden="true"></i> Start upload</button>\n\n                  <button id=\'cancel_upload\' type="button" class="btn btn-default cancel"><i class="fa fa-ban text-warning" aria-hidden="true"></i> Cancel upload</button>\n\n                  <button id=\'delete_upload\' type="button" class="btn btn-default delete"><i class="fa fa-trash text-danger" aria-hidden="true"></i> Delete</button>\n\n                </div>\n\n                <input type="checkbox" class="toggle">\n\n                <!-- The global file processing state -->\n\n                <span class="fileupload-process"></span>\n\n            </div>\n\n            <!-- The global progress state -->\n\n            <div class="col-lg-5 fileupload-progress fade">\n\n                <!-- The global progress bar -->\n\n                <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100">\n\n                    <div class="progress-bar" style="width:0%;"></div>\n\n                </div>\n\n                <!-- The extended global progress state -->\n\n                <div class="progress-extended">&nbsp;</div>\n\n            </div>\n\n        </div>\n\n        <!-- The table listing the files available for upload/download -->\n\n        <table role="presentation" class="table table-striped"><tbody class="files"></tbody></table>\n\n    </form>\n\n</div>\n\n<!-- The template to display files available for upload -->\n\n<script id="template-upload" type="text/x-tmpl">\n\n{% for (var i=0, file; file=o.files[i]; i++) { %}\n\n    <tr class="template-upload fade">\n\n        <td>\n\n            <span class="preview"></span>\n\n        </td>\n\n        <td>\n\n            <p class="name">{%=file.name%}</p>\n\n            <strong class="error text-danger"></strong>\n\n        </td>\n\n        <td>\n\n            <div class="progress progress-small active" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="progress-bar" style="width:0%;"><span>{%=o.formatFileSize(file.size)%}</span></div></div>\n\n        </td>\n\n        <td>\n\n            {% if (!i && !o.options.autoUpload) { %}\n\n                <button class="btn btn-default start" disabled>\n\n                    <i class="fa fa-arrow-circle-o-up text-default" aria-hidden="true"></i>\n\n                    <span>Start</span>\n\n                </button>\n\n            {% } %}\n\n            {% if (!i) { %}\n\n                <button class="btn btn-default cancel">\n\n                    <i class="fa fa-ban text-warning" aria-hidden="true"></i>\n\n                    <span>Cancel</span>\n\n                </button>\n\n            {% } %}\n\n        </td>\n\n    </tr>\n\n{% } %}\n\n</script>\n\n<!-- The template to display files available for download -->\n\n<script id="template-download" type="text/x-tmpl">\n\n{% for (var i=0, file; file=o.files[i]; i++) { %}\n\n    <tr class="template-download fade">\n\n        <td>\n\n            <span class="preview">\n\n                {% if (file.thumbnailUrl) { %}\n\n                    <a href="{%=file.url%}" title="{%=file.name%}" download="{%=file.name%}" data-gallery><img src="{%=file.thumbnailUrl%}"></a>\n\n                {% } %}\n\n            </span>\n\n        </td>\n\n        <td>\n\n            <p class="name">\n\n                {% if (file.url) { %}\n\n                    <a href="{%=file.url%}" title="{%=file.name%}" download="{%=file.name%}">{%=file.name%}</a>\n\n                {% } else { %}\n\n                    <span>{%=file.name%}</span>\n\n                {% } %}\n\n            </p>\n\n            {% if (file.error) { %}\n\n                <div><span class="label label-danger">Error</span> {%=file.error%}</div>\n\n            {% } %}\n\n        </td>\n\n        <td>\n\n            <span class="size">{%=o.formatFileSize(file.size)%}</span>\n\n        </td>\n\n        <td>\n\n            {% if (file.delete_url) { %}\n\n                <button class="btn btn-default delete" data-type="{%=file.delete_type%}" data-url="up/file/{%=file.delete_url%}">\n\n                    <i class="fa fa-trash text-danger" aria-hidden="true"></i>\n\n                    <span>Delete</span>\n\n                </button>\n\n                <input type="checkbox" name="delete" value="1" class="toggle">\n\n            {% } else { %}\n\n                <button class="btn btn-default cancel">\n\n                    <i class="fa fa-ban text-warning" aria-hidden="true"></i>\n\n                    <span>Cancel</span>\n\n                </button>\n\n            {% } %}\n\n        </td>\n\n    </tr>\n\n{% } %}\n\n</script>\n'}

    def test_filepath(self):
        """Test the filepath method"""

        file_upload = FileUpload(self.request)
        result = file_upload.filepath('people.tsv')

        assert result == '/tmp/askomics/upload/jdoe/people.tsv'

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

        result = file_upload.validate({'type': 'hello', 'size': int(self.upload_max_size)})
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
            'delete_url': '/home/imx/Workspace/askomics/askomics/test/../test-data/people.tsv',
            'name': '/home/imx/Workspace/askomics/askomics/test/../test-data/people.tsv'
        }

        result = file_upload.fileinfo(self.request.session['upload_directory'] + '/people.type')
        assert result is None

        file_upload.delete_method = 'OTHER'
        result = file_upload.fileinfo(self.request.session['upload_directory'] + '/people.tsv')
        assert result == {
            'delete_type': 'OTHER',
            'size': 174,
            'delete_url': '/home/imx/Workspace/askomics/askomics/test/../test-data/people.tsv&_method=DELETE',
            'name': '/home/imx/Workspace/askomics/askomics/test/../test-data/people.tsv'
        }

    def test_options(self):
        """Test the options method"""

        file_upload = FileUpload(self.request)
        result = file_upload.options()
        assert isinstance(result, Response)

    def test_get(self):
        """Test the get method"""

        file_upload = FileUpload(self.request)
        file_upload.upload_dir = self.request.session['upload_directory']
        result = file_upload.get()
        assert result == {
            'files': [{
                'name': 'transcript.tsv',
                'delete_url': 'transcript.tsv',
                'size': 772,
                'delete_type': 'DELETE'
            }, {
                'name': 'people.tsv',
                'delete_url': 'people.tsv',
                'size': 174,
                'delete_type': 'DELETE'
            }, {
                'name': 'turtle_data.ttl',
                'delete_url': 'turtle_data.ttl',
                'size': 5971,
                'delete_type': 'DELETE'
            }, {
                'name': 'instruments.tsv',
                'delete_url': 'instruments.tsv',
                'size': 232,
                'delete_type': 'DELETE'
            }, {
                'name': 'play_instrument.tsv',
                'delete_url': 'play_instrument.tsv',
                'size': 107,
                'delete_type': 'DELETE'
            }, {
                'name': 'qtl.tsv',
                'delete_url': 'qtl.tsv',
                'size': 172,
                'delete_type': 'DELETE'
            }, {
                'name': 'small_data.gff3',
                'delete_url': 'small_data.gff3',
                'size': 2266,
                'delete_type': 'DELETE'
            }, {
                'name': 'bed_example.bed',
                'delete_url': 'bed_example.bed',
                'size': 689,
                'delete_type': 'DELETE'
            }]
        }

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
