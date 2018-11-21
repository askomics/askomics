#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""
Classes to import data from source files
"""
import os
import re
import logging
import os.path
import tempfile
import getpass
from pkg_resources import get_distribution
import datetime

from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.SparqlQueryGraph import SparqlQueryGraph
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.utils import cached_property, HaveCachedProperties

class SourceFileSyntaxError(SyntaxError):
    pass

class SourceFile(ParamManager, HaveCachedProperties):
    """
    Class representing a source file.
    """

    def __init__(self, settings, session, path, uri_set=None):

        ParamManager.__init__(self, settings, session)

        self.timestamp = datetime.datetime.now().isoformat()

        self.path = path

        self.metadatas = {}

        # The name should not contain extension as dots are not allowed in rdf names
        # self.name = os.path.splitext(os.path.basename(path))[0]
        self.name = os.path.basename(path)
        self.alphanum_name = re.sub('[^0-9a-zA-Z]+', '_', self.name)

        self.graph = 'askomics:unkown:uri:graph'
        if 'graph' in self.session:
            self.graph = self.session['graph']

        # Graph name can't contain any non alphanumeric characters. replace all with _
        self.graph = self.graph + ':' + self.alphanum_name + '_' + self.timestamp

        self.log = logging.getLogger(__name__)

        self.reset_cache()

        self.uri = []

        if uri_set != None:
            for idx,uri in uri_set.items():
                if uri:
                    # uri have to end with # or /
                    if not uri.endswith('#') and not uri.endswith('/'):
                        uri = uri + "/"
                    self.uri.append(uri)
                else:
                    self.uri.append(self.get_param("askomics.prefix"))

    def setGraph(self,graph):
        self.graph = graph

    def insert_metadatas(self,accessL):
        """
        Insert the metadatas into the parent graph
        """

        self.log.debug('--- insert_metadatas ---')

        sqb = SparqlQueryBuilder(self.settings, self.session)
        query_laucher = QueryLauncher(self.settings, self.session)

        valAcces = 'public' if accessL else 'private'

        ttl = '<' + self.graph + '> prov:generatedAtTime "' + self.timestamp + '"^^xsd:dateTime .\n'
        ttl += '<' + self.graph + '> dc:creator "' + self.session['username'] + '" .\n'
        ttl += '<' + self.graph + '> :accessLevel "' +  valAcces + '" .\n'
        ttl += '<' + self.graph + '> foaf:Group "' +  self.session['group']  + '" .\n'
        ttl += '<' + self.graph + '> prov:wasDerivedFrom "' + self.name + '" .\n'
        ttl += '<' + self.graph + '> dc:hasVersion "' + get_distribution('Askomics').version + '" .\n'
        ttl += '<' + self.graph + '> prov:describesService "' + os.uname()[1] + '" .\n'

        if self.is_defined("askomics.endpoint"):
            ttl += '<' + self.graph + '> prov:atLocation "' + self.get_param("askomics.endpoint") + '" .\n'
        else:
            raise ValueError("askomics.endpoint does not exit.")

        sparql_header = sqb.header_sparql_config('')

        query_laucher.insert_data(ttl, self.graph, sparql_header)

    def get_timestamp(self):
        """
        return the timestamp (use in the tests)
        """
        return self.timestamp

    def persist(self, urlbase, public):
        """
        Store the current source file in the triple store

        :param urlbase: the base URL of current askomics instance. It is used to let triple stores access some askomics temporary ttl files using http.
        :return: a dictionnary with information on the success or failure of the operation
        :rtype: Dict
        """
        self.insert_metadatas(public)

        content_ttl = self.get_turtle()
        ql = QueryLauncher(self.settings, self.session)

        # use insert data instead of load sparql procedure when the dataset is small
        total_triple_count = 0
        chunk_count = 1
        chunk = ""
        pathttl = self.get_rdf_user_directory()

        method = 'load'
        if self.get_param("askomics.upload_user_data_method"):
            method = self.get_param("askomics.upload_user_data_method")

        if method == 'load':

            fp = None

            triple_count = 0
            for triple in content_ttl:
                chunk += triple + '\n'
                triple_count += 1

                # with open('/tmp/DEBUGTTL' + str(triple_count), 'w') as debug_file:
                #     debug_file.write(chunk)

                if triple_count > int(self.settings['askomics.max_content_size_to_update_database']):
                    # Temp file must be accessed by http so we place it in askomics/ttl/ dir
                    fp = tempfile.NamedTemporaryFile(dir=pathttl, prefix="tmp_"+self.alphanum_name, suffix=".ttl", mode="w", delete=False)
                    # We have reached the maximum chunk size, load it and then we will start a new chunk
                    self.log.debug("Loading ttl chunk %s file %s" % (chunk_count, fp.name))
                    header_ttl = self.get_turtle_template(chunk)
                    fp.write(header_ttl + '\n')
                    fp.write(chunk)
                    fp.close()
                    data = self.load_data_from_file(fp, urlbase)
                    if data['status'] == 'failed':
                        return data

                    chunk = ""
                    total_triple_count += triple_count
                    triple_count = 0
                    chunk_count += 1

            # Load the last chunk
            if triple_count > 0:
                self.log.debug("Loading ttl chunk %s (last)" % (chunk_count))
                fp = tempfile.NamedTemporaryFile(dir=pathttl, prefix="tmp_"+self.alphanum_name, suffix=".ttl", mode="w", delete=False)
                header_ttl = self.get_turtle_template(chunk)
                fp.write(header_ttl + '\n')
                fp.write(chunk)
                fp.close()
                data = self.load_data_from_file(fp, urlbase)
                if data['status'] == 'failed':
                    return data

            total_triple_count += triple_count

            # Data is inserted, now insert the abstraction

            # We get the abstraction now as we need first to parse the whole file to have category_values
            abstraction_ttl = self.get_abstraction()
            domain_knowledge_ttl = self.get_domain_knowledge()
            header_ttl = self.get_turtle_template(abstraction_ttl+"\n"+domain_knowledge_ttl)

            fp = tempfile.NamedTemporaryFile(dir=pathttl, prefix="tmp_"+self.alphanum_name, suffix=".ttl", mode="w", delete=False)
            fp.write(header_ttl + '\n')
            fp.write(abstraction_ttl + '\n')
            fp.write(domain_knowledge_ttl + '\n')

            self.log.debug("Loading ttl abstraction file %s" % (fp.name))
            fp.close()
            data = self.load_data_from_file(fp, urlbase)
            if data['status'] == 'failed':
                return data
            data['total_triple_count'] = total_triple_count
            self.log.debug("source file : persist delete =>"+fp.name)

        else:

            sqb = SparqlQueryBuilder(self.settings, self.session)

            triple_count = 0
            chunk = ""
            for triple in content_ttl:

                chunk += triple + '\n'

                triple_count += 1

                if triple_count > int(self.settings['askomics.max_content_size_to_update_database']) / 10: # FIXME the limit is much lower than for load
                    # We have reached the maximum chunk size, load it and then we will start a new chunk
                    self.log.debug("Inserting ttl chunk %s" % (chunk_count))
                    try:
                        header_ttl = sqb.header_sparql_config(chunk)
                        queryResults = ql.insert_data(chunk, self.graph, header_ttl)
                    except Exception as e:
                        return self._format_exception(e)

                    chunk = ""
                    total_triple_count += triple_count
                    triple_count = 0
                    chunk_count += 1

            # Load the last chunk
            if triple_count > 0:
                self.log.debug("Inserting ttl chunk %s (last)" % (chunk_count))

                try:
                    header_ttl = sqb.header_sparql_config(chunk)
                    queryResults = ql.insert_data(chunk, self.graph, header_ttl)
                except Exception as e:
                    return self._format_exception(e)

            total_triple_count += triple_count

            # Data is inserted, now insert the abstraction

            # We get the abstraction now as we need first to parse the whole file to have category_values
            abstraction_ttl = self.get_abstraction()
            domain_knowledge_ttl = self.get_domain_knowledge()

            chunk += abstraction_ttl + '\n'
            chunk += domain_knowledge_ttl + '\n'

            self.log.debug("Inserting ttl abstraction")
            try:
                header_ttl = sqb.header_sparql_config(chunk)
                ql.insert_data(chunk, self.graph, header_ttl)
            except Exception as e:
                return self._format_exception(e)

            self.metadatas['graphName'] = self.graph
            sparqlHeader = sqb.header_sparql_config("")

            data = {}

            if 'server' in queryResults.info():
                self.metadatas['server'] = queryResults.info()['server']
            else:
                self.metadatas['server'] = 'unknown'

            data['status'] = 'ok'
            data['total_triple_count'] = total_triple_count

        data['expected_lines_number'] = self.get_number_of_lines()

        return data

    def load_data_from_file(self, fp, urlbase):
        """
        Load a locally created ttl file in the triplestore using http (with load_data(url)) or with the filename for Fuseki (with fuseki_load_data(fp.name)).

        :param fp: a file handle for the file to load
        :param urlbase:the base URL of current askomics instance. It is used to let triple stores access some askomics temporary ttl files using http.
        :return: a dictionnary with information on the success or failure of the operation
        """
        if not fp.closed:
            fp.flush() # This is required as otherwise, data might not be really written to the file before being sent to triplestore

        ql = QueryLauncher(self.settings, self.session)

        if self.is_defined('askomics.load_url'):
            urlbase = self.settings['askomics.load_url']

        url = urlbase+"/ttl/"+ self.session['username'] + '/' + os.path.basename(fp.name)
        self.log.debug(url)
        data = {}
        data["status"] = "ok"
        try:
            if self.is_defined("askomics.file_upload_url"):
                queryResults = ql.upload_data(fp.name, self.graph)
            else:
                queryResults = ql.load_data(url, self.graph)
        except Exception as e:
            self.log.error(self._format_exception(e))
            raise e

        finally:
            os.remove(fp.name)

        return data

    def _format_exception(self, e, data=None, ctx='loading data'):
        from traceback import format_tb, format_exception_only
        from html import escape

        fexception = format_exception_only(type(e), e)
        ftb = format_tb(e.__traceback__)
        self.log.debug(ftb)
        #fexception = fexception + ftb

        self.log.error("Error in %s while %s: %s", __name__, ctx, '\n'.join(fexception))

        fexception = escape('\n'.join(fexception))
        error = '<strong>Error while %s:</strong><pre>%s</pre>' % (ctx, fexception)

        if self.settings["askomics.debug"]:
            error += """<p><strong>Traceback</strong> (most recent call last): <br />
                    <ul>
                        <li><pre>%s</pre></li>
                    </ul>
                    """ % '</pre></li><pre><li>'.join(map(escape, ftb))

        if data is None:
            data = {}
        data['status'] = 'failed'
        data['error'] = error
        return data

    def get_number_of_lines(self):
        """
        Get the number of line of a tabulated file

        :return: number of ligne (int)
        """

        with open(self.path, encoding="utf-8", errors="ignore") as f:
            for number, l in enumerate(f):
                pass

        return number
