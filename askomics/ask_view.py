#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re

from pyramid.view import view_config, view_defaults
from pyramid.response import FileResponse

import logging
from pprint import pformat

from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.TripleStoreExplorer import TripleStoreExplorer
from askomics.libaskomics.SourceFileConvertor import SourceFileConvertor
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.rdfdb.ResultsBuilder import ResultsBuilder
from askomics.libaskomics.graph.Node import Node
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
        # l'increment des variables est reinitialisé
        dico_counter = {}
        tse = TripleStoreExplorer(self.settings, self.request.session, dico_counter)

        nodes = tse.get_start_points()

        data["nodes"] = {n.get_id(): n.to_dict() for n in nodes}
        data["last_new_counter"] = tse.get_counter()

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
        data["ntriples"] = results[0]["no"]

        results = ql.process_query(sqb.get_statistics_number_of_entities().query)
        data["nentities"] = results[0]["no"]

        results = ql.process_query(sqb.get_statistics_distinct_classes().query)
        data["nclasses"] = results[0]["no"]

        # Get the list of classes
        res_list_classes = ql.process_query(sqb.get_statistics_list_classes().query)

        data["class"] = {}
        for obj in res_list_classes:
            class_name = pm.remove_prefix(obj['class'])
            data["class"][class_name] = {}

        # Get the number of instances by class
        res_nb_instances = ql.process_query(sqb.get_statistics_nb_instances_by_classe().query)

        for obj in res_nb_instances:
            if 'class' in obj:
                class_name = pm.remove_prefix(obj['class'])
                data["class"][class_name]["count"] = obj['count']

        # Get details on relations for each classes
        for obj in res_list_classes:
            if 'class' in obj:
                class_name = pm.remove_prefix(obj['class'])
                uri = obj['class']

                shortcuts_list = tse.has_setting(uri, 'shortcut')

                src = Node(class_name, # We don't care about counter in stats
                    uri,
                    class_name,
                    shortcuts_list)

                attributes, nodes, links = tse.get_neighbours_for_node(src, None)

                data["class"][class_name]["attributes"] = [a.to_dict() for a in attributes]
                data["class"][class_name]["neighbours"] = [n.to_dict() for n in nodes]
                data["class"][class_name]["relations"] = [l.to_dict() for l in links]

        return data

    @view_config(route_name='source_files_overview', request_method='GET')
    def source_files_overview(self):
        """
        Get preview data for all the available files
        """
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
                infos['column_types'] = src_file.guess_column_types(infos['preview_data'])
            except Exception as e:
                infos['error'] = 'Could not read input file, are you sure it is a valid tabular file?'

            data['files'].append(infos)

        return data

    @view_config(route_name='preview_ttl', request_method='POST')
    def preview_ttl(self):
        """
        Convert tabulated files to turtle according to the type of the columns set by the user
        """
        data = {}

        body = self.request.json_body
        file_name = body["file_name"]
        col_types = body["col_types"]
        disabled_columns = body["disabled_columns"]

        sfc = SourceFileConvertor(self.settings, self.request.session)

        src_file = sfc.get_source_file(file_name)
        src_file.set_forced_column_types(col_types)
        src_file.set_disabled_columns(disabled_columns)

        content_ttl = '\n'.join(src_file.get_turtle(preview_only=True))
        abstraction_ttl = src_file.get_abstraction()
        domain_knowledge_ttl = src_file.get_domain_knowledge()

        data["header"] = sfc.get_turtle_template()
        data["content_ttl"] = content_ttl
        data["abstraction_ttl"] = abstraction_ttl
        data["domain_knowledge_ttl"] = domain_knowledge_ttl

        return data

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

        src_file = sfc.get_source_file(file_name)
        src_file.set_forced_column_types(col_types)
        src_file.set_disabled_columns(disabled_columns)

        headers_status, missing_headers = src_file.compare_to_database()

        data["headers_status"] = headers_status
        data["missing_headers"] = missing_headers

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

        sfc = SourceFileConvertor(self.settings, self.request.session)

        src_file = sfc.get_source_file(file_name)
        src_file.set_forced_column_types(col_types)
        src_file.set_disabled_columns(disabled_columns)

        urlbase = re.search(r'(http:\/\/.*)\/.*', self.request.current_route_url())
        urlbase = urlbase.group(1)

        data = src_file.persist(urlbase)

        return data

    @view_config(route_name='expand', request_method='POST')
    def expansion(self):
        """
        Get the neighbours of a node
        """

        data = {}
        tse = TripleStoreExplorer(self.settings, self.request.session)

        body = self.request.json_body
        self.log.debug("Received json query: "+str(body))

        source_node = body["source_node"]
        prev_node = body["source_previous_node"]
        tse.set_counter(body["last_new_counter"])

        uri_new_instance = None
        #if "typeNewInstance" in body:
        #    uri_new_instance=body["uri_new_instance"] # FIXME what is it?

        src = Node(source_node["id"],
                source_node["uri"],
                source_node["label"],
                source_node["shortcuts"])

        attributes, nodes, links = tse.get_neighbours_for_node(src, uri_new_instance)

        data["nodes"] = [n.to_dict() for n in nodes]
        data["links"] = [l.to_dict() for l in links]
        data["attributes"] = [a.to_dict() for a in attributes]

        if prev_node != None:
            self.log.debug("----------PREV NODE ============================================")

            # to replace the current node in a suggested mode

            uri_new_instance = source_node["uri"]

            src = Node(prev_node["id"],
                prev_node["uri"],
                prev_node["label"],
                prev_node["shortcuts"])

            attributes, nodes, links = tse.get_neighbours_for_node(src, uri_new_instance)

            data["nodes"].append(nodes[0].to_dict())
            data["links"].append(links[0].to_dict())
            #data["attributes"].append([a.to_dict() for a in attributes])

        data["last_new_counter"] = tse.get_counter()

        if self.log.isEnabledFor(logging.DEBUG):
            self.log.debug("Counters: "+str(data["last_new_counter"]))
            self.log.debug("------LINKS-----\n%s", pformat(data["links"]))
            self.log.debug("------NODES-----\n%s", pformat(data["nodes"]))
            self.log.debug("---ATTRIBUTES---\n%s", pformat(data["attributes"]))

        return data

    @view_config(route_name='attribute_value', request_method='POST')
    def get_value(self):
        """ Get different categories for a node class """
        self.log.debug("== Attribute Value ==")
        data = {}

        tse = TripleStoreExplorer(self.settings, self.request.session)

        body = self.request.json_body

        data["value"] = tse.has_category(body["entity"], body["category"], body["category_uri"])

        return data

    @view_config(route_name='link_attribute', request_method='POST')
    def attributes(self):
        """ Get the attributes of a link described by a specified_by relation """
        self.log.debug("== Link ==")
        data = {}

        tse = TripleStoreExplorer(self.settings, self.request.session)

        body = self.request.json_body
        tse.set_counter(body["last_new_counter"])

        attributes = tse.get_attributes_of(body["uri"])
        specif = tse.has_setting(body["uri"], 'specify_relation')

        # TODO : Need to be modified if multiple specify_relation
        data["relation"] = specif[0]

        data["attributes"] = [a.to_dict() for a in attributes]
        data["last_new_counter"] = tse.get_counter()
        return data

    @view_config(route_name='query', request_method='POST')
    def launch_query(self):
        """ Converts the constraints table created by the graph to a sparql query, send it to the database and compile the results"""
        data = {}
        body = self.request.json_body

        export = bool(int(body['export']))
        sqb = SparqlQueryBuilder(self.settings, self.request.session)
        return_only_query = bool(int(body['return_only_query']))

        if body['uploaded'] != '':
            if export:
                query = body['uploaded'].replace('LIMIT 30', 'LIMIT 10000')
            else:
                query = body['uploaded']
        else:
            query = sqb.load_from_query_json(body).query

        if return_only_query:
            data['query'] = query
            return data

        ql = QueryLauncher(self.settings, self.request.session)
        rb = ResultsBuilder(self.settings, self.request.session)


        results = ql.process_query(query)

        if export:
            data['file'] = ql.format_results_csv(rb.build_csv_table(results))
        else:
            entity_name_list, entity_list_attributes = rb.organize_attribute_and_entity(results, body['constraint'])

            data['results_entity_name'] = entity_name_list
            data['results_entity_attributes'] = entity_list_attributes

            data['results'] = [
                {
                    k: res[k].replace(self.settings["askomics.prefix"], '')
                    for k in res.keys()
                }
                for res in results
            ]

        self.log.debug("== results ==\n%s", pformat(results))

    #    data['query'] = query

        return data

    @view_config(route_name='ttl', request_method='GET')
    def upload(self):

        response = FileResponse(
            'askomics/ttl/'+self.request.matchdict['name'],
            content_type='text/turtle'
            )
        return response
