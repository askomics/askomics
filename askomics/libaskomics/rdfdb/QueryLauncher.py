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


    def build_query_load(self, query_string_list, fpfile, header=False):
        #with tempfile.NamedTemporaryFile(dir="askomics/ttl/", suffix=".ttl",mode="w",delete=False) as fp:
        if header:
            fpfile.write(self.header_ttl_config())

        sub_query_string_list = ""
        for i, elt in enumerate(query_string_list): # FIXME i is unused
            sub_query_string_list += elt + "\n"
        if len(sub_query_string_list) > 0:
            fpfile.write(sub_query_string_list)
        return


    def update_query_load(self, fpfile, url):
        self.log.debug("==================>"+url)
        query_string = "LOAD <"+url+"/ttl/"+os.path.basename(fpfile.name)+"> INTO GRAPH"+ " <" + self.get_param("askomics.graph")+ ">"
        self.log.debug(query_string)
        res = self.execute_query(query_string)
        self.log.debug(res.info())
        return

    def update_query_insert_data(self, query_string_list):
        header_sparql = self.header_sparql_config()
        max_list = int(self.get_param("askomics.max_content_size_to_update_database"))
        #f = open('Insert.txt', 'a')
        while query_string_list:
            sub_query_string_list = query_string_list[:min(max_list, len(query_string_list))]
            del query_string_list[:min(max_list, len(query_string_list))]
            query_string = header_sparql
            query_string += "\n"
            query_string += "INSERT DATA {\n"
            query_string += "GRAPH "+ "<" + self.get_param("askomics.graph")+ ">" +"\n"
            query_string += "{\n"
            for i, elt in enumerate(sub_query_string_list): # FIXME i is unused
                query_string += elt + "\n"
            query_string += "}\n"
            query_string += "}\n"
            self.log.debug(query_string[:2000])
            res = self.execute_query(query_string)
            self.log.debug(res.info())

        return
