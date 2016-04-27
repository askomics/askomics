#! /usr/bin/env python
# -*- coding: utf-8 -*-
import os, time, tempfile
from SPARQLWrapper import SPARQLWrapper, JSON
import logging

from askomics.libaskomics.ParamManager import ParamManager

class QueryLauncher(ParamManager):
    """
    The QueryLauncher process sparql queries:
        - execute_query send the query to the sparql endpoint specified in params.
        - parse_results preformat the query results
        - format_results_csv write in the tabulated result file a table obtained
          from these preformated results using a ResultsBuilder instance.
    """

    def __init__(self, settings, session):
        ParamManager.__init__(self, settings, session)

        self.log = logging.getLogger(__name__)

    def execute_query(self, query):
        urlupdate = None
        if self.is_defined("askomics.updatepoint"):
            urlupdate = self.get_param("askomics.updatepoint")
        if self.is_defined("askomics.endpoint"):
            data_endpoint = SPARQLWrapper(self.get_param("askomics.endpoint"), urlupdate)
        else:
            raise ValueError("askomics.endpoint")

        if self.is_defined("askomics.endpoint.username") and self.is_defined("askomics.endpoint.passwd"):
            user = self.get_param("askomics.endpoint.username")
            passwd = self.get_param("askomics.endpoint.passwd")
            data_endpoint.setCredentials(user, passwd)
        elif self.is_defined("askomics.endpoint.username"):
            raise ValueError("askomics.passwd")
        elif self.is_defined("askomics.endpoint.passwd"):
            raise ValueError("askomics.username")

        if self.is_defined("askomics.endpoint.auth"):
            data_endpoint.setHTTPAuth(self.get_param("askomics.endpoint.auth")) # Basic or Digest

        data_endpoint.setQuery(query)
        data_endpoint.method = 'POST'
        if data_endpoint.isSparqlUpdateRequest():
            data_endpoint.setMethod('POST')
            # Hack for Virtuoso to LOAD a turtle file
            if self.is_defined("askomics.hack_virtuoso"):
                hack_virtuoso = self.get_param("askomics.hack_virtuoso")
                if hack_virtuoso.lower() == "ok" or hack_virtuoso.lower() == "true":
                    data_endpoint.queryType = 'SELECT'
            results = data_endpoint.query()
        else:
            data_endpoint.setReturnFormat(JSON)
            results = data_endpoint.query().convert()

        return results

    def parse_results(self, json_res):

        return [
            {
                sparql_variable: entry[sparql_variable]["value"]
                for sparql_variable in entry.keys()
            } for entry in json_res["results"]["bindings"]
            ]


    def process_query(self, query):
        self.log.debug("----------- QUERY --------------")
        self.log.debug(query)
        json_query = self.execute_query(query)
        results = self.parse_results(json_query)
        self.log.debug("----------- RESULTS --------------")
        self.log.debug(results)

        return results

    def format_results_csv(self, table):
        if not os.path.isdir("askomics/static/results"):
            os.mkdir('askomics/static/results')
        with tempfile.NamedTemporaryFile(dir="askomics/static/results/", prefix="data_"+str(time.time()).replace('.', ''), suffix=".csv", mode="w+t", delete=False) as fp:
            fp.write(table)
        return "/static/results/"+os.path.basename(fp.name)

    def load_data(self, url):
        """
        Load a ttl file accessible from http into the triple store using LOAD method

        :param url: URL of the file to load
        :return: The status
        """
        self.log.debug("Loading into triple store (LOAD method) the content of: "+url)

        query_string = "LOAD <"+url+"> INTO GRAPH"+ " <" + self.get_param("askomics.graph")+ ">"
        res = self.execute_query(query_string)

        self.log.debug(res.info()) # FIXME what do we get (status?)

        return res # FIXME should return something (status)

    def insert_data(self, ttl_string, ttl_header=""):
        """
        Load a ttl string into the triple store using INSERT DATA method

        :param ttl_string: ttl content to load
        :param ttl_header: the ttl header associated with ttl_string
        :return: The status
        """

        self.log.debug("Loading into triple store (INSERT DATA method) the content: "+ttl_string[:100]+"[...]")

        query_string = ttl_header
        query_string += "\n"
        query_string += "INSERT DATA {\n"
        query_string += "GRAPH "+ "<" + self.get_param("askomics.graph")+ ">" +"\n"
        query_string += "{\n"
        query_string += ttl_string + "\n"
        query_string += "}\n"
        query_string += "}\n"

        res = self.execute_query(query_string)

        self.log.debug(res.info()) # FIXME what do we get (status?)

        return res # FIXME should return something (status)
