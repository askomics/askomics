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

class MultipleQueryLauncher(QueryLauncher):
    """
    The MultipleQueryLauncher process sparql queries. Send SPARQL query on multiple endpoint.
    Useful to reach several AskOmics Endpoint
    """

    def __init__(self, settings, session):
        QueryLauncher.__init__(self, settings, session)
        self.log = logging.getLogger(__name__)
        self.log.debug(" =================== Multiple Query Lancher Request ====================")

    def process_query(self,query,lendpoints,indexByEndpoint=False):
        '''
            Execute query and parse the results if exist
        '''
        self.log.debug("================================================================================")
        self.log.debug(" =================== MultipleQueryLauncher : process_query  ====================")
        self.log.debug("================================================================================")
        # Request on local Askomics
        self.setUserDatastore()
        json_query = self._execute_query(query, log_raw_results=False)
        if indexByEndpoint:
            results = {}
            results[self.endpoint] = self.parse_results(json_query)
        else:
            results = self.parse_results(json_query)

        # then other askomics endpoint defined by the user
        for es in lendpoints:
            if 'name' not in es :
                raise ValueError("Devel error : define 'name' Attribute :"+str(es))
            if 'endpoint' not in es :
                raise ValueError("Devel error : define 'endpoint' Attribute :"+str(es))

            self.log.debug(es['name']+"::"+es['endpoint'])
            self.name = es['name']
            self.endpoint = es['endpoint']
            self.auth = 'Basic'
            self.username = None
            self.password = None
            self.auth = 'Basic'

            if 'username' in es :
                self.username = es['username']
            if 'password' in es :
                self.password = es['password']
            if 'auth' in es :
                self.auth = es['auth']

            self.urlupdate = None

            self.allowUpdate = False

            json_query = self._execute_query(query,log_raw_results=False)

            if indexByEndpoint:
                results[self.endpoint] = self.parse_results(json_query)
            else:
                results += self.parse_results(json_query)

        return results
