#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import os,sys,traceback
import re,shutil

from pyramid.view import view_config, view_defaults
from pyramid.response import FileResponse

import logging
from pprint import pformat
import textwrap
import datetime
import humanize

from github import Github

from pygments import highlight
from pygments.lexers import TurtleLexer
from pygments.formatters import HtmlFormatter

from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.JobManager import JobManager
from askomics.libaskomics.EndpointManager import EndpointManager

from askomics.libaskomics.TripleStoreExplorer import TripleStoreExplorer
from askomics.libaskomics.SourceFileConvertor import SourceFileConvertor

from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.SparqlQueryGraph import SparqlQueryGraph
from askomics.libaskomics.rdfdb.SparqlQueryStats import SparqlQueryStats
from askomics.libaskomics.rdfdb.SparqlQueryAuth import SparqlQueryAuth

from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.rdfdb.MultipleQueryLauncher import MultipleQueryLauncher
from askomics.libaskomics.rdfdb.FederationQueryLauncher import FederationQueryLauncher

from askomics.libaskomics.source_file.SourceFile import SourceFile
from askomics.libaskomics.source_file.SourceFileURL import SourceFileURL

from askomics.libaskomics.GalaxyConnector import GalaxyConnector
from askomics.libaskomics.DatabaseConnector import DatabaseConnector


from pyramid.httpexceptions import (
    HTTPForbidden,
    HTTPFound,
    HTTPNotFound,
    exception_response
    )

from validate_email import validate_email

from askomics.libaskomics.LocalAuth import LocalAuth
from askomics.libaskomics.LdapAuth import LdapAuth

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

            if 'username' not in self.request.session.keys():
                self.request.session['username'] = ''

            if 'galaxy' not in self.request.session.keys():
                self.request.session['galaxy'] = False

        except Exception as e:
                traceback.print_exc(file=sys.stdout)
                self.data['error'] = str(e)
                self.log.error(str(e))

    def checkAuthSession(self):
        #https://fr.wikipedia.org/wiki/Liste_des_codes_HTTP

        # Denny access for non loged users
        if self.request.session['username'] == '':
            raise exception_response(401)

        # Denny for blocked users
        if self.request.session['blocked']:
            raise exception_response(423)


    def checkAdminSession(self):
        #Deny access for non admin session
        if not self.request.session['admin'] :
            raise exception_response(403)


    @view_config(route_name='start_point', request_method='GET')
    def start_points(self):
        """ Get the nodes being query starters """
        self.log.debug("== START POINT ==")

        try:

            sqb = SparqlQueryBuilder(self.settings, self.request.session)
            self.settings['graph'] = sqb.getGraphUser([])

            tse = TripleStoreExplorer(self.settings, self.request.session)
            nodes = tse.get_start_points()

            self.data['nodes'] = {}

            for node in nodes:
                if node['uri'] in self.data['nodes'].keys():
                    if node['public'] and not self.data['nodes'][node['uri']]['public']:
                        self.data['nodes'][node['uri']]['public'] = True
                    if node['private'] and not self.data['nodes'][node['uri']]['private']:
                        self.data['nodes'][node['uri']]['private'] = True
                    self.data['nodes'][node['uri']]['public_and_private'] = bool(
                        self.data['nodes'][node['uri']]['public'] and
                        self.data['nodes'][node['uri']]['private'])
                else:
                    self.data['nodes'][node['uri']] = node

        except Exception as e:
            self.request.response.status = 400
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)

        return self.data


    @view_config(route_name='statistics', request_method='GET')
    def statistics(self):
        """
        Get stats
        """
        self.checkAuthSession()

        self.log.debug('=== stats ===')

        self.data['username'] = self.request.session['username']

        sqs = SparqlQueryStats(self.settings, self.request.session)
        qlaucher = QueryLauncher(self.settings, self.request.session)
        qmlaucher = MultipleQueryLauncher(self.settings, self.request.session)
        em = EndpointManager(self.settings, self.request.session)

        public_stats = {}
        private_stats = {}

        lEndp = em.list_endpoints()
        # Number of triples
        results_pub = qmlaucher.process_query(sqs.get_number_of_triples('public'),lEndp)
        results_priv = qlaucher.process_query(sqs.get_number_of_triples('private'))

        public_stats['ntriples'] = results_pub[0]['number']
        private_stats['ntriples'] = results_priv[0]['number']

        # Number of entities
        results_pub = qmlaucher.process_query(sqs.get_number_of_entities('public'),lEndp)
        results_priv = qlaucher.process_query(sqs.get_number_of_entities('private'))

        public_stats['nentities'] = results_pub[0]['number']
        private_stats['nentities'] = results_priv[0]['number']

        # Number of classes
        results_pub = qmlaucher.process_query(sqs.get_number_of_classes('public'),lEndp)
        results_priv = qlaucher.process_query(sqs.get_number_of_classes('private'))

        public_stats['nclasses'] = results_pub[0]['number']
        private_stats['nclasses'] = results_priv[0]['number']

        # Number of graphs
        results_pub = qmlaucher.process_query(sqs.get_number_of_subgraph('public'),lEndp)
        results_priv = qlaucher.process_query(sqs.get_number_of_subgraph('private'))

        public_stats['ngraphs'] = results_pub[0]['number']
        private_stats['ngraphs'] = results_priv[0]['number']

        # Graphs info
        results_pub = qmlaucher.process_query(sqs.get_subgraph_infos('public'),lEndp)
        results_priv = qlaucher.process_query(sqs.get_subgraph_infos('private'))

        public_stats['graphs'] = results_pub
        private_stats['graphs'] = results_priv

        # Classes and relations
        results_pub = qmlaucher.process_query(sqs.get_rel_of_classes('public'),lEndp)
        results_priv = qlaucher.process_query(sqs.get_rel_of_classes('private'))

        public_stats['class_rel'] = results_pub
        private_stats['class_rel'] = results_priv

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
        results_pub = qmlaucher.process_query(sqs.get_attr_of_classes('public'),lEndp)
        results_priv = qlaucher.process_query(sqs.get_attr_of_classes('private'))

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

        self.checkAuthSession()

        self.log.debug("=== DELETE ALL NAMED GRAPHS ===")

        try:
            sqb = SparqlQueryBuilder(self.settings, self.request.session)
            ql = QueryLauncher(self.settings, self.request.session)

            named_graphs = self.list_user_graph()

            for graph in named_graphs:

                self.log.debug("--- DELETE GRAPH : %s", graph['g'])
                ql.process_query(sqb.get_drop_named_graph(graph['g']))
                #delete metadatas
                ql.process_query(sqb.get_delete_metadatas_of_graph(graph['g']))

        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.request.response.status = 400

        return self.data

    @view_config(route_name='delete_graph', request_method='POST')
    def delete_graph(self):
        """

        """

        self.checkAuthSession()

        sqb = SparqlQueryBuilder(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)

        graphs = self.request.json_body['named_graph']

        #TODO: check if the graph belong to user

        for graph in graphs:
            self.log.debug("--- DELETE GRAPH : %s", graph)
            ql.process_query(sqb.get_drop_named_graph(graph),parseResults=False)
            #delete metadatas
            ql.process_query(sqb.get_delete_metadatas_of_graph(graph),parseResults=False)


    @view_config(route_name='delete_endpoints', request_method='POST')
    def delete_endpoints(self):
        """

        """
        self.data = {}

        self.checkAuthSession()

        if 'id_endpoints' not in self.request.json_body:
            self.data['error'] = 'Devel : id_endpoints value is not defined !'
            self.request.response.status = 400
            return self.data

        endpoints = self.request.json_body['id_endpoints']

        em = EndpointManager(self.settings, self.request.session)

        for url in endpoints:
            em.remove_endpoint(url)
        ##raise ValueError("ok")

    @view_config(route_name='add_endpoint', request_method='POST')
    def add_endpoint(self):
        """

        """

        self.checkAuthSession()

        if 'name' not in self.request.json_body:
            raise exception_response(404)
        if 'url' not in self.request.json_body:
            raise exception_response(404)
        if 'auth' not in self.request.json_body:
            raise exception_response(404)

        name = self.request.json_body['name']
        url = self.request.json_body['url']
        auth = self.request.json_body['auth']

        em = EndpointManager(self.settings, self.request.session)
        em.save_endpoint(name,url,auth,True)

    @view_config(route_name='enable_endpoints', request_method='POST')
    def enable_endpoints(self):
        """

        """

        self.checkAuthSession()

        if 'id' not in self.request.json_body:
           raise exception_response(404)
        if 'enable' not in self.request.json_body:
           raise exception_response(404)

        id = self.request.json_body['id']
        enable = self.request.json_body['enable']

        em = EndpointManager(self.settings, self.request.session)

        if enable:
           em.enable(id)
        else:
           em.disable(id,"")


    @view_config(route_name='list_user_graph', request_method='GET')
    def list_user_graph(self):
        """
        Return a list with all the named graphs of a user.
        """

        self.checkAuthSession()

        sqg = SparqlQueryGraph(self.settings, self.request.session)
        query_launcher = QueryLauncher(self.settings, self.request.session)

        res = query_launcher.process_query(sqg.get_user_graph_infos_with_count())

        named_graphs = []

        for index_result in range(len(res)):
            if not 'date' in res[index_result]:
                self.log.warn('============= bad results user graph =================')
                self.log.warn(res[index_result])
                self.log.warn("============================================================")
                continue

            dat = datetime.datetime.strptime(res[index_result]['date'], "%Y-%m-%dT%H:%M:%S.%f")

            readable_date = dat.strftime("%d/%m/%Y %H:%M:%S") #dd/mm/YYYY hh:ii:ss
            endpt = ''

            if 'endpoint' in res[index_result].keys():
                endpt = res[index_result]['endpoint'],

            named_graphs.append({
                'endpoint' : endpt,
                'g': res[index_result]['g'],
                'name': res[index_result]['name'],
                'count': res[index_result]['co'],
                'date': res[index_result]['date'],
                'readable_date': readable_date,
                'access': res[index_result]['access'],
                'owner': res[index_result]['owner'],
                'access_bool': bool(res[index_result]['access'] == 'public')
            })

        return named_graphs

    @view_config(route_name='list_endpoints', request_method='GET')
    def list_endpoints(self):
        """
        Return a list with all endpoint using by a askomics session.
        """

        session = {}
        try:
            em = EndpointManager(self.settings, self.request.session)
            session['askomics'] = em.list_endpoints()

            sqb = SparqlQueryBuilder(self.settings, self.request.session)
            session['external'] = sqb.getExternalServiceEndpoint()
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)

        return session


    @view_config(route_name='guess_csv_header_type', request_method='POST')
    def guess_csv_header_type(self):
        """Guess the headers type of a csv file

        Used for the asko-cli scripts

        :returns: list of guessed types
        :rtype: dict
        """

        self.checkAuthSession()

        body = self.request.json_body
        filename = body['filename']

        sfc = SourceFileConvertor(self.settings, self.request.session)
        source_file = sfc.get_source_files([filename])[0]
        headers = source_file.headers
        preview = source_file.get_preview_data()

        guessed_types = []


        for index_header in range(0, len(headers)):
            guessed_types.append(source_file.guess_values_type(preview[index_header], headers[index_header]))

        self.data['types'] = guessed_types

        self.log.debug(self.data)
        return self.data




    @view_config(route_name='source_files_overview', request_method='POST')
    def source_files_overview(self):
        """
        Get preview data for all the available files
        """
        self.checkAuthSession()

        files_to_integrate = self.request.json_body

        self.log.debug(" ========= Askview:source_files_overview =============")
        try:
            sfc = SourceFileConvertor(self.settings, self.request.session)
            source_files = sfc.get_source_files(files_to_integrate)
            self.data['files'] = []

            # get all taxon in the TS
            sqg = SparqlQueryGraph(self.settings, self.request.session)
            ql = MultipleQueryLauncher(self.settings, self.request.session)
            em = EndpointManager(self.settings, self.request.session)
            res = ql.process_query(sqg.get_all_taxons(),em.list_endpoints())
            taxons_list = []
            for elem in res:
                taxons_list.append(elem['taxon'])
            self.data['taxons'] = taxons_list

            for src_file in source_files:
                # Process only selected files
                if src_file.name not in files_to_integrate:
                    continue
                infos = {}
                infos['name'] = src_file.name
                infos['type'] = src_file.type
                if src_file.type == 'tsv':
                    try:
                        infos['headers'] = src_file.get_headers_by_file
                        infos['preview_data'] = src_file.get_preview_data()
                        infos['column_types'] = []
                        header_num = 1
                        infos['column_types'].append('entity_start')
                        for ih in range(1, len(infos['headers'])):
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
                        infos['error'] = 'Can not parse the file GFF File :'+ str(e)
                        self.log.error('error with gff examiner: ' + str(e))

                    self.data['files'].append(infos)

                elif src_file.type == 'ttl':
                    infos['preview'] = src_file.get_preview_ttl()
                    self.data['files'].append(infos)

                elif src_file.type == 'bed':
                    try:
                        src_file.open_bed
                        infos['test'] = 'OK'
                    except Exception as e:
                        self.log.error(str(e))
                        infos['error'] = 'Could not read input file, are you sure it is a valid BED file ?'
                    self.data['files'].append(infos)
        except Exception as e:
             traceback.print_exc(file=sys.stdout)
             self.data['error'] = str(e)
             self.request.response.status = 400

        return self.data


    @view_config(route_name='prefix_uri', request_method='POST')
    def prefix_uri(self):
        """
        get prefix uri for each entities finded in he header file
        """

        try:
            body = self.request.json_body
            tse = TripleStoreExplorer(self.settings, self.request.session)
            self.data = tse.get_prefix_uri()
            self.data['__default__'] = tse.get_param("askomics.prefix")
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.request.response.status = 400

        return self.data

    @view_config(route_name='preview_ttl', request_method='POST')
    def preview_ttl(self):
        """
        Convert tabulated files to turtle according to the type of the columns set by the user
        """

        self.checkAuthSession()

        self.log.debug("preview_ttl")
        try:
            body = self.request.json_body
            file_name = body["file_name"]
            col_types = body["col_types"]
            disabled_columns = body["disabled_columns"]
            key_columns = body["key_columns"]
            uris = None
            if 'uris' in body:
                uris = body['uris']

            sfc = SourceFileConvertor(self.settings, self.request.session)

            src_file = sfc.get_source_files([ file_name ], uri_set=uris)[0]
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
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.request.response.status = 400

        formatter = HtmlFormatter(cssclass='preview_field', nowrap=True, nobackground=True)
        return highlight(self.data, TurtleLexer(), formatter) # Formated html

    @view_config(route_name='load_data_into_graph', request_method='POST')
    def load_data_into_graph(self):
        """
        Load tabulated files to triple store according to the type of the columns set by the user
        """

        self.checkAuthSession()

        body = self.request.json_body
        file_name = body["file_name"]
        col_types = body["col_types"]
        disabled_columns = body["disabled_columns"]
        key_columns = body["key_columns"]
        public = body['public']
        headers = body['headers']
        uris = None
        if 'uris' in body:
            uris = body['uris']

        forced_type = None
        if 'forced_type' in body:
            forced_type = body['forced_type']
        jobid = -1

        # Allow data integration in public graph only if user is an admin
        if public and not self.request.session['admin']:
            raise ValueError("Can not load public data with a non admin account !")

        jm = JobManager(self.settings, self.request.session)
        jobid = jm.save_integration_job(file_name, self.request.session['user_id'])

        sfc = SourceFileConvertor(self.settings, self.request.session)
        src_file = sfc.get_source_files([file_name], forced_type, uri_set=uris)[0]
        src_file.set_headers(headers)
        src_file.set_forced_column_types(col_types)
        src_file.set_disabled_columns(disabled_columns)
        src_file.set_key_columns(key_columns)

        try:
            self.data = src_file.persist(self.request.host_url, public)
            jm.done_integration_job(jobid)
        except Exception as e:
            # rollback
            sqb = SparqlQueryBuilder(self.settings, self.request.session)
            query_laucher = QueryLauncher(self.settings, self.request.session)
            query_laucher.process_query(sqb.get_drop_named_graph(src_file.graph))
            query_laucher.process_query(sqb.get_delete_metadatas_of_graph(src_file.graph))

            traceback.print_exc(file=sys.stdout)
            if jobid != -1:
                jm.set_error_message('integration', str(e), jobid)

        return self.data

    @view_config(route_name='load_remote_data_into_graph', request_method='POST')
    def load_remote_data_into_graph(self):
        """
        Load tabulated files to triple store according to the type of the columns set by the user
        """

        self.checkAuthSession()

        body = self.request.json_body
        graph = None
        jobid = -1

        public = None

        if 'public' in body:
            public = body['public']
        else:
            raise ValueError("Dev error: Can not find 'public' POST value.")

        url = None
        if 'url' in body:
            url = body['url']
        else:
            raise ValueError("Dev error: Can not find 'uri' POST value.")

        # Allow data integration in public graph only if user is an admin
        if public and not self.request.session['admin']:
            raise ValueError("Can not import public data with a non admin account !")

        jm = JobManager(self.settings, self.request.session)
        jobid = jm.save_integration_job(url, self.request.session['user_id'])

        src_file = SourceFileURL(self.settings, self.request.session, url)
        graph = src_file.graph

        try:
            self.data = src_file.load_data_from_url(url, public)
            jm.done_integration_job(jobid)
        except Exception as e:
            # rollback
            sqb = SparqlQueryBuilder(self.settings, self.request.session)
            query_laucher = QueryLauncher(self.settings, self.request.session)

            if graph is not None:
                query_laucher.process_query(sqb.get_drop_named_graph(src_file.graph))
                query_laucher.process_query(sqb.get_delete_metadatas_of_graph(src_file.graph))

            traceback.print_exc(file=sys.stdout)

            if jobid != -1:
                jm.set_error_message('integration', str(e), jobid)

            self.request.response.status = 400

        return self.data

    @view_config(route_name='load_gff_into_graph', request_method='POST')
    def load_gff_into_graph(self):
        """
        Load GFF file into the triplestore
        """

        self.checkAuthSession()

        self.log.debug("== load_gff_into_graph ==")

        jobid = -1

        body = self.request.json_body
        file_name = body['file_name']
        taxon = body['taxon']
        entities = body['entities']
        public = body['public']
        uri = None
        if 'uri' in body:
            uri = body['uri']

        forced_type = None
        if 'forced_type' in body:
            forced_type = body['forced_type']

        # Allow data integration in public graph only if user is an admin
        if public and not self.request.session['admin']:
            raise ValueError("Cannot import public gff with a non admin account !")

        jm = JobManager(self.settings, self.request.session)
        jobid = jm.save_integration_job(file_name, self.request.session['user_id'])
        sfc = SourceFileConvertor(self.settings, self.request.session)
        src_file_gff = sfc.get_source_files([file_name], forced_type, uri_set={0: uri})[0]
        graph = src_file_gff.graph
        src_file_gff.set_taxon(taxon)
        src_file_gff.set_entities(entities)

        try:
            self.log.debug('--> Parsing GFF')
            src_file_gff.persist(self.request.host_url, public)
            jm.done_integration_job(jobid)
        except Exception as e:
            # rollback
            if graph is not None:
                sqb = SparqlQueryBuilder(self.settings, self.request.session)
                query_laucher = QueryLauncher(self.settings, self.request.session)
                query_laucher.process_query(sqb.get_drop_named_graph(graph))
                query_laucher.process_query(sqb.get_delete_metadatas_of_graph(graph))

            traceback.print_exc(file=sys.stdout)

            if jobid != -1:
                jm.set_error_message('integration', str(e), jobid)
            self.log.error(str(e))

        self.data['status'] = 'ok'
        return self.data

    @view_config(route_name='load_ttl_into_graph', request_method='POST')
    def load_ttl_into_graph(self):
        """
        Load TTL file into the triplestore
        """

        self.checkAuthSession()

        self.log.debug('*** load_ttl_into_graph ***')

        jobid = -1

        body = self.request.json_body
        file_name = body['file_name']
        public = body['public']

        forced_type = None
        if 'forced_type' in body:
            forced_type = body['forced_type']
        # Allow data integration in public graph only if user is an admin
        if public and not self.request.session['admin']:
            raise ValueError("Can not import public turtle file with a non admin account !")

        jm = JobManager(self.settings, self.request.session)
        jobid = jm.save_integration_job(file_name, self.request.session['user_id'])
        sfc = SourceFileConvertor(self.settings, self.request.session)
        src_file_ttl = sfc.get_source_files([file_name], forced_type)[0]
        graph = src_file_ttl.graph

        try:
            self.data = src_file_ttl.persist(self.request.host_url, public)
            jm.done_integration_job(jobid)
        except Exception as e:
            # rollback
            if graph is not None:
                sqb = SparqlQueryBuilder(self.settings, self.request.session)
                query_laucher = QueryLauncher(self.settings, self.request.session)
                query_laucher.process_query(sqb.get_drop_named_graph(graph))
                query_laucher.process_query(sqb.get_delete_metadatas_of_graph(graph))

            if jobid != -1:
                jm.set_error_message('integration', str(e), jobid)
            self.log.error('ERROR: ' + str(e))

        self.data['status'] = 'ok'
        return self.data

    @view_config(route_name='load_bed_into_graph', request_method='POST')
    def load_bed_into_graph(self):
        """
        Load a BED file into the triplestore
        """

        self.checkAuthSession()

        body = self.request.json_body

        jobid = -1

        file_name = body['file_name']
        taxon = body['taxon']
        entity = body['entity_name']
        public = body['public']
        uri = None
        if 'uri' in body:
            uri = body['uri']

        forced_type = None
        if 'forced_type' in body:
            forced_type = body['forced_type']

        # Allow data integration in public graph only if user is an admin
        if public and not self.request.session['admin']:
            raise ValueError("Cannot import public BED file with a non admin account !")

        sfc = SourceFileConvertor(self.settings, self.request.session)
        src_file_bed = sfc.get_source_files([file_name], forced_type, uri_set={0: uri})[0]

        src_file_bed.set_taxon(taxon)
        src_file_bed.set_entity_name(entity)

        graph = src_file_bed.graph
        jm = JobManager(self.settings, self.request.session)
        jobid = jm.save_integration_job(file_name, self.request.session['user_id'])
        try:
            self.log.debug('--> Parsing BED')
            src_file_bed.persist(self.request.host_url, public)
            jm.done_integration_job(jobid)
        except Exception as e:
            # rollback
            if graph is not None:
                sqb = SparqlQueryBuilder(self.settings, self.request.session)
                query_laucher = QueryLauncher(self.settings, self.request.session)
                query_laucher.process_query(sqb.get_drop_named_graph(graph))
                query_laucher.process_query(sqb.get_delete_metadatas_of_graph(graph))

            traceback.print_exc(file=sys.stdout)
            if jobid != -1:
                jm.set_error_message('integration', str(e), jobid)

            self.log.error(str(e))

        self.data['status'] = 'ok'
        return self.data

    @view_config(route_name='getUserAbstraction', request_method='POST')
    def getUserAbstraction(self):

        """ Get the user asbtraction to manage relation inside javascript """
        self.log.debug("== getUserAbstraction ==")

        tse = TripleStoreExplorer(self.settings, self.request.session)
        self.data.update(tse.getUserAbstraction())
        return self.data

    # TODO : this method is too generic. The build of RDF Shortucts should be here to avoid injection with bad intention...

    @view_config(route_name='importShortcut', request_method='POST')
    def importShortcut(self):
        """
        Import a shortcut definition into the triplestore
        """
        self.checkAuthSession()
        self.checkAdminSession()

        self.log.debug('*** importShortcut ***')

        body = self.request.json_body
        sqb = SparqlQueryBuilder(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)
        sparqlHeader = sqb.header_sparql_config("")

        try:
            sparqlHeader += body["prefix"]+"\n"
            ql.insert_data(body["shortcut_def"],'askomics:graph:shortcut',sparqlHeader);
        except Exception as e:
            #exc_type, exc_value, exc_traceback = sys.exc_info()
            #traceback.print_exc(limit=8)
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.request.response.status = 400

        return self.data

    @view_config(route_name='deleteShortcut', request_method='POST')
    def deleteShortcut(self):
        """
        Delete a shortcut definition into the triplestore
        """
        self.checkAuthSession()
        self.checkAdminSession()

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

            res = ql.process_query(query_string)
        except Exception as e:
            #exc_type, exc_value, exc_traceback = sys.exc_info()
            #traceback.print_exc(limit=8)
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.request.response.status = 400

        return self.data

    @view_config(route_name='sparqlquery', request_method='POST')
    def get_value(self):
        """ Build a request from a json whith the following contents :variates,constraintesRelations"""

        body = self.request.json_body

        persist = False
        if 'jobManager' in body :
            if body['jobManager']:
                persist = True

        jobid = -1

        try:
            if persist:
                jm = JobManager(self.settings, self.request.session)
                rg = ""
                if 'requestGraph' in body:
                    rg = body['requestGraph']
                jobid = jm.save_query_job(rg, body['variates'], self.request.session['user_id'])


            typeRequest = ''
            tse = TripleStoreExplorer(self.settings, self.request.session)
            variates = []

            if 'variates' in body:
                if type(body["variates"])==dict:
                    [ variates.extend(listValues) for k,listValues in body["variates"].items()]
                elif type(body["variates"])==list:
                    variates = body["variates"]

            if len(variates)<= 0 :
                raise ValueError("No sparql variable was found !")
            results, query, typeRequest = tse.build_sparql_query_from_json(
                                                 body["endpoints"],
                                                 body["type_endpoints"],
                                                 body["graphs"],
                                                 variates,
                                                 body["constraintesRelations"],
                                                 True)
            # Remove prefixes in the results table
            limit = int(body["limit"]) + 1
            if body["limit"] != -1 and limit < len(results):
                self.data['values'] = results[1:limit+1]
            else:
                self.data['values'] = results

            self.data['nrow'] = len(results)

            # Provide results file
            if (not 'nofile' in body) or not body['nofile']:
                query_laucher = QueryLauncher(self.settings, self.request.session)
                self.data['file'] = query_laucher.format_results_csv(results)

            if persist:
                npreview = 30
                if "limit" in body:
                    npreview = body["limit"]

                jm.done_query_job(jobid, len(results), self.data['values'][0:npreview], self.data['file'])

        except Exception as e:
            #exc_type, exc_value, exc_traceback = sys.exc_info()
            #traceback.print_exc(limit=8)
            traceback.print_exc(file=sys.stdout)
            self.data['values'] = ""
            self.data['file'] = ""

            if persist:
                jm.done_query_job(jobid, None, None, None)
                jm.set_error_message('query', str(e), jobid)

        self.data['galaxy'] = self.request.session['galaxy']

        return self.data

    @view_config(route_name='listjob', request_method='GET')
    def listjob(self):
        ''' Get all jobs recorded in database '''

        maxrows = self.settings['askomics.triplestore_results_max_rows'] if 'askomics.triplestore_results_max_rows' in self.settings else None

        jm = JobManager(self.settings, self.request.session)
        integration_jobs = jm.list_integration_jobs(self.request.session['user_id'])
        query_jobs = jm.list_query_jobs(self.request.session['user_id'])

        return {'maxrows': maxrows, 'integration': integration_jobs, 'query': query_jobs}


    @view_config(route_name='deljob', request_method='POST')
    def deljob(self):
        ''' Remove job from database '''

        body = self.request.json_body

        jm = JobManager(self.settings, self.request.session)
        jm.remove_job(body['table'], body['jobid'])


    @view_config(route_name='getSparqlQueryInTextFormat', request_method='POST')
    def getSparqlQueryInTextFormat(self):
        """ Build a request from a json whith the following contents :variates,constraintesRelations"""
        self.log.debug("== Attribute Value ==")

        try:
            tse = TripleStoreExplorer(self.settings, self.request.session)

            body = self.request.json_body
            lfrom = []
            if 'from' in body:
                lfrom = body['from']

            typeRequest = ''
            endp = []
            typeEnd = []
            variates = []
            [ variates.extend(listValues) for k,listValues in body["variates"].items()]
            results,query, typeRequest = tse.build_sparql_query_from_json(endp,typeEnd,lfrom,variates,body["constraintesRelations"],-1,send_request_to_tps=False)

            self.data['query'] = query
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.request.response.status = 400

        return self.data

    @view_config(route_name='ttl', request_method='GET')
    def uploadTtl(self):
        param_manager = ParamManager(self.settings, self.request.session)

        splited = os.path.split(self.request.matchdict['name'])
        username = splited[0]
        filename = splited[1]
        rdf_path = param_manager.get_directory('rdf', force_username=username)

        path_url = rdf_path + filename

        response = FileResponse(path_url, content_type='text/turtle')
        return response

    @view_config(route_name='csv', request_method='GET')
    def uploadCsv(self):

        pm = ParamManager(self.settings, self.request.session)
        response = FileResponse(
            pm.get_user_csv_directory()+self.request.matchdict['name'],
            content_type='text/csv'
            )
        return response


    @view_config(route_name='del_csv', request_method='GET')
    def deletCsv(self):

        pm = ParamManager(self.settings, self.request.session)
        try:
            os.remove(pm.get_user_csv_directory()+self.request.matchdict['name']),
        except Exception as e:
            self.log.warn(str(e))


    @view_config(route_name='signup', request_method='POST')
    def signup(self):
        body = self.request.json_body
        username = body['username']
        email = body['email']
        password = body['password']
        password2 = body['password2']
        self.data['error'] = []
        error = False

        local_auth = LocalAuth(self.settings, self.request.session)

        if not validate_email(email):
            self.log.debug('Email is not valid')
            self.data['error'].append('Passwords are not identical')
            error = True

        if not password == password2:
            self.log.debug('Email is not valid')
            self.data['error'].append('Passwords are not identical')
            error = True

        if len(password) < int(self.settings['askomics.password_length']):
            self.log.debug('Password must be at least {} characters'.format(self.settings['askomics.password_length']))
            self.data['error'].append('Password must be at least {} characters'.format(self.settings['askomics.password_length']))
            error = True

        if self.settings['askomics.password_must_contain_maj'] == 'true' and password.islower():
            self.log.debug('Password must contain at least one capital letter')
            self.data['error'].append('Password must contain at least one capital letter')
            error = True

        if self.settings['askomics.password_must_contain_num'] == 'true' and not any(char.isdigit() for char in password):
            self.log.debug('Password must contain at least one number')
            self.data['error'].append('Password must contain at least one number')
            error = True

        if self.settings['askomics.password_must_contain_symbol'] == 'true' and not any(char in set('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~') for char in password):
            self.log.debug('Password must contain at least one special character')
            self.data['error'].append('Password must contain at least one special character')
            error = True

        if local_auth.is_username_in_db(username):
            self.log.debug('Username is taken')
            self.data['error'].append('Username is taken')
            error = True

        if local_auth.is_email_in_db(email):
            self.log.debug('Email is already registered')
            self.data['error'].append('Email is already registered')
            error = True

        if error:
            return self.data

        self.data['error'] = []

        try:
            local_user = local_auth.persist_user(username, email, password)
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = "Database problem"
            self.request.response.status = 400

        try:
            local_auth.create_user_graph(username)
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = "Triplestore problem"
            self.request.response.status = 400

        self.request.session['user_id'] = local_user['id']
        self.request.session['username'] = local_user['username']
        self.request.session['email'] = local_user['email']
        self.request.session['admin'] = local_user['admin']
        self.request.session['blocked'] = local_user['blocked']
        self.request.session['graph'] = self.settings['askomics.graph'] + ':' + local_user['username']
        self.request.session['galaxy'] = local_user['galaxy']

        self.data['user_id'] = local_user['id']
        self.data['username'] = local_user['username']
        self.data['email'] = local_user['email']
        self.data['admin'] = local_user['admin']
        self.data['blocked'] = local_user['blocked']
        self.data['galaxy'] = local_user['galaxy']

        return self.data

    @view_config(route_name='checkuser', request_method='GET')
    def checkuser(self):

        if self.request.session['username'] != '':
            # a user is connected, return it
            local_auth = LocalAuth(self.settings, self.request.session)
            try:
                local_user = local_auth.get_user_infos(self.request.session['username'])
            except Exception as e:
                self.log.debug("Database probleme")
                raise e

            if local_user:

                self.request.session['user_id'] = local_user['id']
                self.request.session['username'] = local_user['username']
                self.request.session['email'] = local_user['email']
                self.request.session['admin'] = local_user['admin']
                self.request.session['blocked'] = local_user['blocked']
                self.request.session['graph'] = self.settings['askomics.graph'] + ':' + local_user['username']
                self.request.session['galaxy'] = local_user['galaxy']

                self.data['user_id'] = local_user['id']
                self.data['username'] = local_user['username']
                self.data['email'] = local_user['email']
                self.data['admin'] = local_user['admin']
                self.data['blocked'] = local_user['blocked']
                self.data['galaxy'] = local_user['galaxy']

        return self.data

    # TODO: rewrite this. used only in askomics help, whitch is dead for now
    @view_config(route_name='nbUsers', request_method='GET')
    def nbUsers(self):

        self.data = {}

        sqa = SparqlQueryAuth(self.settings, self.request.session)
        ql = QueryLauncher(self.settings, self.request.session)

        try:

            self.data['count'] =  0
            res = ql.process_query(sqa.get_number_of_users())
            if len(res)>0 and 'count' in res[0]:
                self.data['count'] = res[0]['count']

        except Exception as e:
            self.data['error'] = str(e)
            self.log.error(str(e))

        return self.data

    @view_config(route_name='footer', request_method='GET')
    def footer(self):

        current_version = self.settings['askomics.footer_version']
        message = self.settings['askomics.footer_message']

        try:
            github = Github()
            repo = github.get_repo("askomics/askomics")
            latest_release = repo.get_latest_release()
            latest_version = latest_release.tag_name
            latest_version_url = latest_release.html_url
        except Exception as e:
            self.log.debug("unable to fetch Github")
            self.log.debug(e)
            latest_version = current_version
            latest_version_url =''

        return {
            'current_version': current_version,
            'latest_version': latest_version,
            'latest_version_url': latest_version_url,
            'message': message
        }

    @view_config(route_name='logout', request_method='GET')
    def logout(self):
        """
        Log out the user, reset the session
        """

        self.request.session['user_id'] = ''
        self.request.session['username'] = ''
        self.request.session['email'] = ''
        self.request.session['admin'] = ''
        self.request.session['blocked'] = ''
        self.request.session['graph'] = ''
        self.request.session['galaxy'] = {}
        self.request.session = {}

        return

    @view_config(route_name='login', request_method='POST')
    def login(self):

        body = self.request.json_body
        login = body['username_email']
        password = body['password']
        auth_type = 'local'
        auth_success = False
        self.data['error'] = []

        local_auth = LocalAuth(self.settings, self.request.session)
        local_user = local_auth.get_user_infos(login)

        if not local_user:
            # No user in db with this login. Try ldap
            ldap = LdapAuth(self.settings, self.request.session)
            ldap_user = ldap.authenticate_user(login, password)

            if ldap_user:
                # login is registered in the ldap, store him in localdb
                self.log.debug(ldap_user)
                auth_type = 'ldap'
                local_auth.set_auth_type(auth_type)
                local_user = local_auth.persist_user(ldap_user['username'], ldap_user['mail'])
        else:
            auth_type = local_user['auth_type']

        # Now, authenticate the user
        if auth_type == 'local':
            auth_success = local_auth.authenticate_user(login, password)
        elif auth_type == 'ldap':
            ldap = LdapAuth(self.settings, self.request.session)
            auth_success = bool(ldap.authenticate_user(login, password))

        if auth_success:

            self.request.session['user_id'] = local_user['id']
            self.request.session['username'] = local_user['username']
            self.request.session['email'] = local_user['email']
            self.request.session['admin'] = local_user['admin']
            self.request.session['blocked'] = local_user['blocked']
            self.request.session['graph'] = self.settings['askomics.graph'] + ':' + local_user['username']
            self.request.session['galaxy'] = local_user['galaxy']

            self.data['user_id'] = local_user['id']
            self.data['username'] = local_user['username']
            self.data['email'] = local_user['email']
            self.data['admin'] = local_user['admin']
            self.data['blocked'] = local_user['blocked']
            self.data['galaxy'] = local_user['galaxy']

        else:
            self.data['error'].append('Wrong username or password')

        return self.data


    @view_config(route_name='renew_apikey', request_method='GET')
    def renew_apikey(self):

        self.checkAuthSession()

        local_auth = LocalAuth(self.settings, self.request.session)

        try:
            local_auth.renew_apikey(self.request.session['username'])
        except Exception as e:
            self.log.debug("Database problem")
            raise e


    @view_config(route_name='connect_galaxy', request_method='POST')
    def connect_galaxy(self):

        self.checkAuthSession()

        body = self.request.json_body
        url = body['url']
        key = body['key']

        local_auth = LocalAuth(self.settings, self.request.session)

        # First, delete galaxy
        try:
            local_auth.delete_galaxy(self.request.session['user_id'])
        except Exception as e:
            self.log.debug('Database problem')
            raise e

        # then, add the new (if there is a new)
        if not url or not key:
            # delete galaxy
            self.data['success'] = 'deleted'
            self.request.session['galaxy'] = {}
            return self.data

        # Insert the new Galaxy
        try:
            local_auth.add_galaxy(url, key, self.request.session['user_id'])
            self.request.session['galaxy'] = {}
        except Exception as e:
            self.data['error'] = 'Connection to Galaxy failed'
            self.log.debug('Connection to Galaxy failed')
            return self.data

        self.data['success'] = 'inserted'

        return self.data

    @view_config(route_name='login_api_gie', request_method='GET')
    def login_api_gie(self):

        apikey = self.request.GET['key']

        self.data['error'] = ''

        local_auth = LocalAuth(self.settings, self.request.session)
        local_user = local_auth.get_user_infos_api_key(apikey)

        if local_user:
            self.request.session['user_id'] = local_user['id']
            self.request.session['username'] = local_user['username']
            self.request.session['email'] = local_user['email']
            self.request.session['admin'] = local_user['admin']
            self.request.session['blocked'] = local_user['blocked']
            self.request.session['graph'] = self.settings['askomics.graph'] + ':' + local_user['username']
            self.request.session['galaxy'] = local_user['galaxy']
        else:
            self.data['error'] = 'API key belong to nobody'
            return self.data

        if self.request.application_url.endswith('/'):
            return HTTPFound(self.request.application_url)

        return HTTPFound(self.request.application_url + '/')


    @view_config(route_name='login_api', request_method='GET')
    def login_api(self):

        apikey = self.request.GET['key']

        self.data['error'] = ''

        local_auth = LocalAuth(self.settings, self.request.session)
        local_user = local_auth.get_user_infos_api_key(apikey)

        if local_user:
            self.request.session['user_id'] = local_user['id']
            self.request.session['username'] = local_user['username']
            self.request.session['email'] = local_user['email']
            self.request.session['admin'] = local_user['admin']
            self.request.session['blocked'] = local_user['blocked']
            self.request.session['graph'] = self.settings['askomics.graph'] + ':' + local_user['username']
            self.request.session['galaxy'] = local_user['galaxy']

            self.data['user_id'] = local_user['id']
            self.data['username'] = local_user['username']
            self.data['email'] = local_user['email']
            self.data['admin'] = local_user['admin']
            self.data['blocked'] = local_user['blocked']
            self.data['galaxy'] = local_user['galaxy']

        else:
            self.data['error'] = 'API key belong to nobody'

        return self.data


    @view_config(route_name='get_users_infos', request_method='GET')
    def get_users_infos(self):
        """
        For each users store in the triplesore, get their username, email,
        and admin status
        """

        self.checkAuthSession()
        self.checkAdminSession()

        local_auth = LocalAuth(self.settings, self.request.session)
        all_users = local_auth.get_all_users_infos()

        self.data['result'] = all_users
        self.data['me'] = self.request.session['username']

        return self.data

    @view_config(route_name='lockUser', request_method='POST')
    def lock_user(self):
        """
        Change a user lock status
        """

        self.checkAuthSession()
        self.checkAdminSession()

        body = self.request.json_body

        self.data = {}

        username = body['username']
        new_status = body['lock']

        # Convert bool to string for the database
        if new_status:
            new_status = 'true'
        else:
            new_status = 'false'

        try:
            local_auth = LocalAuth(self.settings, self.request.session)
            local_auth.lock_user(new_status, username)
        except Exception as e:
            self.data['error'] = str(e)
            self.log.error(str(e))
            self.request.response.status = 400
            return self.data


        return 'success'

    @view_config(route_name='setAdmin', request_method='POST')
    def set_admin(self):
        """
        Change a user admin status
        """

        self.checkAuthSession()
        self.checkAdminSession()

        body = self.request.json_body

        username = body['username']
        new_status = body['admin']

        # Convert bool to string for the database
        if new_status:
            new_status = 'true'
        else:
            new_status = 'false'

        try:
            local_auth = LocalAuth(self.settings, self.request.session)
            local_auth.admin_user(new_status, username)
        except Exception as e:
            self.data['error'] = str(e)
            self.log.error(str(e))
            self.request.response.status = 400
            return self.data


        return 'success'


    @view_config(route_name='delete_user', request_method='POST')
    def delete_user(self):
        """
        Delete a user from the user graphs, and remove all his data
        """

        self.checkAuthSession()

        body = self.request.json_body

        username = body['username']
        passwd = body['passwd']
        confirmation = body['passwd_conf']

        local_auth = LocalAuth(self.settings, self.request.session)

        # Non admin can only delete himself
        if self.request.session['username'] != username and not self.request.session['admin']:
            raise Exception('forbidden')

        # If confirmation, check the user passwd
        if confirmation:
            local_user = local_auth.get_user_infos(self.request.session['username'])

            if local_user['auth_type'] == 'local':
                auth_success = local_auth.authenticate_user(self.request.session['username'], passwd)
            else: #ldap
                ldap = LdapAuth(self.settings, self.request.session)
                auth_success = ldap.authenticate_user(self.request.session['username'], passwd)

            if not auth_success:
                self.data['error'] = 'Wrong password'
                self.request.response.status = 400
                return self.data


        sqb = SparqlQueryBuilder(self.settings, self.request.session)
        query_laucher = QueryLauncher(self.settings, self.request.session)

        # Get all graph of a user
        res = query_laucher.process_query(sqb.get_graph_of_user(username))

        list_graph = []
        for graph in res:
            list_graph.append(graph['g'])

        # Drop all this graph
        for graph in list_graph:
            try:
                query_laucher.process_query(sqb.get_drop_named_graph(graph))
                query_laucher.process_query(sqb.get_delete_metadatas_of_graph(graph))
            except Exception as e:
                self.data['error'] = str(e)
                self.log.error(str(e))
                self.request.response.status = 400
                return self.data


        # Delete user infos
        try:
            local_auth.delete_user(username)
        except Exception as e:
            return 'failed: ' + str(e)

        # Is user delete himself, delog him
        if self.request.session['username'] == username:
            self.request.session['username'] = ''
            self.request.session['admin'] = ''
            self.request.session['graph'] = ''

        return 'success'

    @view_config(route_name='get_my_infos', request_method='GET')
    def get_my_infos(self):
        """
        Get all infos about a user
        """

        self.checkAuthSession()

        local_auth = LocalAuth(self.settings, self.request.session)

        try:
            local_user = local_auth.get_user_infos(self.request.session['username'])
        except Exception as e:
            self.log.error(e)
            self.data.error = 'Database error: ' + str(e)
            return self.data

        self.data['user_id'] = local_user['id']
        self.data['username'] = local_user['username']
        self.data['email'] = local_user['email']
        self.data['admin'] = local_user['admin']
        self.data['blocked'] = local_user['blocked']
        self.data['apikey'] = local_user['apikey']
        self.data['galaxy'] = local_user['galaxy'] if local_user['galaxy'] else None
        self.data['ldap'] = True if local_user['password'] == None else False

        return self.data


    @view_config(route_name='update_mail', request_method='POST')
    def update_mail(self):
        """
        Chage email of a user
        """

        body = self.request.json_body
        username = body['username']
        new_email = body['email']


        local_auth = LocalAuth(self.settings, self.request.session)
        local_user = local_auth.get_user_infos(self.request.session['username'])

        # If user is ldap, deny
        if local_user['auth_type'] == 'ldap':
            self.data['error'] = "Ldap users can't change their email"
            return self.data

        # Check new email
        if not validate_email(new_email):
            self.data['error'] = 'Not a valid mail'
            self.log.debug('not a valid mail')
            return self.data

        try:
            local_auth.update_email(self.request.session['username'], new_email)
        except Exception as e:
            self.data.error[e]
            return self.data

        self.data['sucess'] = 'success'
        return self.data


    @view_config(route_name='update_passwd', request_method='POST')
    def update_passwd(self):
        """
        Change password of a user
        """

        body = self.request.json_body
        username = body['username']
        passwd = body['passwd']
        passwd2 = body['passwd2']
        current_passwd = body['current_passwd']
        error = False

        local_auth = LocalAuth(self.settings, self.request.session)
        local_user = local_auth.get_user_infos(self.request.session['username'])

        if local_user['auth_type'] == 'ldap':
            self.data['error'] = "ldap users can't change their password"
            return self.data

        auth_success = local_auth.authenticate_user(self.request.session['username'], current_passwd)

        if not auth_success:
            self.data['error'] = 'Current password is wrong'
            error = True

        if not passwd == passwd2:
            self.log.debug('Email is not valid')
            self.data['error'].append('Passwords are not identical')
            error = True

        if len(passwd) < int(self.settings['askomics.password_length']):
            self.log.debug('Password must be at least {} characters'.format(self.settings['askomics.password_length']))
            self.data['error'].append('Password must be at least {} characters'.format(self.settings['askomics.password_length']))
            error = True

        if self.settings['askomics.password_must_contain_maj'] == 'true' and passwd.islower():
            self.log.debug('Password must contain at least one capital letter')
            self.data['error'].append('Password must contain at least one capital letter')
            error = True

        if self.settings['askomics.password_must_contain_num'] == 'true' and not any(char.isdigit() for char in passwd):
            self.log.debug('Password must contain at least one number')
            self.data['error'].append('Password must contain at least one number')
            error = True

        if self.settings['askomics.password_must_contain_symbol'] == 'true' and not any(char in set('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~') for char in passwd):
            self.log.debug('Password must contain at least one special character')
            self.data['error'].append('Password must contain at least one special character')
            error = True

        if error:
            return self.data

        try:
            local_auth.update_password(self.request.session['username'], passwd)
        except Exception as e:
            self.data['error'] = 'error when updating password: ' + str(e)
            return self.data

        self.data['success'] = 'success'

        return self.data



    @view_config(route_name='get_data_from_galaxy', request_method='POST')
    def get_data_from_galaxy(self):

        body = self.request.json_body
        history = body['history']
        allowed_files = body['allowed_files']

        local_auth = LocalAuth(self.settings, self.request.session)

        try:
            galaxy_credentials = local_auth.get_galaxy_infos(self.request.session['user_id'])
        except Exception as e:
            self.log.error(e)
            self.data['error'] = 'Database error: ' + str(e)
            return self.data

        if not galaxy_credentials:
            self.data.error = 'No Galaxy account registered'
            return self.data

        # Check the galaxy account
        galaxy = GalaxyConnector(self.settings, self.request.session, galaxy_credentials['url'], galaxy_credentials['key'])

        try:
            valid_galaxy = galaxy.check_galaxy_instance()
        except Exception as e:
            self.log.error(e)
            self.data['error'] = 'Galaxy error: ' + str(e)
            return self.data


        if not valid_galaxy:
            self.data['error'] = 'Impossible to connect the Galaxy instance, check url and api key'
            return self.data

        # Get the datasets
        try:
            galaxy_datasets = galaxy.get_datasets_and_histories(allowed_files, history_id=history)
        except Exception as e:
            self.log.error(e)
            self.data['error'] = 'Galaxy error: ' + str(e)
            return self.data


        # Boolean values for handlebars
        for dataset in galaxy_datasets['datasets']:
            if dataset['state'] == 'ok':
                dataset['success'] = True
            elif dataset['state'] == 'queued':
                dataset['notick'] = False
                dataset['queued'] = True
            else:
                dataset['notick'] = False
                dataset['error'] = True

        self.data['datasets'] = galaxy_datasets['datasets']
        self.data['histories'] = galaxy_datasets['histories']

        return self.data

    @view_config(route_name='upload_galaxy_files', request_method='POST')
    def upload_galaxy_file(self):

        body = self.request.json_body

        local_auth = LocalAuth(self.settings, self.request.session)

        # get galaxy credentials
        try:
            galaxy_credentials = local_auth.get_galaxy_infos(self.request.session['user_id'])
        except Exception as e:
            self.log.error(e)
            self.data['error'] = 'Database error: ' + str(e)
            return self.data

        if not galaxy_credentials:
            self.data.error = 'No Galaxy account registered'
            return self.data

        # Check the galaxy account
        galaxy = GalaxyConnector(self.settings, self.request.session, galaxy_credentials['url'], galaxy_credentials['key'])

        try:
            valid_galaxy = galaxy.check_galaxy_instance()
        except Exception as e:
            self.log.error(e)
            self.data['error'] = 'Galaxy error: ' + str(e)
            return self.data


        if not valid_galaxy:
            self.data['error'] = 'Impossible to connect the Galaxy instance, check url and api key'
            return self.data

        # Upload files
        try:
            galaxy.upload_files(body['datasets'])
        except Exception as e:
            self.log.error(e)
            self.data['error'] = 'Error during galaxy upload: ' + str(e)
            return self.data

        self.data['success'] = 'Success'
        return self.data

    @view_config(route_name='get_galaxy_file_content', request_method='POST')
    def get_galaxy_file_content(self):

        body = self.request.json_body
        dataset_id = body['dataset']

        local_auth = LocalAuth(self.settings, self.request.session)

        # get galaxy credentials
        try:
            galaxy_credentials = local_auth.get_galaxy_infos(self.request.session['user_id'])
        except Exception as e:
            self.log.error(e)
            self.data['error'] = 'Database error: ' + str(e)
            return self.data

        if not galaxy_credentials:
            self.data.error = 'No Galaxy account registered'
            return self.data

        # Check the galaxy account
        galaxy = GalaxyConnector(self.settings, self.request.session, galaxy_credentials['url'], galaxy_credentials['key'])

        try:
            valid_galaxy = galaxy.check_galaxy_instance()
        except Exception as e:
            self.log.error(e)
            self.data['error'] = 'Galaxy error: ' + str(e)
            return self.data

        if not valid_galaxy:
            self.data['error'] = 'Impossible to connect the Galaxy instance, check url and api key'
            return self.data

        # Get the file content
        try:
            self.data['json_query'] = galaxy.get_file_content(dataset_id)
        except Exception as e:
            self.log.error(e)
            self.data['error'] = 'Error during galaxy upload: ' + str(e)
            return self.data

        return self.data

    @view_config(route_name='send_to_galaxy', request_method='POST')
    def send2galaxy(self):
        self.data = {}

        body = self.request.json_body

        local_auth = LocalAuth(self.settings, self.request.session)

        # get galaxy credentials
        try:
            galaxy_credentials = local_auth.get_galaxy_infos(self.request.session['user_id'])
        except Exception as e:
            self.log.error(e)
            self.data['error'] = 'Database error: ' + str(e)
            return self.data

        if not galaxy_credentials:
            self.data.error = 'No Galaxy account registered'
            return self.data

        # Check the galaxy account
        galaxy = GalaxyConnector(self.settings, self.request.session, galaxy_credentials['url'], galaxy_credentials['key'])

        try:
            valid_galaxy = galaxy.check_galaxy_instance()
        except Exception as e:
            self.log.error(e)
            self.data['error'] = 'Galaxy error: ' + str(e)
            return self.data

        if not valid_galaxy:
            self.data['error'] = 'Impossible to connect the Galaxy instance, check url and api key'
            return self.data

        # Send the file to Galaxy
        try:
            if 'json' in body:
                galaxy.send_json_to_history(body['json'])
            else:
                param_manager = ParamManager(self.settings, self.request.session)
                path = param_manager.get_user_csv_directory() + body['path']
                name = body['name']
                galaxy.send_to_history(path, name, body['type'])
        except Exception as e:
            self.log.error(e)
            self.data['error'] = 'Error during sending: ' + str(e)
            return self.data

        self.data['success'] = 'Path successfully sent in Galaxy'
        return self.data


    @view_config(route_name='get_uploaded_files', request_method="GET")
    def get_uploaded_files(self):

        self.checkAuthSession()

        param_manager = ParamManager(self.settings, self.request.session)
        path = param_manager.get_upload_directory()

        self.data = {}
        self.data['files'] = {}
        files = os.listdir(path)

        for file in files:
            file_path = path + '/' + file
            file_size = humanize.naturalsize(os.path.getsize(file_path), binary=True)
            self.data['files'][file] = file_size

        self.data['galaxy'] = self.request.session['galaxy']
        return self.data

    @view_config(route_name="delete_uploaded_files", request_method="POST")
    def delete_uploaded_files(self):

        try:
            #should be in a administration session....to check
            #self.checkAdminSession()

            files_to_delete = self.request.json_body
            param_manager = ParamManager(self.settings, self.request.session)
            path = param_manager.get_upload_directory()


            for file in files_to_delete:
                os.remove(path + '/' + file)

        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.request.response.status = 400

    @view_config(route_name='serverinformations', request_method='GET')
    def serverinformations(self):
        import platform
        import os
        from humanize import naturalsize
        from glob2 import iglob
        import psutil

        try:
            pid = os.getpid()
            py = psutil.Process(pid)
            memoryUse = py.memory_info()[0]/2.**30

            infomem = psutil.virtual_memory()
            diskinfo = psutil.disk_usage('.')

            self.checkAdminSession()

            pm = ParamManager(self.settings, self.request.session)

            self.data = {}
            self.data['values'] = []

            self.data['values'].append({ 'key' : 'System', 'value' : platform.system() } )
            self.data['values'].append({ 'key' : 'Release', 'value' : platform.release() } )
            self.data['values'].append({ 'key' : 'N CPU', 'value' : str(psutil.cpu_count()) } )
            self.data['values'].append({ 'key' : 'Memory total', 'value' : str(round(infomem.total/(1024**3),2)) + " GB" } )
            self.data['values'].append({ 'key' : 'Memory used', 'value' : str(round(infomem.used/(1024**3),2)) + " GB" } )
            self.data['values'].append({ 'key' : 'Memory free', 'value' : str(round(infomem.free/(1024**3),2)) + " GB" } )
            self.data['values'].append({ 'key' : 'Disk total', 'value' : str(round(diskinfo.total/(1024**3),2)) + " GB" } )
            self.data['values'].append({ 'key' : 'Disk used', 'value' : str(round(diskinfo.used/(1024**3),2)) + " GB" } )
            self.data['values'].append({ 'key' : 'Disk free', 'value' : str(round(diskinfo.free/(1024**3),2)) + " GB" } )
            self.data['values'].append({ 'key' : 'temp directory', 'value' : pm.user_dir } )
            self.data['values'].append({ 'key' : 'temp directory size', 'value' : naturalsize(sum(os.path.getsize(x) for x in iglob(pm.user_dir+'/**'))) } )
            self.data['values'].append({ 'key' : 'Upload directory', 'value' : pm.get_upload_directory() } )
            self.data['values'].append({ 'key' : 'Upload directory size', 'value' : naturalsize(sum(os.path.getsize(x) for x in iglob(pm.get_upload_directory()+'/**'))) } )
            self.data['values'].append({ 'key' : 'Rdf generated files directory', 'value' : pm.get_rdf_user_directory() } )
            self.data['values'].append({ 'key' : 'Rdf generated files directory size', 'value' : naturalsize(sum(os.path.getsize(x) for x in iglob(pm.get_rdf_user_directory()+'/**'))) } )
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.request.response.status = 400

        return self.data

    @view_config(route_name='cleantmpdirectory', request_method='POST')
    def cleantmpdirectory(self):
        import os
        import glob2


        try:
            self.checkAdminSession()
            pm = ParamManager(self.settings, self.request.session)

            files = glob2.glob(pm.get_rdf_user_directory()+'/**')
            for f in files:
                if os.path.isfile(f):
                    os.remove(f)
        except Exception as e:
            traceback.print_exc(file=sys.stdout)
            self.data['error'] = str(e)
            self.request.response.status = 400

        return
