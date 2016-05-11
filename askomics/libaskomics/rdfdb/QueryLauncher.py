#! /usr/bin/env python
# -*- coding: utf-8 -*-
import os, time, tempfile
from pprint import pformat
from SPARQLWrapper import SPARQLWrapper, JSON
import requests
import logging

from askomics.libaskomics.ParamManager import ParamManager

class SPARQLError(RuntimeError):
    """
    The SPARQLError returns an error message when a query sends by requests module encounters an error.
    """
    def __init__(self, response):
        self.status_code = response.status_code
        super().__init__(response.text)

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

    def execute_query(self, query, log_raw_results=True):
        """Params:
            - libaskomics.rdfdb.SparqlQuery
            - log_raw_results: if True the raw json response is logged. Set to False
            if you're doing a select and parsing the results with parse_results.
        """
        if self.log.isEnabledFor(logging.DEBUG):
            # Prefixes should always be the same, so drop them for logging
            query_log = '\n'.join(line for line in query.split('\n')
                                  if not line.startswith('PREFIX '))
            self.log.debug("----------- QUERY --------------\n%s", query_log)

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

        if log_raw_results and self.log.isEnabledFor(logging.DEBUG):
            self.log.debug("------- RAW RESULTS --------------\n%s", pformat(results))


        return results

    def parse_results(self, json_res):
        parsed =  [
                {
                    sparql_variable: entry[sparql_variable]["value"]
                    for sparql_variable in entry.keys()
                } for entry in json_res["results"]["bindings"]
            ]

        # debug log is guarded since formatting is time consuming
        if self.log.isEnabledFor(logging.DEBUG):
            if not parsed:
                self.log.debug("-------- NO RESULTS --------------")
            else:
                if len(parsed) > 10:
                    log_res = pformat(parsed[:10])[:-1]
                    log_res += ',\n  ...] (%d results omitted)' % (len(parsed) - 10, )
                else:
                    log_res = pformat(parsed)
                self.log.debug("----------- RESULTS --------------\n%s", log_res)

        return parsed


    def process_query(self, query):
        json_query = self.execute_query(query, log_raw_results=False)

        results = self.parse_results(json_query)
        return results

    def format_results_csv(self, table):
        if not os.path.isdir("askomics/static/results"):
            os.mkdir('askomics/static/results')
        with tempfile.NamedTemporaryFile(dir="askomics/static/results/", prefix="data_"+str(time.time()).replace('.', ''), suffix=".csv", mode="w+t", delete=False) as fp:
            fp.write(table)
        return "/static/results/"+os.path.basename(fp.name)

    # TODO see if we can make a rollback in case of malformed data
    def load_data(self, url):
        """
        Load a ttl file accessible from http into the triple store using LOAD method

        :param url: URL of the file to load
        :return: The status
        """
        self.log.debug("Loading into triple store (LOAD method) the content of: %s", url)

        query_string = "LOAD <"+url+"> INTO GRAPH"+ " <" + self.get_param("askomics.graph")+ ">"
        res = self.execute_query(query_string)

        return res

    def fuseki_load_data(self, filename):
        """
        Load a ttl file into the triple store using requests module and Fuseki
        upload method which allows upload of big data into Fuseki (instead of LOAD method).

        :param filename: name of the file, fp.name from Source.py
        :return: response of the request and queryTime
        """
        data = {'graph': self.get_param("askomics.graph")}
        files = [('file', (os.path.basename(filename), open(filename), 'text/turtle'))]

        t0 = time.time()
        response = requests.post(self.get_param("askomics.file_upload_url"), data=data, files=files)
        if response.status_code != 200:
            raise SPARQLError(response)

        response.raw.read()

        t1 = time.time()
        queryTime = t1 - t0

        return response, queryTime


    # TODO see if we can make a rollback in case of malformed data
    def insert_data(self, ttl_string, ttl_header=""):
        """
        Load a ttl string into the triple store using INSERT DATA method

        :param ttl_string: ttl content to load
        :param ttl_header: the ttl header associated with ttl_string
        :return: The status
        """

        self.log.debug("Loading into triple store (INSERT DATA method) the content: "+ttl_string[:500]+"[...]")

        query_string = ttl_header
        query_string += "\n"
        query_string += "INSERT DATA {\n"
        query_string += "GRAPH "+ "<" + self.get_param("askomics.graph")+ ">" +"\n"
        query_string += "{\n"
        query_string += ttl_string + "\n"
        query_string += "}\n"
        query_string += "}\n"

        res = self.execute_query(query_string)

        return res
