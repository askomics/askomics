import logging

class CounterManager(object):
    """
        Manage unique ID for each node and attribute
    """

    def __init__(self, dico):
        """ Store an index fo each elements """
        self.dico = dico
        self.log = logging.getLogger(__name__)

    def get_new_id(self, name_elt):
        """ Get a new index (increment) or create an index. """

        if name_elt in self.dico.keys():
            self.dico[name_elt] += 1
        else:
            self.dico[name_elt] = 1

        self.print_stat()

        return self.dico[name_elt]

    def set_counter(self, dico):
        self.dico = dico

    def get_counter(self):
        return self.dico

    def print_stat(self):
        self.log.info("== CounterManager::== ")
        self.log.info(self.dico)
