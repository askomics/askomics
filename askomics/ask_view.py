#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import os,sys,traceback
import re,shutil

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
from askomics.libaskomics.rdfdb.SparqlQueryGraph import SparqlQueryGraph
from askomics.libaskomics.rdfdb.SparqlQueryStats import SparqlQueryStats
from askomics.libaskomics.rdfdb.SparqlQueryAuth import SparqlQueryAuth
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.rdfdb.ResultsBuilder import ResultsBuilder
from askomics.libaskomics.source_file.SourceFile import SourceFile

from pyramid.httpexceptions import (
    HTTPForbidden,
    HTTPFound,
    HTTPNotFound,
    )

from validate_email import validate_email

from askomics.libaskomics.Security import Security

@view_defaults(renderer='json', route_name='start_point')
class AskView(object):
    """ This class contains method calling the libaskomics functions using parameters from the js web interface (body variable) """

    def __init__(self, request):
        # Manage solution/data/error inside. This object is return to client side
        self.data = {}
        self.log = logging.getLogger(__name__)
        self.request = request
        self.settings = request.registry.settings

        try:

            if 'admin' not in self.request.session.keys():
                self.request.session['admin'] = False

            if 'blocked' not in self.request.session.keys():
                self.request.session['blocked'] = True

            if 'group' not in self.request.session.keys():
                self.request.session['group'] = ''

            self.request.session['from'] = []
            if 'username' not in self.request.session.keys():
                self.request.session['username'] = ''
            else:
                #finding all private graph graph
                sqg = SparqlQueryGraph(self.settings, self.request.session)
                ql = QueryLauncher(self.settings, self.request.session)
                results = ql.process_query(sqg.get_private_graphs().query)

                for elt in results:
                    self.request.session['from'].append(elt['g'])

                # self.request.session = {}

            #finding all public graph
            sqg = SparqlQueryGraph(self.settings, self.request.session)
            ql = QueryLauncher(self.settings, self.request.session)
            results = ql.process_query(sqg.get_public_graphs().query)

            for elt in results:
                self.request.session['from'].append(elt['g'])

        except Exception as e:
                traceback.print_exc(file=sys.stdout)
                self.data['error'] = str(e)
                self.log.error(str(e))

    def check_error(self):
        if 'error' in self.data :
            return True
        return False

    @view_config(route_name='start_point', request_method='GET')
    def start_points(self):
        """ Get the nodes being query starters """
        self.log.debug("== START POINT ==")

        if self.check_error() :
            return self.data

        tse = TripleStoreExplorer(self.settings, self.request.session)
        nodes = tse.get_start_points()

        self.data['nodes'] = {}

        for node in nodes:
            if node['uri'] in self.data['nodes'].keys():
                if node['public'] and not self.data['nodes'][node['uri']]['public']:
                    self.data['nodes'][node['uri']]['public'] = True
                if node['private'] and not self.data['nodes'][node['uri']]['private']:
                    self.data['nodes'][node['uri']]['private'] = True
            else:
                self.data['nodes'][node['uri']] = node

        return self.data

    @view_config(route_name='statistics', request_method='GET')
    def statistics(self):
        """
        Get stats
        """
        # Denny access for non loged users
        if self.request.session['username'] == '':
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'

        self.log.debug('=== stats ===')

        self.data['username'] = self.request.session['username']

        sqs = SparqlQueryStats(self.settings, self.request.session)
        qlaucher = QueryLauncher(self.settings, self.request.session)

        public_stats = {}
        private_stats = {}

        # Number of triples
        results_pub = qlaucher.process_query(sqs.get_number_of_triples().query)
        results_priv = qlaucher.process_query(sqs.get_number_of_triples().query)

        public_stats['ntriples'] = results_pub[0]['number']
        private_stats['ntriples'] = results_priv[0]['number']

        # Number of entities
        results_pub = qlaucher.process_query(sqs.get_number_of_entities().query)
        results_priv = qlaucher.process_query(sqs.get_number_of_entities().query)

        public_stats['nentities'] = results_pub[0]['number']
        private_stats['nentities'] = results_priv[0]['number']

        # Number of classes
        results_pub = qlaucher.process_query(sqs.get_number_of_classes().query)
        results_priv = qlaucher.process_query(sqs.get_number_of_classes().query)

        public_stats['nclasses'] = results_pub[0]['number']
        private_stats['nclasses'] = results_priv[0]['number']

        # Number of graphs
        results_pub = qlaucher.process_query(sqs.get_number_of_subgraph().query)
        results_priv = qlaucher.process_query(sqs.get_number_of_subgraph().query)

        public_stats['ngraphs'] = results_pub[0]['number']
        private_stats['ngraphs'] = results_priv[0]['number']

        # Graphs info
        results_pub = qlaucher.process_query(sqs.get_subgraph_infos().query)
        results_priv = qlaucher.process_query(sqs.get_subgraph_infos().query)

        public_stats['graphs'] = results_pub
        private_stats['graphs'] = results_priv

        # Classes and relations
        results_pub = qlaucher.process_query(sqs.get_rel_of_classes().query)
        results_priv = qlaucher.process_query(sqs.get_rel_of_classes().query)

        # public_stats['class_rel'] = results_pub
        # private_stats['class_rel'] = results_priv

        tmp = {}

        for result in results_pub:
            if result['domain'] not in tmp.keys():
                tmp[result['domain']] = []
            if result['relname'] not in tmp[result['domain']]:
                tmp[result['domain']].append({'relname': result['relname'], 'target': result['range']})
        public_stats['class_rel'] = tmp

        tmp = {}

        for result in results_priv:
            if result['domain'] not in tmp.keys():
                tmp[result['domain']] = []
            if result['relname'] not in tmp[result['domain']]:
                tmp[result['domain']].append({'relname': result['relname'], 'target': result['range']})
        private_stats['class_rel'] = tmp

        # class and attributes
        results_pub = qlaucher.process_query(sqs.get_attr_of_classes().query)
        results_priv = qlaucher.process_query(sqs.get_attr_of_classes().query)

        tmp = {}

        for result in results_pub:
            if result['class'] not in tmp.keys():
                tmp[result['class']] = []
            if result['attr'] not in tmp[result['class']]:
                tmp[result['class']].append(result['attr'])
        public_stats['class_attr'] = tmp

        tmp = {}

        for result in results_priv:
            if result['class'] not in tmp.keys():
                tmp[result['class']] = []
            if result['attr'] not in tmp[result['class']]:
                tmp[result['class']].append(result['attr'])
        private_stats['class_attr'] = tmp

        self.data['public'] = public_stats
        self.data['private'] = private_stats

        return self.data

    @view_config(route_name='empty_user_database', request_method='GET')
    def empty_database(self):
        """
        Delete all named graphs and their metadatas
        """

        # Denny access for non loged users
        if self.request.session['username'] == '':
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'

        self.log.debug("=== DELETE ALL NAMED GRAPHS ===")

        try:
            sqb = SparqlQueryBuilder(self.settings, self.request.session)
            ql = QueryLauncher(self.settings, self.request.session)

            named_graphs = self.get_list_private_graphs()

            for graph in named_graphs:
                self.log.debug("--- DELETE GRAPH : %s", graph)
                ql.execute_query(sqb.get_drop_named_graph(graph).query)
                #delete metadatas
                ql.execute_query(sqb.get_delete_metadatas_of_graph(graph).query)

        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.log.error(str(e))

        return self.data

    @view_config(route_name='delete_graph', request_method='POST')
    def delete_graph(self):
        """
        Delete selected named graphs and their metadatas
        """

        # Denny access for non loged users
        if self.request.session['username'] == '':
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'

        self.log.debug("=== DELETE SELECTED GRAPHS ===")

        sqb = SparqlQueryBuilder(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)

        graphs = self.request.json_body['namedGraphs']

        for graph in graphs:
            self.log.debug("--- DELETE GRAPH : %s", graph)
            ql.execute_query(sqb.get_drop_named_graph(graph).query)
            #delete metadatas
            ql.execute_query(sqb.get_delete_metadatas_of_graph(graph).query)

    @view_config(route_name='list_private_graphs', request_method='GET')
    def get_list_private_graphs(self):
        """
        Return a list with all the named graphs.
        """

        # Denny access for non loged users
        if self.request.session['username'] == '':
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'

        self.log.debug("=== LIST OF NAMED GRAPHS ===")

        sqg = SparqlQueryGraph(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)

        res = ql.execute_query(sqg.get_private_graphs().query)

        namedGraphs = []

        for indexResult in range(len(res['results']['bindings'])):
            namedGraphs.append(res['results']['bindings'][indexResult]['g']['value'])

        return namedGraphs

    @view_config(route_name='positionable_attr', request_method='POST')
    def positionable_attr(self):
        """
        Return the positionable attributes in common between two positionable entity
        """
        #FIXEME: Rewrite this ugly method

        body = self.request.json_body

        sqg = SparqlQueryGraph(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)

        # Check if the two entity are positionable
        positionable1 = ql.process_query(sqg.get_if_positionable(body['node']).query)
        positionable2 = ql.process_query(sqg.get_if_positionable(body['node']).query)

        if positionable1 == 0 or positionable2 == 0:
            self.data['error'] = 'Entities are not positionable nodes !'
            return self.data

        results = ql.process_query(sqg.get_common_pos_attr(body['node'], body['second_node']).query)
        self.log.debug(results)

        self.data['results'] = {}

        list_pos_attr = []

        for elem in results:
            if elem['pos_attr'] not in list_pos_attr:
                list_pos_attr.append(elem['pos_attr'].replace("http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#", ""))

        for elem in list_pos_attr:
            self.data['results'][elem] = False not in [bool(int(p['status'])) for p in results if p['pos_attr'] == "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#"+elem]

        return self.data

    @view_config(route_name='source_files_overview', request_method='GET')
    def source_files_overview(self):
        """
        Get preview data for all the available files
        """

        # Denny access for non loged users
        if self.request.session['username'] == '':
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'

        self.log.debug(" ========= Askview:source_files_overview =============")
        sfc = SourceFileConvertor(self.settings, self.request.session)

        source_files = sfc.get_source_files()

        self.data['files'] = []

        # get all taxon in the TS
        sqg = SparqlQueryGraph(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)
        res = ql.execute_query(sqg.get_all_taxons().query)
        taxons_list = []
        for elem in res['results']['bindings']:
            taxons_list.append(elem['taxon']['value'])
        self.data['taxons'] = taxons_list

        for src_file in source_files:
            infos = {}
            infos['name'] = src_file.name
            infos['type'] = src_file.type
            if src_file.type == 'tsv':
                try:
                    infos['headers'] = src_file.headers
                    infos['preview_data'] = src_file.get_preview_data()
                    infos['column_types'] = []
                    header_num = 0
                    for ih in range(0, len(infos['headers'])):
                        #if infos['headers'][ih].find("@")>0:
                        #    infos['column_types'].append("entity")
                        #else:
                        infos['column_types'].append(src_file.guess_values_type(infos['preview_data'][ih], infos['headers'][header_num]))
                        header_num += 1
                except Exception as e:
                    traceback.print_exc(file=sys.stdout)
                    infos['error'] = 'Could not read input file, are you sure it is a valid tabular file?'
                    self.log.error(str(e))

                self.data['files'].append(infos)

            elif src_file.type == 'gff':
                try:
                    entities = src_file.get_entities()
                    infos['entities'] = entities
                except Exception as e:
                    self.log.debug('error !!')
                    traceback.print_exc(file=sys.stdout)
                    infos['error'] = 'Could not parse the file, are you sure it is a valid GFF3 file?'
                    self.log.error('error with gff examiner: ' + str(e))

                self.data['files'].append(infos)

            elif src_file.type == 'ttl':
                infos['preview'] = src_file.get_preview_ttl()
                self.data['files'].append(infos)


        return self.data


    @view_config(route_name='preview_ttl', request_method='POST')
    def preview_ttl(self):
        """
        Convert tabulated files to turtle according to the type of the columns set by the user
        """

        # Denny access for non loged users
        if self.request.session['username'] == '':
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'


        self.log.debug("preview_ttl")

        body = self.request.json_body
        file_name = body["file_name"]
        col_types = body["col_types"]
        disabled_columns = body["disabled_columns"]
        key_columns = body["key_columns"]

        sfc = SourceFileConvertor(self.settings, self.request.session)

        src_file = sfc.get_source_file(file_name)
        src_file.set_forced_column_types(col_types)
        src_file.set_disabled_columns(disabled_columns)
        src_file.set_key_columns(key_columns)

        cont_ttl = '\n'.join(src_file.get_turtle(preview_only=True))
        self.data = textwrap.dedent(
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
        """).format(header=sfc.get_turtle_template(cont_ttl),
                    content_ttl = cont_ttl,
                    abstraction_ttl = src_file.get_abstraction(),
                    domain_knowledge_ttl = src_file.get_domain_knowledge()
                    )

        formatter = HtmlFormatter(cssclass='preview_field', nowrap=True, nobackground=True)
        return highlight(self.data, TurtleLexer(), formatter) # Formated html

    @view_config(route_name='check_existing_data', request_method='POST')
    def check_existing_data(self):
        """
        Compare the user data and what is already in the triple store
        """

        # Denny access for non loged users
        if self.request.session['username'] == '':
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'

        body = self.request.json_body
        file_name = body["file_name"]
        col_types = body["col_types"]
        disabled_columns = body["disabled_columns"]
        key_columns = body["key_columns"]

        sfc = SourceFileConvertor(self.settings, self.request.session)
        try:
            src_file = sfc.get_source_file(file_name)
            src_file.set_forced_column_types(col_types)
            src_file.set_disabled_columns(disabled_columns)
            src_file.set_key_columns(key_columns)

            headers_status, missing_headers = src_file.compare_to_database()

            self.data["headers_status"] = headers_status
            self.data["missing_headers"] = missing_headers
        except Exception as e:
            self.data["headers_status"] = ""
            self.data["missing_headers"] = ""
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.log.error(str(e))

        return self.data

    @view_config(route_name='load_data_into_graph', request_method='POST')
    def load_data_into_graph(self):
        """
        Load tabulated files to triple store according to the type of the columns set by the user
        """

        # Denny access for non loged users
        if self.request.session['username'] == '':
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'

        body = self.request.json_body
        file_name = body["file_name"]
        col_types = body["col_types"]
        disabled_columns = body["disabled_columns"]
        key_columns = body["key_columns"]
        public = body['public']

        # Allow data integration in public graph only if user is an admin
        if public and not self.request.session['admin']:
            self.log.debug('/!\\ --> NOT ALLOWED TO INSERT IN PUBLIC GRAPH <-- /!\\')
            public = False

        try:
            sfc = SourceFileConvertor(self.settings, self.request.session)

            src_file = sfc.get_source_file(file_name)
            src_file.set_forced_column_types(col_types)
            src_file.set_disabled_columns(disabled_columns)
            src_file.set_key_columns(key_columns)

            method = 'load'
            self.data = src_file.persist(self.request.host_url, method, public)
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = 'Probleme with user data file ?</br>'+str(e)
            self.log.error(str(e))

        return self.data

    @view_config(route_name='load_gff_into_graph', request_method='POST')
    def load_gff_into_graph(self):
        """
        Load GFF file into the triplestore
        """

        # Denny access for non loged users
        if self.request.session['username'] == '':
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'


        self.log.debug("== load_gff_into_graph ==")

        body = self.request.json_body
        self.log.debug('===> body: '+str(body))
        file_name = body['file_name']
        taxon = body['taxon']
        entities = body['entities']
        public = body['public']

        # Allow data integration in public graph only if user is an admin
        if public and not self.request.session['admin']:
            self.log.debug('/!\\ --> NOT ALLOWED TO INSERT IN PUBLIC GRAPH <-- /!\\')
            public = False

        sfc = SourceFileConvertor(self.settings, self.request.session)
        src_file_gff = sfc.get_source_file_gff(file_name, taxon, entities)

        method = 'load'
        try:
            self.log.debug('--> Parsing GFF')
            src_file_gff.persist(self.request.host_url, method, public)
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = 'Problem when integration of '+file_name+'.</br>'+str(e)
            self.log.error(str(e))

        return self.data

    @view_config(route_name='load_ttl_into_graph', request_method='POST')
    def load_ttl_into_graph(self):
        """
        Load TTL file into the triplestore
        """

        # Denny access for non loged users
        if self.request.session['username'] == '':
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'


        self.log.debug('*** load_ttl_into_graph ***')

        body = self.request.json_body
        file_name = body['file_name']
        public = body['public']

        # Allow data integration in public graph only if user is an admin
        if public and not self.request.session['admin']:
            self.log.debug('/!\\ --> NOT ALLOWED TO INSERT IN PUBLIC GRAPH <-- /!\\')
            public = False

        sfc = SourceFileConvertor(self.settings, self.request.session)
        src_file_ttl = sfc.get_source_file(file_name)

        try:
            src_file_ttl.persist(self.request.host_url, public)
        except Exception as e:
            self.data['error'] = 'Problem when integration of ' + file_name + '</br>' + str(e)
            self.log.error('ERROR: ' + str(e))

        return self.data


    @view_config(route_name='getUserAbstraction', request_method='GET')
    def getUserAbstraction(self):
        """ Get the user asbtraction to manage relation inside javascript """
        self.log.debug("== getUserAbstraction ==")

        tse = TripleStoreExplorer(self.settings, self.request.session)
        self.data.update(tse.getUserAbstraction())

        return self.data

    @view_config(route_name='importShortcut', request_method='POST')
    def importShortcut(self):
        """
        Import a shortcut definition into the triplestore
        """
        # Denny access for non loged users
        if self.request.session['username'] == '' or not self.request.session['admin'] :
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'

        self.log.debug('*** importShortcut ***')

        body = self.request.json_body
        sqb = SparqlQueryBuilder(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)
        sparqlHeader = sqb.header_sparql_config("")

        try:
            sparqlHeader += body["prefix"]+"\n"
            self.request.session['graph']
            ql.insert_data(body["shortcut_def"],'askomics:graph:shortcut',sparqlHeader);
        except Exception as e:
            #exc_type, exc_value, exc_traceback = sys.exc_info()
            #traceback.print_exc(limit=8)
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.log.error(str(e))

        return self.data

    @view_config(route_name='deleteShortcut', request_method='POST')
    def deleteShortcut(self):
        """
        Delete a shortcut definition into the triplestore
        """
        # Denny access for non loged users
        if self.request.session['username'] == '' or not self.request.session['admin'] :
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'

        self.log.debug('*** importShortcut ***')

        body = self.request.json_body
        sqb = SparqlQueryBuilder(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)

        try:
            query_string = sqb.header_sparql_config("")
            query_string += "\n"
            query_string += "DELETE {\n"
            query_string += "\tGRAPH "+ "<askomics:graph:shortcut>" +"\n"
            query_string += "\t\t{\n"
            query_string += "<"+body["shortcut"]+">" + " ?r ?a.\n"
            query_string += "\t\t}\n"
            query_string += "\t}\n"
            query_string += "WHERE{\n"
            query_string += "<"+body["shortcut"]+">" + " ?r ?a.\n"
            query_string += "\t}\n"

            res = ql.execute_query(query_string)
        except Exception as e:
            #exc_type, exc_value, exc_traceback = sys.exc_info()
            #traceback.print_exc(limit=8)
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.log.error(str(e))

        return self.data

    @view_config(route_name='sparqlquery', request_method='POST')
    def get_value(self):
        """ Build a request from a json whith the following contents :variates,constraintesRelations,constraintesFilters"""
        self.log.debug("== Attribute Value ==")

        tse = TripleStoreExplorer(self.settings, self.request.session)
        body = self.request.json_body
        try:
            results,query = tse.build_sparql_query_from_json(body["variates"],body["constraintesRelations"],body["limit"],True)

            # Remove prefixes in the results table
            self.data['values'] = results

            if not body['export']:
                return self.data


            # Provide results file
            ql = QueryLauncher(self.settings, self.request.session)
            rb = ResultsBuilder(self.settings, self.request.session)
            self.data['file'] = ql.format_results_csv(rb.build_csv_table(results))
        except Exception as e:
            #exc_type, exc_value, exc_traceback = sys.exc_info()
            #traceback.print_exc(limit=8)
            traceback.print_exc(file=sys.stdout)
            self.data['values'] = ""
            self.data['file'] = ""
            self.data['error'] = str(e)
            self.log.error(str(e))

        return self.data

    @view_config(route_name='getSparqlQueryInTextFormat', request_method='POST')
    def getSparqlQueryInTextFormat(self):
        """ Build a request from a json whith the following contents :variates,constraintesRelations,constraintesFilters"""
        self.log.debug("== Attribute Value ==")
        try:
            tse = TripleStoreExplorer(self.settings, self.request.session)

            body = self.request.json_body
            results,query = tse.build_sparql_query_from_json(body["variates"],body["constraintesRelations"],body["limit"],False)

            self.data['query'] = query
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.log.error(str(e))

        return self.data

    @view_config(route_name='ttl', request_method='GET')
    def upload(self):

        response = FileResponse(
            'askomics/ttl/'+self.request.matchdict['name'],
            content_type='text/turtle'
            )
        return response

    @view_config(route_name='signup', request_method='POST')
    def signup(self):
        body = self.request.json_body
        username = body['username']
        email = body['email']
        password = body['password']
        password2 = body['password2']

        self.log.debug('==== user info ====')
        self.log.debug('username: ' + username)
        self.log.debug('email: ' + email)

        self.data['error'] = []
        error = False

        security = Security(self.settings, self.request.session, username, email, password, password2)

        is_valid_email = security.check_email()
        are_passwords_identical = security.check_passwords()
        is_pw_enough_longer = security.check_password_length()
        is_username_already_exist = security.check_username_in_database()
        is_email_already_exist = security.check_email_in_database()

        if not is_valid_email:
            self.data['error'].append('Email is not valid')
            error = True

        if not are_passwords_identical:
            self.data['error'].append('Passwords are not identical')
            error = True

        if not is_pw_enough_longer:
            self.data['error'].append('Password must be at least 8 characters')
            error = True

        if is_username_already_exist:
            self.data['error'].append('Username already exist')
            error = True

        if is_email_already_exist:
            self.data['error'].append('Email already exist')
            error = True

        if error:
            return self.data

        # no error, insert user in TS
        try:
            security.persist_user()
            pass
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = traceback.format_exc(limit=8)+"\n\n\n"+str(e)
            self.log.error(str(e))

        # Create user graph
        try:
            security.create_user_graph()
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = traceback.format_exc(limit=8)+"\n\n\n"+str(e)
            self.log.error(str(e))

        # Log user
        try:
            security.log_user(self.request)
            self.data['username'] = username
            admin_blocked = security.get_admin_blocked_by_username()
            self.data['admin'] = admin_blocked['admin']
            self.data['blocked'] = admin_blocked['blocked']
        except Exception as e:
            self.data['error'] = traceback.format_exc(limit=8)+"\n\n\n"+str(e)
            self.log.error(str(e))

        return self.data

    @view_config(route_name='checkuser', request_method='GET')
    def checkuser(self):

        if self.request.session['username'] != '':
            self.data['username'] = self.request.session['username']
            self.data['admin'] = self.request.session['admin']
            self.data['blocked'] = self.request.session['blocked']

        return self.data


    @view_config(route_name='logout', request_method='GET')
    def logout(self):
        """
        Log out the user, reset the session
        """

        self.request.session['username'] = ''
        self.request.session['admin'] = ''
        self.request.session['graph'] = ''

        return

    @view_config(route_name='login', request_method='POST')
    def login(self):
        body = self.request.json_body
        username_email = body['username_email']
        password = body['password']
        username = ''
        email = ''

        self.data['error'] = []
        error = False

        if validate_email(username_email):
            email = username_email
            auth_type = 'email'
        else:
            username = username_email
            auth_type = 'username'

        security = Security(self.settings, self.request.session, username, email, password, password)

        if auth_type == 'email':
            email_in_ts = security.check_email_in_database()

            if not email_in_ts:
                self.data['error'].append('email is not registered')
                error = True

            if error:
                return self.data

            password_is_correct = security.check_email_password()

            if not password_is_correct:
                self.data['error'].append('Password is incorrect')
                error = True

            # Get the admin and blocked status
            admin_blocked = security.get_admin_blocked_by_email()
            security.set_admin(admin_blocked['admin'])
            security.set_blocked(admin_blocked['blocked'])

            if error:
                return self.data

        elif auth_type == 'username':
            username_in_ts = security.check_username_in_database()

            if not username_in_ts:
                self.data['error'].append('username is not registered')
                error = True

            # Get the admin and blocked status
            admin_blocked = security.get_admin_blocked_by_username()
            security.set_admin(admin_blocked['admin'])
            security.set_blocked(admin_blocked['blocked'])

            if error:
                return self.data

            password_is_correct = security.check_username_password()

            if not password_is_correct:
                self.data['error'].append('Password is incorrect')
                error = True

            if error:
                return self.data

        # User pass the authentication, log him
        try:
            security.log_user(self.request)
            self.data['username'] = username
            self.data['admin'] = admin_blocked['admin']
            self.data['blocked'] = admin_blocked['blocked']

        except Exception as e:
            self.data['error'] = str(e)
            self.log.error(str(e))

        return self.data

    @view_config(route_name='get_users_infos', request_method='GET')
    def get_users_infos(self):
        """
        For each users store in the triplesore, get their username, email,
        and admin status
        """

        # Denny access for non loged users or non admin users
        if self.request.session['username'] == '' or not self.request.session['admin']:
            return 'forbidden'

        # Denny for blocked users
        if self.request.session['blocked']:
            return 'blocked'

        sqa = SparqlQueryAuth(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)

        try:
            result = ql.process_query(sqa.get_users_infos().query)
        except Exception as e:
            self.data['error'] = str(e)
            self.log.error(str(e))

        self.log.debug(result)

        self.data['result'] = result

        return self.data
