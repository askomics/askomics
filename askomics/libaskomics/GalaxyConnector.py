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

    def get_datasets(self):
        """Get Galaxy datasets of a user

        :returns: a list of datasets
        :rtype: list
        """

        galaxy_instance = galaxy.GalaxyInstance(self.url, self.apikey)
        dataset_list = []
        histories = galaxy_instance.histories.get_histories()

        for history in histories:
            history_id = history['id']
            history_content = galaxy_instance.histories.show_history(history_id, contents=True)
            for dataset in history_content:
                # ds_dict = {
                #     'history_id': dataset['history_id'],
                #     'dataset_id': dataset['dataset_id'],
                #     'name': dataset['name'],
                #     'hid': dataset['hid']
                # }
                dataset_list.append(dataset)

        return dataset_list
