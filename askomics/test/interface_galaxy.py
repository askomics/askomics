"""Contain InterfaceGalaxy class"""

import time
from bioblend import galaxy
from askomics.libaskomics.ParamManager import ParamManager

class InterfaceGalaxy(object):
    """
    This class contain method to communicate with a galaxy instance
    """


    def __init__(self, settings, request):
        """constructor"""
        self.settings = settings
        self.request = request

        # Start a connection with galaxy
        self.galaxy_instance = galaxy.GalaxyInstance(self.settings['askomics.testing_galaxy_url'], self.settings['askomics.testing_galaxy_key'])

        self.history_id = ''


    def get_galaxy_credentials(self):
        """Get galaxy url and apikey

        :return: galaxy url and api key
        :rtype: dict
        """

        credentials = {}
        credentials['url'] = self.settings['askomics.testing_galaxy_url']
        credentials['key'] = self.settings['askomics.testing_galaxy_key']
        return credentials

    def delete_testing_histories(self):
        """Delete history named askomics_test"""

        histories = self.galaxy_instance.histories.get_histories(name='askomics_test')
        for history in histories:
            self.galaxy_instance.histories.delete_history(history['id'], purge=True)

    def create_testing_history(self):
        """Create a testing history named askomics_test

        :return: the history id
        :rtype: string
        """

        testing_history = self.galaxy_instance.histories.create_history(name='askomics_test')
        self.history_id = testing_history['id']
        return self.history_id

    def upload_file_into_history(self, filename):
        """Upload a file (present in user upload directory) into the testing history

        :param filename: the file to upload
        """

        param_manager = ParamManager(self.settings, self.request.session)
        src_file = param_manager.get_upload_directory()
        self.galaxy_instance.tools.upload_file(src_file + filename, self.history_id, file_name=filename)

    def upload_string_into_history(self, filename, string_to_upload):
        """Upload a string into the testing history

        :param filename: name of the dataset
        :param string_to_upload: content of the string to put in the dataset
        """

        self.galaxy_instance.tools.paste_content(string_to_upload, self.history_id, file_name=filename)

    def wait_until_datasets_ready(self):
        """Wait until all datasets in the testing history are ready"""

        history = self.galaxy_instance.histories.show_history(self.history_id, contents=True)
        while not all(dataset['state'] == 'ok' for dataset in history):
            history = self.galaxy_instance.histories.show_history(self.history_id, contents=True)
            time.sleep(1)

    def get_datasets_id(self):
        """Get all id of the datasets in testing history

        :return: a dict with all ids
        :rtype: dict
        """

        datasets = {}
        history = self.galaxy_instance.histories.show_history(self.history_id, contents=True)

        for dataset in history:
            if dataset['name'] == 'people.tsv':
                datasets['people'] = dataset
            if dataset['name'] == 'instruments.tsv':
                datasets['instruments'] = dataset
            if dataset['name'] == 'hello_world.txt':
                datasets['hello'] = dataset

        return datasets

    def check_dataset_presence(self, name, start_with=False):
        """Check if a dataset name is present in the testing history

        :param name: the name of the dataset to check
        :return: True if the dataset is present
        :rtype: boolean
        """

        history = self.galaxy_instance.histories.show_history(self.history_id, contents=True)

        if start_with:
            for dataset in history:
                if dataset['name'].startswith(name):
                    return True
        else:
            for dataset in history:
                if dataset['name'] == name:
                    return True

        return False
