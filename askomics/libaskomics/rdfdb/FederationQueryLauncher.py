#! /usr/bin/env python
# -*- coding: utf-8 -*-
import os, time, tempfile
import re
import csv
from pprint import pformat
from SPARQLWrapper import SPARQLWrapper, JSON
import requests
import logging
import urllib.request

from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher

class FederationQueryLauncher(QueryLauncher):
    """
    The QueryLauncher process sparql queries:
        - execute_query send the query to the sparql endpoint specified in params.
        - parse_results preformat the query results
        - format_results_csv write in the tabulated result file a table obtained
          from these preformated results using a ResultsBuilder instance.
    """

    def __init__(self, settings, session,lendpoints):
        QueryLauncher.__init__(self, settings, session)
        self.log = logging.getLogger(__name__)


        self.log.info(" =================== Federation Request ====================")

        #comments added in sparql request to get all url endpoint.
        self.commentsForFed=""
        for endp in lendpoints:
            if endp['askomics']:
                self.commentsForFed+="#endpoint,askomics,"+endp['name']+','+endp['endpoint']+',false\n'
            else:
                self.commentsForFed+="#endpoint,external,"+endp['name']+','+endp['endpoint']+',false\n'
        #add local TPS
        #self.commentsForFed+="#endpoint,local,"+self.get_param("askomics.endpoint")+',false\n'

        if not self.is_defined("askomics.fdendpoint") :
            raise ValueError("can not find askomics.fdendpoint property in the config file !")

        self.name = 'FederationEngine'
        self.endpoint = self.get_param("askomics.fdendpoint")
        self.username = None
        self.password = None
        self.urlupdate = None
        self.auth = 'Basic'
        self.allowUpdate = False

    def process_query(self, query):
        '''
            Execute query and parse the results if exist
        '''
        self.log.info("================================================================================")
        self.log.info(" =================== Federation Request : process_query  ====================")
        self.log.info("================================================================================")
        
        # Federation Request case
        #------------------------------------------------------
        query = self.commentsForFed + query
        json_query = self._execute_query(query,log_raw_results=False)
        return self.parse_results(json_query)
