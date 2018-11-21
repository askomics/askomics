"""
This file contain all test for the GalaxyConnector class.

This test need a Galaxy instance to be executed
"""

import os
import time
import unittest
from shutil import copyfile
from bioblend import galaxy
from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.GalaxyConnector import GalaxyConnector
from SetupTests import SetupTests

from interface_galaxy import InterfaceGalaxy
from nose.plugins.attrib import attr

@attr('galaxy')

class GalaxyConnectorTests(unittest.TestCase):
    """
    Set up settings and request before testing GalaxyConnector

    Also delete old testing history in galaxy, and create a new one (with 2 datasets)

    """

    def setUp(self):
        """Set up the settings and the session"""

        self.settings = get_appsettings('configs/tests.ini', name='main')
        self.settings['askomics.upload_user_data_method'] = 'insert'
        self.request = testing.DummyRequest()
        self.request.session['username'] = 'jdoe'
        self.request.session['group'] = 'base'
        self.request.session['admin'] = False
        self.request.session['blocked'] = True

        SetupTests(self.settings, self.request.session)

        # Galaxy
        self.interface_galaxy = InterfaceGalaxy(self.settings, self.request)
        self.galaxy = self.interface_galaxy.get_galaxy_credentials()
        self.interface_galaxy.delete_testing_histories()
        self.history_id = self.interface_galaxy.create_testing_history()
        self.interface_galaxy.upload_file_into_history('people.tsv')
        self.interface_galaxy.upload_file_into_history('instruments.tsv')
        self.interface_galaxy.upload_string_into_history('hello_world.txt', 'hello world')
        self.interface_galaxy.wait_until_datasets_ready()
        self.datasets = self.interface_galaxy.get_datasets_id()

    def test_check_galaxy_instance(self):
        """Test the check_galaxy_instance method"""

        galaxy_connector = GalaxyConnector(self.settings, self.request.session, self.galaxy['url'], self.galaxy['key'])

        assert galaxy_connector.check_galaxy_instance() is True

        #FIXME: Don't raise the ConnectionError
        # with self.assertRaises(ConnectionError):
            # GalaxyConnector(self.settings, self.request.session, self.galaxy['url'], 'fake_api_key')

    def test_get_datasets_and_histories(self):
        """Test the get_datasets_and_histories method"""
        galaxy_connector = GalaxyConnector(self.settings, self.request.session, self.galaxy['url'], self.galaxy['key'])

        # Test with history id
        result = galaxy_connector.get_datasets_and_histories(['tabular'], history_id=self.history_id)

        created_history = {
            'name': 'askomics_test',
            'id': self.history_id,
            'selected': True
        }

        assert isinstance(result, dict)
        assert len(result) == 2
        assert 'datasets' in result
        assert 'histories' in result
        assert created_history in result['histories']

        # Test without history id
        result = galaxy_connector.get_datasets_and_histories(['tabular'])

        created_history = {
            'name': 'askomics_test',
            'id': self.history_id,
            'selected': True
        }

        assert isinstance(result, dict)
        assert len(result) == 2
        assert 'datasets' in result
        assert 'histories' in result
        assert created_history in result['histories']

    def test_upload_files(self):
        """Test upload_files method"""

        galaxy_connector = GalaxyConnector(self.settings, self.request.session, self.galaxy['url'], self.galaxy['key'])

        galaxy_connector.upload_files([self.datasets['hello']['dataset_id']])

        assert self.interface_galaxy.check_uploaded_files(self.settings['askomics.files_dir'] + '/' + self.request.session['username'] + '/upload/') is True


    def test_get_file_content(self):
        """Test get_file_content method"""

        galaxy_connector = GalaxyConnector(self.settings, self.request.session, self.galaxy['url'], self.galaxy['key'])

        content = galaxy_connector.get_file_content(self.datasets['hello']['dataset_id'])

        expected_content = 'hello world\n'

        assert content == expected_content

    def test_send_to_history(self):
        """Test the send_to_history method"""

        galaxy_connector = GalaxyConnector(self.settings, self.request.session, self.galaxy['url'], self.galaxy['key'])

        param_manager = ParamManager(self.settings, self.request.session)
        src_file = param_manager.get_upload_directory()
        filepath = src_file + 'play_instrument.tsv'

        galaxy_connector.send_to_history(filepath, 'play_instrument.tsv', 'tabular')

        assert self.interface_galaxy.check_dataset_presence('play_instrument.tsv') is True

    def test_send_json_to_history(self):
        """Test the send_json_to_history method"""

        galaxy_connector = GalaxyConnector(self.settings, self.request.session, self.galaxy['url'], self.galaxy['key'])

        galaxy_connector.send_json_to_history('hello world')

        assert self.interface_galaxy.check_dataset_presence('askomics_query_', start_with=True) is True
