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
