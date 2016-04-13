from pyramid.view import view_config, view_defaults
from pyramid.response import Response

import logging

import os, shutil, tempfile

@view_defaults(route_name='upload')
class FileUpload(object):

    def __init__(self, request):
        self.request = request
        request.response.headers['Access-Control-Allow-Origin'] = '*'
        request.response.headers['Access-Control-Allow-Methods'] = 'OPTIONS, HEAD, GET, POST, PUT, DELETE'
        #create tempory directory...
        if 'upload_directory' not in request.session.keys() or not os.path.isdir(request.session['upload_directory']):
            request.session['upload_directory'] = tempfile.mkdtemp(suffix='_tmp', prefix='askomics')

        self.upload_dir = request.session['upload_directory']

        self.log = logging.getLogger(__name__)

        self.log.debug("upload_directory => "+self.upload_dir)
        settings = request.registry.settings
        self.allowed_types = settings["askomics.allowed_file_types"]
        self.delete_method = settings["askomics.delete_method"]
        self.min_size = int(settings["askomics.upload_min_size"])
        self.max_size = int(settings["askomics.upload_max_size"])

    @view_config(route_name='uploadform', request_method='GET', renderer="json")
    def upload(self):

        template_file = "askomics/templates/upload.pt"
        html = ""
        info = {}
        with open(template_file) as template:
            html = template.readlines()
        info["html"] = '\n'.join(html)
        return info

    def filepath(self, name):
        return os.path.join(self.upload_dir, name)

    def validate(self, new_file):
        if new_file['size'] < self.min_size:
            new_file['error'] = 'File is too small'
        elif new_file['size'] > self.max_size:
            new_file['error'] = 'File is too large'
        #elif new_file['type'] not in self.allowed_types: # FIXME commented for tests
        #    new_file['error'] = 'File type '+new_file['type']+' not allowed' # FIXME commented for tests
        else:
            return True
        return False

    def get_file_size(self, new_file):
        new_file.seek(0, 2) # Seek to the end of the file
        size = new_file.tell() # Get the position of EOF
        new_file.seek(0) # Reset the file position to the beginning
        return size

    def fileinfo(self, name):
        filename = self.filepath(name)
        ext = os.path.splitext(name)[1]
        if ext != '.type' and os.path.isfile(filename):
            info = {}
            info['name'] = name
            info['size'] = os.path.getsize(filename)
            info['delete_type'] = self.delete_method
            info['delete_url'] = self.request.route_url('upload', sep='', name='') + '/' + name
            if self.delete_method != 'DELETE':
                info['delete_url'] += '&_method=DELETE'
            return info
        else:
            return None

    @view_config(request_method='OPTIONS')
    def options(self):
        return Response(body='')

    @view_config(request_method='HEAD')
    def options(self):
        return Response(body='')

    @view_config(request_method='GET', renderer="json")
    def get(self):
        p = self.request.matchdict.get('name')

        if p:
            return self.fileinfo(p)
        else:
            filelist = []
            for f in os.listdir(self.upload_dir):
                n = self.fileinfo(f)
                if n:
                    filelist.append(n)
            return {'files': filelist}

    @view_config(request_method='DELETE', xhr=True, accept="application/json", renderer='json')
    def delete(self):
        filename = self.request.matchdict.get('name')
        try:
            os.remove(self.filepath(filename) + '.type')
        except IOError:
            pass

        try:
            os.remove(self.filepath(filename))
        except IOError:
            return False

        return True

    @view_config(request_method='POST', xhr=True, accept="application/json", renderer='json')
    def post(self):
        if self.request.matchdict.get('_method') == "DELETE":
            return self.delete()
        results = []
        for name, field_storage in self.request.POST.items(): # FIXME name is not used
            if isinstance(field_storage, str):
                continue
            result = {}
            result['name'] = os.path.basename(field_storage.filename)
            result['type'] = field_storage.type
            #self.check_file(field_storage.filename)
            result['size'] = self.get_file_size(field_storage.file)
            if self.validate(result):
                #with open( self.filepath(result['name'] + '.type'), 'w') as f:
                #    f.write(result['type'])
                with open(self.filepath(result['name']), 'wb') as f:
                    shutil.copyfileobj(field_storage.file, f)

                result['delete_type'] = self.delete_method
                result['delete_url'] = self.request.route_url('upload', sep='', name='') + '/' + result['name']
                if self.delete_method != 'DELETE':
                    result['delete_url'] += '&_method=DELETE'
            results.append(result)
        return {'files': results}
