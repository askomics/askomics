import logging

from bioblend import galaxy

from askomics.libaskomics.ParamManager import ParamManager

class GalaxyConnector(ParamManager):
    """Connection with a Galaxy instance

    Contain method to connect to a Galaxy instance with URL and APIkey
    and to get and send datasets to a Galaxy history
    """

    def __init__(self, settings, session, url, apikey):
        ParamManager.__init__(self, settings, session)

        self.log = logging.getLogger(__name__)
        self.url = url
        self.apikey = apikey


    def check_galaxy_instance(self):
        """Check if the galaxy instance

        Check if the Galaxy url and the API key
        :raises: e
        """

        try:
            galaxy_instance = galaxy.GalaxyInstance(self.url, self.apikey)
            galaxy_instance.config.get_config()
        except Exception as e:
            raise e

        return True

    def get_datasets_and_histories(self, history_id=None):
        """Get Galaxy datasets of current history
        and all histories of a user

        :returns: a list of datasets
        :rtype: dict
        """

        galaxy_instance = galaxy.GalaxyInstance(self.url, self.apikey)
        results = {}


        # get current history
        if not history_id:
            history_id = galaxy_instance.histories.get_current_history()['id']

        # Get all available history id and name
        histories = galaxy_instance.histories.get_histories()
        histories_list = []
        for history in histories:
            if history['id'] == history_id:
                history_dict = {"name": history['name'], "id": history['id'], "selected": True}
            else:
                history_dict = {"name": history['name'], "id": history['id'], "selected": False}
            histories_list.append(history_dict)

        # Get datasets of selected history
        dataset_list = []
        history_content = galaxy_instance.histories.show_history(history_id, contents=True)
        for dataset in history_content:
            if dataset['extension'] not in ('tabular', 'ttl', 'gff', 'gff3', 'gff2'):
                continue
            # Don't show deleted datasets
            if dataset['deleted']:
                continue
            dataset_list.append(dataset)

        results['datasets'] = dataset_list
        results['histories'] = histories_list

        return results

    def upload_files(self, files_id):
        """Upload galaxy datasets into AskOmics server

        :param files_id: Ids of Galaxy datasets to upload
        :type files_id: list
        """

        galaxy_instance = galaxy.GalaxyInstance(self.url, self.apikey)

        for file_id in files_id:
            dataset = galaxy_instance.datasets.show_dataset(file_id)
            path = self.get_upload_directory() + '/[' + str(dataset['hid']) + '] ' + dataset['name'] + '.' + dataset['extension']
            galaxy_instance.datasets.download_dataset(file_id, file_path=path, use_default_filename=False)

    def send_to_history(self, path, name):
        """Send a file into the most recent Galaxy history

        :param path: path of file to load into Galaxy
        :type path: string
        """

        galaxy_instance = galaxy.GalaxyInstance(self.url, self.apikey)
        last_history = galaxy_instance.histories.get_most_recently_used_history()
        galaxy_instance.tools.upload_file(path, last_history['id'], file_name=name)


    def send_json_to_history(self, json):
        """Send json data into the last used galaxy history

        :param json: json data to send
        :type json: string
        """
        galaxy_instance = galaxy.GalaxyInstance(self.url, self.apikey)
        last_history = galaxy_instance.histories.get_most_recently_used_history()
        galaxy_instance.tools.paste_content(json, last_history['id'], file_type='json')
