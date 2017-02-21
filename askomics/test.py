from askomics.libaskomics.ParamManager import ParamManager
from pyramid.view import view_config, view_defaults
from pyramid.response import Response

import logging

import os, shutil, tempfile

@view_defaults(renderer='json', route_name='test')
class Test(object):

    def __init__(self, request):
        self.request = request
        self.settings = request.registry.settings

    @view_config(route_name='test', request_method='GET', renderer="json")
    def test(self):
        """Test"""

        return 'hello world, this is a test'

    @view_config(route_name='add', request_method='GET', renderer="json")
    def add(self):
        """return n+m"""

        n = self.request.GET['n']
        m = self.request.GET['m']
        # print(self.request.param)

        return int(n) + int(m)
        
        


