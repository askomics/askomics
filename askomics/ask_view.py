#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re

from pyramid.view import view_config, view_defaults
from pyramid.response import FileResponse

import logging
from pprint import pformat
import textwrap

from pygments import highlight
from pygments.lexers import TurtleLexer
from pygments.formatters import HtmlFormatter

from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.TripleStoreExplorer import TripleStoreExplorer
from askomics.libaskomics.SourceFileConvertor import SourceFileConvertor
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.rdfdb.ResultsBuilder import ResultsBuilder
from askomics.libaskomics.source_file.SourceFile import SourceFile

@view_defaults(renderer='json', route_name='start_point')
class AskView(object):
    """ This class contains method calling the libaskomics functions using parameters from the js web interface (body variable) """

    def __init__(self, request):
        self.request = request
        self.settings = request.registry.settings

        self.log = logging.getLogger(__name__)

    @view_config(route_name='start_point', request_method='GET')
    def start_points(self):
        """ Get the nodes being query starters """
        self.log.debug("== START POINT ==")
        data = {}
        tse = TripleStoreExplorer(self.settings, self.request.session)

        nodes = tse.get_start_points()
        data["nodes"] = {n['uri']: n for n in nodes}

        return data

    @view_config(route_name='statistics', request_method='GET')
    def statistics(self):
        """ Get information about triplet store """
        self.log.debug("== STATS ==")
        data = {}
        pm = ParamManager(self.settings, self.request.session)

        sqb = SparqlQueryBuilder(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)
        tse = TripleStoreExplorer(self.settings, self.request.session)

        results = ql.process_query(sqb.get_statistics_number_of_triples().query)
        resultsGraphs = ql.process_query(sqb.get_statistics_number_of_triples_AskOmics_graphs().query)
        data["ntriples"] = int(results[0]["no"]) + int(resultsGraphs[0]["no"])

        results = ql.process_query(sqb.get_statistics_number_of_entities().query)
        data["nentities"] = results[0]["no"]

        results = ql.process_query(sqb.get_statistics_distinct_classes().query)
        data["nclasses"] = results[0]["no"]

        # Get the number of graphs
        results = ql.process_query(sqb.get_statistics_number_of_graphs().query)
        data["ngraphs"] = results[0]["no"]

        self.log.debug("=== LIST OF METADATAS ")

        # Get the list of named graphs
        namedGraphsResults = ql.execute_query(sqb.get_list_named_graphs().query)

        namedGraphsMetadatas = {}

        # Get a dictionnary containing the metadatas for each graph
        for indexResult in range(len(namedGraphsResults['results']['bindings'])):
            metadatasResults = ql.execute_query(sqb.get_metadatas(namedGraphsResults['results']['bindings'][indexResult]['g']['value']).query)
            metadatas = {}
            for indexMetadatasResults in range(len(metadatasResults['results']['bindings'])):
                if metadatasResults['results']['bindings'][indexMetadatasResults]['p']['value'] == "http://www.w3.org/ns/prov#generatedAtTime":
                    metadatas['loadDate'] = metadatasResults['results']['bindings'][indexMetadatasResults]['o']['value']
                if metadatasResults['results']['bindings'][indexMetadatasResults]['p']['value'] == "http://purl.org/dc/elements/1.1/creator":
                    metadatas['username'] = metadatasResults['results']['bindings'][indexMetadatasResults]['o']['value']
                if metadatasResults['results']['bindings'][indexMetadatasResults]['p']['value'] == "http://purl.org/dc/elements/1.1/hasVersion":
                    metadatas['version'] = metadatasResults['results']['bindings'][indexMetadatasResults]['o']['value']
                if metadatasResults['results']['bindings'][indexMetadatasResults]['p']['value'] == "http://www.w3.org/ns/prov#describesService":
                    metadatas['server'] = metadatasResults['results']['bindings'][indexMetadatasResults]['o']['value']
                if metadatasResults['results']['bindings'][indexMetadatasResults]['p']['value'] == "http://www.w3.org/ns/prov#wasDerivedFrom":
                    metadatas['filename'] = metadatasResults['results']['bindings'][indexMetadatasResults]['o']['value']
            namedGraphsMetadatas[namedGraphsResults['results']['bindings'][indexResult]['g']['value']] = metadatas

        data['metadata'] = namedGraphsMetadatas

        # Get the list of classes
        res_list_classes = ql.process_query(sqb.get_statistics_list_classes().query)

        data["class"] = {}
        for obj in res_list_classes:
            print(obj['class'])
            class_name = pm.remove_prefix(obj['class'])
            print(class_name)
            data["class"][class_name] = {}

        # Get the number of instances by class
        res_nb_instances = ql.process_query(sqb.get_statistics_nb_instances_by_classe().query)

        for obj in res_nb_instances:
            if 'class' in obj:
                print(data['class'])
                class_name = pm.remove_prefix(obj['class'])
                data["class"][class_name]["count"] = obj['count']

        return data


    @view_config(route_name='empty_database', request_method='GET')
    def empty_database(self):
        """
        Delete all triples in the triplestore
        """
        data = {}

        self.log.debug("=== DELETE ALL TRIPLES ===")
        try:
            sqb = SparqlQueryBuilder(self.settings, self.request.session)
            ql = QueryLauncher(self.settings, self.request.session)

            namedGraphs = self.get_list_named_graphs()
            namedGraphs.append(ql.get_param("askomics.graph"))
            for graph in namedGraphs:
                ql.execute_query(sqb.get_delete_query_string(graph).query)

        except Exception as e:
            data['error'] = str(e)
            self.log.error(str(e))

        return data

    @view_config(route_name='delete_graph', request_method='POST')
    def delete_graph(self):
        """
        Delete triples from a list of graph
        """
        self.log.debug("=== DELETE SELECTED GRAPHS ===")

        sqb = SparqlQueryBuilder(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)

        graphs = self.request.json_body['namedGraphs']

        for graph in graphs:
            self.log.debug("--- DELETE GRAPH : %s", graph)
            ql.execute_query(sqb.get_drop_named_graph(graph).query)

    @view_config(route_name='list_named_graphs', request_method='GET')
    def get_list_named_graphs(self):
        """
        Return a list with all the named graphs.
        """

        self.log.debug("=== LIST OF NAMED GRAPHS ===")

        sqb = SparqlQueryBuilder(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)

        res = ql.execute_query(sqb.get_list_named_graphs().query)

        namedGraphs = []

        for indexResult in range(len(res['results']['bindings'])):
            namedGraphs.append(res['results']['bindings'][indexResult]['g']['value'])

        return namedGraphs

    @view_config(route_name='source_files_overview', request_method='GET')
    def source_files_overview(self):
        """
        Get preview data for all the available files
        """
        self.log.debug(" ========= Askview:source_files_overview =============")
        sfc = SourceFileConvertor(self.settings, self.request.session)

        source_files = sfc.get_source_files()

        data = {}
        data['files'] = []

        for src_file in source_files:

            infos = {}
            infos['name'] = src_file.name
            try:
                infos['headers'] = src_file.headers
                infos['preview_data'] = src_file.get_preview_data()
                infos['column_types'] = [];

                header_num = 0
                for ih in range(0,len(infos['headers'])):
                    if infos['headers'][ih].find("@")>0:
                        infos['column_types'].append("entity")
                    else:
                        infos['column_types'].append(src_file.guess_values_type(infos['preview_data'][ih], infos['headers'][header_num]))
                    header_num += 1
            except Exception as e:
                infos['error'] = 'Could not read input file, are you sure it is a valid tabular file?'
                self.log.error(str(e))

            data['files'].append(infos)

        return data

    @view_config(route_name='preview_ttl', request_method='POST')
    def preview_ttl(self):
        """
        Convert tabulated files to turtle according to the type of the columns set by the user
        """
        self.log.debug("preview_ttl")
        data = {}

        body = self.request.json_body
        file_name = body["file_name"]
        col_types = body["col_types"]
        disabled_columns = body["disabled_columns"]

        sfc = SourceFileConvertor(self.settings, self.request.session)

        src_file = sfc.get_source_file(file_name)
        src_file.set_forced_column_types(col_types)
        src_file.set_disabled_columns(disabled_columns)

        data = textwrap.dedent(
        """
        {header}

        #############
        #  Content  #
        #############

        {content_ttl}

        #################
        #  Abstraction  #
        #################

        {abstraction_ttl}

        ######################
        #  Domain knowledge  #
        ######################

        {domain_knowledge_ttl}
        """).format(header=sfc.get_turtle_template(),
                    content_ttl = '\n'.join(src_file.get_turtle(preview_only=True)),
                    abstraction_ttl = src_file.get_abstraction(),
                    domain_knowledge_ttl = src_file.get_domain_knowledge()
                    )

        formatter = HtmlFormatter(cssclass='preview_field', nowrap=True, nobackground=True)
        return highlight(data, TurtleLexer(), formatter) # Formated html

    @view_config(route_name='check_existing_data', request_method='POST')
    def check_existing_data(self):
        """
        Compare the user data and what is already in the triple store
        """

        data = {}

        body = self.request.json_body
        file_name = body["file_name"]
        col_types = body["col_types"]
        disabled_columns = body["disabled_columns"]

        sfc = SourceFileConvertor(self.settings, self.request.session)
        try:
            src_file = sfc.get_source_file(file_name)
            src_file.set_forced_column_types(col_types)
            src_file.set_disabled_columns(disabled_columns)

            headers_status, missing_headers = src_file.compare_to_database()

            data["headers_status"] = headers_status
            data["missing_headers"] = missing_headers
        except Exception as e:
            data["headers_status"] = ""
            data["missing_headers"] = ""
            data['error'] = str(e)
            self.log.error(str(e))

        return data

    @view_config(route_name='load_data_into_graph', request_method='POST')
    def load_data_into_graph(self):
        """
        Load tabulated files to triple store according to the type of the columns set by the user
        """
        data = {}

        body = self.request.json_body
        file_name = body["file_name"]
        col_types = body["col_types"]
        disabled_columns = body["disabled_columns"]
        try:
            sfc = SourceFileConvertor(self.settings, self.request.session)

            src_file = sfc.get_source_file(file_name)
            src_file.set_forced_column_types(col_types)
            src_file.set_disabled_columns(disabled_columns)

            urlbase = re.search(r'(http:\/\/.*)\/.*', self.request.current_route_url())
            urlbase = urlbase.group(1)

            method = 'load'
            data = src_file.persist(urlbase,method)
        except Exception as e:
            data['error'] = 'Probleme with user data file ?</br>'+str(e)
            self.log.error(str(e))

        return data

    @view_config(route_name='getUserAbstraction', request_method='POST')
    def getUserAbstraction(self):
        """ Get the user asbtraction to manage relation inside javascript """
        self.log.debug("== getUserAbstraction ==")

        tse = TripleStoreExplorer(self.settings, self.request.session)
        data = tse.getUserAbstraction()

        return data


    @view_config(route_name='sparqlquery', request_method='POST')
    def get_value(self):
        """ Build a request from a json whith the following contents :variates,constraintesRelations,constraintesFilters"""
        self.log.debug("== Attribute Value ==")
        data = {}

        tse = TripleStoreExplorer(self.settings, self.request.session)

        body = self.request.json_body
        try:
            results,query = tse.build_sparql_query_from_json(body["variates"],body["constraintesRelations"],body["constraintesFilters"],body["limit"],True)

            # Remove prefixes in the results table
            data['values'] = results

            if not body['export']:
                return data


            # Provide results file
            ql = QueryLauncher(self.settings, self.request.session)
            rb = ResultsBuilder(self.settings, self.request.session)
            data['file'] = ql.format_results_csv(rb.build_csv_table(results))
        except Exception as e:
            data['values'] = []
            data['file'] = ""
            data['error'] = str(e)
            self.log.error(str(e))

        return data

    @view_config(route_name='getSparqlQueryInTextFormat', request_method='POST')
    def getSparqlQueryInTextFormat(self):
        """ Build a request from a json whith the following contents :variates,constraintesRelations,constraintesFilters"""
        self.log.debug("== Attribute Value ==")
        data = {}
        try:
            tse = TripleStoreExplorer(self.settings, self.request.session)

            body = self.request.json_body
            results,query = tse.build_sparql_query_from_json(body["variates"],body["constraintesRelations"],body["constraintesFilters"],body["limit"],False)

            data['query'] = query
        except Exception as e:
            data['error'] = str(e)
            self.log.error(str(e))

        return data

    @view_config(route_name='ttl', request_method='GET')
    def upload(self):

        response = FileResponse(
            'askomics/ttl/'+self.request.matchdict['name'],
            content_type='text/turtle'
            )
        return response
