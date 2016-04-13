#! /usr/bin/env python
# -*- coding: utf-8 -*-

import logging
from askomics.libaskomics.ParamManager import ParamManager

class ResultsBuilder(ParamManager):
    """
    The ResultsBuilder build a tabulated table from the preformatted results
    obtained using the parse_results method of a QueryLauncher instance.
    """

    def __init__(self, settings, session):
        ParamManager.__init__(self, settings, session)

        self.log = logging.getLogger(__name__)

    def build_csv_table(self, results):
        """  """
        results_table = ""
        sparql_variables = results[0].keys()

        sp = "\t"
        results_table = sp.join(sparql_variables)
        results_table += "\n"

        for result in results:
            for sv in sparql_variables:
                results_table += result[sv] + '\t'
            results_table = results_table[:-1] + '\n'

        return results_table.replace(self.get_param("askomics.prefix"), '')

    def organize_attribute_and_entity(self, results, constraints): # FIXME results is unused
        """
        results : results from the query sparql
        constraints : information about attribute/entity variable used in the sparql query
        """
        entity_attribute_list = {}
        entity_name_list = {}
        for c in constraints:
            if c['type'] == 'node': # because category are node as entity
                entity_name = c['uri'].replace(self.get_param("askomics.prefix"), '')
                entity_name_list[c['id']] = entity_name
                entity_attribute_list[c['id']] = {}

        for c in constraints:
            if c['type'] == 'attribute':
                attribute_name = c['uri'].replace(self.get_param("askomics.prefix"), '')
                attribute_name = attribute_name.replace('has_', '')
                entity_attribute_list[c['parent']][c['id']] = attribute_name

        #removing all empty node. means they are category...
        remove_item = []

        for elem in entity_attribute_list.values():
            for elt_att in elem:
                if elt_att in  entity_attribute_list:
                    remove_item.append(elt_att)

        for elt in remove_item:
            del entity_attribute_list[elt]
            del entity_name_list[elt]

        self.log.debug("\nentity_name_list\n")
        self.log.debug(entity_name_list)
        self.log.debug("\nentity_attribute_list\n")
        self.log.debug(entity_attribute_list)

        return entity_name_list, entity_attribute_list
