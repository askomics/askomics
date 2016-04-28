#! /usr/bin/env python
# -*- coding: utf-8 -*-
from pprint import pformat
from collections import defaultdict
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

    def gen_csv_table(self, results, sep='\t'):
        """  """
        sparql_variables = results[0].keys()
        yield sep.join(sparql_variables)
        yield from ( sep.join(result[var] for var in sparql_variables)
                    for result in results)

    def build_csv_table(self, results, sep='\t'):
        csv = '\n'.join(self.gen_csv_table(results, sep))
        #FIXME: We really should exploit rdfs:label here. That mean it should be queried.
        csv = csv.replace(self.get_param("askomics.prefix"), '')
        return  csv

    def organize_attribute_and_entity(self, results, constraints): # FIXME results is unused
        """
        results : results from the query sparql
        constraints : information about attribute/entity variable used in the sparql query
        """

        # Mapping: Entity variable -> Attribute variable -> Attribute name (predicate without has_)
        entity_attribute_list = defaultdict(dict)
        # Mapping Entity variable -> entity name
        entity_name_list = {}
        for c in constraints:
            if c['type'] == 'node': # because categories are node as entities
                entity_var = c['id']
                entity_name = c['uri'].replace(self.get_param("askomics.prefix"), '')
                entity_name_list[entity_var] = entity_name
                # Touch to create an empty dict if the variable is not the subject of an attribute
                entity_attribute_list[entity_var]
            elif c['type'] == 'attribute':
                attribute_name = c['uri'] \
                    .replace(self.get_param("askomics.prefix"), '') \
                    .replace('has_', '')
                entity_var = c['parent']
                attr_var = c['id']
                entity_attribute_list[entity_var][attr_var] = attribute_name

        #removing all empty node. means they are category...
        remove_item = [ elt_att
                        for elem in entity_attribute_list.values()
                        for elt_att in elem
                        if elt_att in entity_attribute_list]
        for elt in remove_item:
            del entity_attribute_list[elt]
            del entity_name_list[elt]

        if self.log.isEnabledFor(logging.DEBUG):
            self.log.debug("organize_attribute_and_entity() output:\n%s", pformat(dict(
                entity_name_list=entity_name_list,
                entity_attribute_list=entity_attribute_list)))

        return entity_name_list, entity_attribute_list
