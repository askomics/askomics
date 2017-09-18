"""
This file contain all test for the GalaxyConnector class.

This test need a Galaxy instance to be executed
"""

import time
import unittest
from bioblend import galaxy
from pyramid.paster import get_appsettings
from pyramid import testing
from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.GalaxyConnector import GalaxyConnector

class GalaxyConnectorTests(unittest.TestCase):
    """
    Set up settings and request before testing GalaxyConnector

    Also delete old testing history in galaxy, and create a new one (with 2 datasets)

    """

    def setUp(self):
        """Set up the settings and the session"""

        self.settings = get_appsettings('configs/test.virtuoso.ini', name='main')
        self.settings['askomics.upload_user_data_method'] = 'insert'

        self.request = testing.DummyRequest()
        self.request.session['username'] = 'jdoe'
        self.request.session['group'] = 'base'
        self.request.session['admin'] = False
        self.request.session['blocked'] = True

        self.request.session['graph'] = "test/nosetest/jdoe"

        param_manager = ParamManager(self.settings, self.request.session)

        # Connect to galaxy
        self.galaxy_url = 'http://localhost:8080'
        self.galaxy_key = 'e5dfa90bd0ef70917d61ff8b8b30c1ca'
        galaxy_instance = galaxy.GalaxyInstance(self.galaxy_url, self.galaxy_key)

        # Delete old test history
        histories = galaxy_instance.histories.get_histories(name="askomics_test")
        for history in histories:
            galaxy_instance.histories.delete_history(history['id'], purge=True)

        # Create a new history
        testing_history = galaxy_instance.histories.create_history(name='askomics_test')
        self.history_id = testing_history['id']

        # Upload files into it
        self.src_file = param_manager.get_upload_directory()
        galaxy_instance.tools.upload_file(self.src_file + 'people.tsv', self.history_id, file_name='people.tsv')
        galaxy_instance.tools.upload_file(self.src_file + 'instruments.tsv', self.history_id, file_name='instruments.tsv')
        galaxy_instance.tools.paste_content('hello world', self.history_id, file_name='hello')

        # Get some datasets id
        self.history = galaxy_instance.histories.show_history(self.history_id, contents=True)

        # print(self.history)

        # Wait until the 3 datasets are ready
        while not all(dataset['state'] == 'ok' for dataset in self.history):
            self.history = galaxy_instance.histories.show_history(self.history_id, contents=True)
            time.sleep(1)

        for dataset in self.history:
            if dataset['name'] == 'people.tsv':
                self.ds_people = dataset
            if dataset['name'] == 'instruments.tsv':
                self.ds_instruments = dataset
            if dataset['name'] == 'hello':
                self.ds_hello = dataset

    def test_check_galaxy_instance(self):
        """Test the check_galaxy_instance method"""

        galaxy_connector = GalaxyConnector(self.settings, self.request.session, self.galaxy_url, self.galaxy_key)

        assert galaxy_connector.check_galaxy_instance() is True

    def test_get_datasets_and_histories(self):
        """Test the get_datasets_and_histories method"""
        galaxy_connector = GalaxyConnector(self.settings, self.request.session, self.galaxy_url, self.galaxy_key)

        result = galaxy_connector.get_datasets_and_histories(['tabular'], history_id=self.history_id)

        print(result)

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

        #TODO: more assert

    def test_upload_files(self):
        """Test upload_files method"""

        #TODO


    def test_get_file_content(self):
        """Test get_file_content method"""

        galaxy_connector = GalaxyConnector(self.settings, self.request.session, self.galaxy_url, self.galaxy_key)

        content = galaxy_connector.get_file_content(self.ds_hello['dataset_id'])

        print(content)

        expected_content = 'hello world\n'

        assert content == expected_content

    def test_send_to_history(self):
        """Test the send_to_history method"""

        galaxy_connector = GalaxyConnector(self.settings, self.request.session, self.galaxy_url, self.galaxy_key)

        filepath = self.src_file + 'play_instrument.tsv'

        galaxy_connector.send_to_history(filepath, 'play_instrument.tsv')

    def test_send_json_to_history(self):
        """Test the send_json_to_history method"""

        galaxy_connector = GalaxyConnector(self.settings, self.request.session, self.galaxy_url, self.galaxy_key)

        galaxy_connector.send_json_to_history('hello world')
