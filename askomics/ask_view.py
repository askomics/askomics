#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import tempfile
import re

from pyramid.view import view_config, view_defaults
from pyramid.response import FileResponse

import logging

from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.TripleStoreExplorer import TripleStoreExplorer
from askomics.libaskomics.SourceFileConvertor import SourceFileConvertor
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.rdfdb.ResultsBuilder import ResultsBuilder
from askomics.libaskomics.graph.Node import Node

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

        #data["nodes"] = {n.get_id(): n.to_dict() for n in nodes}
        data["nodes"] = {n.get_uri(): n.to_dict() for n in nodes}
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

    @view_config(route_name='source_file_overview', request_method='GET')
    def source_file_overview(self):
        """ Get the first lines of the tabulated files to convert """
        data = {}
        sfc = SourceFileConvertor(self.settings, self.request.session)

        pm = ParamManager(self.settings, self.request.session)

        source_files_first_lines = sfc.get_first_lines(int(self.settings["askomics.overview_lines_limit"])) # FIXME handle default value/value validation
        html_template = sfc.get_template(pm.ASKOMICS_html_template) # FIXME there must be a more elegant solution
        #turtle_template = sfc.get_template(self.settings["askomics.turtle_template"]) # FIXME there must be a more elegant solution

        turtle_template = pm.turtle_template()
        data["sourceFiles"] = {s.get_name(): s.to_dict() for s in source_files_first_lines}
        data["html_template"] = html_template
        data["turtle_template"] = turtle_template

        return data

    @view_config(route_name='load_data_into_graph', request_method='POST')
    def load_data_into_graph(self):
        """ Convert tabulated files to turtle according to the type of the columns set by the user """
        data = {}
        sfc = SourceFileConvertor(self.settings, self.request.session)

        body = self.request.json_body
        file_name = body["file_name"]
        col_types = body["col_types"]
        limit = body["limit"]

        start_position_list = []
        attribute_list_output = []
        request_output_has_header_domain = {}
        request_output_domain = []
        request_abstraction_output = []

        missing_headers, new_headers, present_headers, attribute_code, relation_code, domain_code = sfc.get_turtle(file_name, col_types, limit, start_position_list, attribute_list_output, request_output_has_header_domain, request_output_domain, request_abstraction_output)

        ql = QueryLauncher(self.settings, self.request.session)

        if not limit:
            # use insert data instead of load sparql procedure when a dataset is small.....
            if len(attribute_list_output)+len(request_abstraction_output)+len(request_output_domain) > 200:
                first = True
                keep_going = True
                data["temp_ttl_file"] = []
                while keep_going:
                    with tempfile.NamedTemporaryFile(dir="askomics/ttl/", suffix=".ttl", mode="w", delete=False) as fp:
                        # Temp files are removed by clean_ttl_directory route
                        l_empty = []
                        ql.build_query_load(l_empty, fp, header=True)
                        if first:
                            for header_sparql_request in request_output_has_header_domain.values():
                                if len(header_sparql_request) > 0:
                                    self.log.info("header_sparql_request - Number of object:"+str(len(header_sparql_request)))
                                    ql.build_query_load(header_sparql_request, fp)

                            if len(request_abstraction_output) > 0:
                                self.log.info("request_abstraction_output - Number of object:"+str(len(request_abstraction_output)))
                                ql.build_query_load(request_abstraction_output, fp)

                            if len(request_output_domain) > 0:
                                self.log.info("request_output_domain - Number of object:"+str(len(request_output_domain)))
                                ql.build_query_load(request_output_domain, fp)

                            if len(start_position_list) > 0:
                                self.log.info("start_position_list - Number of object:"+str(len(start_position_list)))
                                ql.build_query_load(start_position_list, fp)

                        first = False

                        if len(attribute_list_output) > 0:
                            subattribute_list_output = attribute_list_output[:min(60000, len(attribute_list_output))]
                            del attribute_list_output[:min(60000, len(attribute_list_output))]
                            if len(attribute_list_output) == 0:
                                keep_going = False
                            self.log.info("subattribute_list_output - Number of object:"+str(len(subattribute_list_output)))
                            ql.build_query_load(subattribute_list_output, fp)
                        else:
                            keep_going = False

                        urlbase = re.search(r'(http:\/\/.*)\/.*', self.request.current_route_url())
                        ql.update_query_load(fp, urlbase.group(1))
                        data["temp_ttl_file"].append(fp.name)
            else:
                self.log.info(" ===> insert update nb object:"+str(len(attribute_list_output)+len(request_abstraction_output)+len(request_output_domain)))
                for header_sparql_request in request_output_has_header_domain.values():
                    if len(header_sparql_request) > 0:
                        ql.update_query_insert_data(header_sparql_request)
                if len(request_abstraction_output) > 0:
                    ql.update_query_insert_data(request_abstraction_output)
                if len(request_output_domain) > 0:
                    ql.update_query_insert_data(request_output_domain)
                if len(start_position_list) > 0:
                    ql.update_query_insert_data(start_position_list)
                if len(attribute_list_output) > 0:
                    ql.update_query_insert_data(attribute_list_output)


        #f = open('askomics/ttl/Insert.ttl', 'r')
        #urlbase = m = re.search('(http:\/\/.*)\/.*', self.request.current_route_url())
        #ql.update_query_load(f,urlbase.group(1))

        data["missing_headers"] = missing_headers
        data["new_headers"] = new_headers
        data["present_headers"] = present_headers
        data["attribute_code"] = attribute_code
        data["relation_code"] = relation_code
        data["domain_code"] = domain_code


        return data

    @view_config(route_name='clean_ttl_directory', request_method='POST')
    def clean_ttl_directory(self):
        """ Convert tabulated files to turtle according to the type of the columns set by the user """
        data = {}

        if "files_to_delete" in self.request.json_body:
            for ifile in self.request.json_body["files_to_delete"]:
                if os.path.exists(ifile):
                    os.remove(ifile)

        return data

    @view_config(route_name='getUserAbstraction', request_method='POST')
    def getUserAbstraction(self):
        """ Get the user asbtraction to manage relation inside javascript """
        self.log.debug("== getUserAbstraction ==")

        #data = {}
        tse = TripleStoreExplorer(self.settings, self.request.session)

        body = self.request.json_body

        data = tse.getUserAbstraction()

        #data["nodes"] = [n.to_dict() for n in nodes]
        #data["links"] = [l.to_dict() for l in links]
        #data["attributes"] = [a.to_dict() for a in attributes]

        return data

    @view_config(route_name='expand', request_method='POST')
    def expansion(self):
        """ Get the neighbours of a node """
        self.log.debug("== Expand ==")

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

        self.log.debug("Counters: "+str(data["last_new_counter"]))

        self.log.debug("------LINKS-----")
        for i in data["links"]:
            self.log.debug(i)
            self.log.debug("")
        self.log.debug("-----NODES------")
        for i in data["nodes"]:
            self.log.debug(i)
            self.log.debug("")
        self.log.debug("----ATTRIBUTES-------")
        for i in data["attributes"]:
            self.log.debug(i)
            self.log.debug("")

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

        self.log.debug("== results ==")
        for elt in results:
            self.log.debug(elt)

    #    data['query'] = query

        return data

    @view_config(route_name='ttl', request_method='GET')
    def upload(self):

        response = FileResponse(
            'askomics/ttl/'+self.request.matchdict['name'],
            content_type='text/turtle'
            )
        return response
