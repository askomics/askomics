"""
Classes to import data from source files
"""
import re
import logging
import csv
from collections import defaultdict
from itertools import count
import os.path
import tempfile
import time
import getpass
from pkg_resources import get_distribution

from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.utils import cached_property, HaveCachedProperties, pformat_generic_object
from askomics.libaskomics.integration.AbstractedEntity import AbstractedEntity
from askomics.libaskomics.integration.AbstractedRelation import AbstractedRelation

class SourceFileSyntaxError(SyntaxError):
    pass

class SourceFile(ParamManager, HaveCachedProperties):
    """
    Class representing a source file.
    """

    def __init__(self, settings, session, path, preview_limit):

        ParamManager.__init__(self, settings, session)

        self.path = path

        # The name should not contain extension as dots are not allowed in rdf names
        self.name = os.path.splitext(os.path.basename(path))[0]
        # FIXME check name uniqueness as we remove extension (collision if uploading example.tsv and example.txt)

        self.preview_limit = preview_limit

        self.forced_column_types = ['entity']

        self.category_values = defaultdict(set)

        self.type_dict = {
            'numeric' : 'xsd:decimal',
            'text'    : 'xsd:string',
            'category': ':',
            'taxon': ':',
            'ref': ':',
            'start': 'xsd:decimal',
            'end': 'xsd:decimal',
            'entity'  : ':',
            'entitySym'  : ':',
            'entity_start'  : ':'}

        self.delims = {
            'numeric' : ('', ''),
            'text'    : ('"', '"'),
            'category': (':', ''),
            'taxon': (':', ''),
            'ref': (':', ''),
            'start' : ('', ''),
            'end' : ('', ''),
            'entity'  : (':', ''),
            'entitySym'  : (':', ''),
            'entity_start'  : (':', '')}

        self.metadatas = {
            'loadDate': '',
            'username': getpass.getuser(),
            'fileName': self.name,
            'version': get_distribution('Askomics').version,
            'server': '',
            'graphName':''}

        self.log = logging.getLogger(__name__)

        self.reset_cache()

    @cached_property
    def dialect(self):
        """
        Use csv.Sniffer to predict the CSV/TSV dialect
        """
        with open(self.path, 'r') as tabfile:
            # The sniffer needs to have enough data to guess, and we restrict to a list of allowed delimiters to avoid strange results
            dialect = csv.Sniffer().sniff(tabfile.read(1024*16), delimiters=',\t ')
            self.log.debug("CSV dialect in %r: %s" % (self.path, pformat_generic_object(dialect)))
            return dialect

    @cached_property
    def headers(self):
        """
        Read and return the column headers.

        :return: a List of column headers
        :rtype: List
        """

        headers = []
        with open(self.path, 'r') as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, dialect=self.dialect)

            # first line is header
            headers = next(tabreader)

        return headers

    def get_preview_data(self):
        """
        Read and return the values from the first lines of file.

        :return: a List of List of column values
        :rtype: List
        """

        with open(self.path, 'r') as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, dialect=self.dialect)

            count = 0

            header = next(tabreader) # Skip header

            # Loop on lines
            data = [[] for x in range(len(header))]
            for row in tabreader:

                # Fill data lists
                for i, val in enumerate(row):
                    data[i].append(val)

                # Stop after x lines
                count += 1
                if count > self.preview_limit:
                    break

        return data

    #Not used
    def guess_column_types(self, columns, headers):
        """
        For each column given, return a guessed column type

        :param columns: List of List of values
        :return: List of guessed column types
        """

        data=[]
        count=0
        for col in columns:
            header = headers[count]
            data.append(self.guess_values_type(col,header))
            count+=1
        return data
        #return [self.guess_values_type(col) for col in columns]

    def guess_values_type(self, values, header):
        """
        From a list of values, guess the data type

        :param values: a List of values to evaluate
        :param num: index of the header
        :return: the guessed type ('taxon','ref', 'start', 'end', 'numeric', 'text' or 'category')
        """

        types = {'ref':('chrom', 'ref'), 'taxon':('taxon', 'species'), 'start':('start', 'begin'), 'end':('end', 'stop')}

        # First check if it is specific type
        self.log.debug('header: '+header)
        for typ, expressions in types.items():
            for expression in expressions:
                regexp = '.*' + expression + '.*'
                if re.match(regexp, header, re.IGNORECASE) is not None:
                    # Test if start and end values are numerics
                    if typ in ('start', 'end') and not all(self.is_decimal(val) for val in values):
                        self.log.debug('ERROR! '+typ+' is not decimal!')
                        break
                    # test if taxon and ref are category
                    # FIXME: taxon and ref may not be a category ?
                    if typ in ('ref', 'taxon') and not len(set(values)) < len(values) / 2:
                        self.log.debug('ERROR! '+typ+' is not category!')
                        break
                    return typ

        # Then, check if category
        if len(set(values)) < len(values) / 2:
            return 'category'
        elif all(self.is_decimal(val) for val in values): # Then numeric
            return 'numeric'
        else: # default is text
            return 'text'

    @staticmethod
    def is_decimal(value):
        """
        Determine if given value is a decimal (integer or float) or not

        :param value: the value to evaluate
        :return: True if the value is decimal
        """
        if value.isdigit():
            return True
        else:
            try:
                float(value)
                return True
            except ValueError:
                return False

    def set_forced_column_types(self, types):
        """
        Set manually curated types for column

        :param types: a List of column types ('entity', 'entity_start', 'numeric', 'text' or 'category')
        """

        self.forced_column_types = types

        if len(self.forced_column_types) != len(self.headers):
            raise ValueError("forced_column_types hve a different size that headers ! forced_column_types:"+str(self.forced_column_types)+" headers:"+str(self.headers))

    def set_disabled_columns(self, disabled_columns):
        """
        Set manually curated types for column

        :param disabled_columns: a List of column ids (0 based) that should not be imported
        """

        self.disabled_columns = disabled_columns

    def get_abstraction(self):
        # TODO use rdflib or other abstraction layer to create rdf
        """
        Get the abstraction representing the source file in ttl format

        :return: ttl content for the abstraction
        """
        if len(self.forced_column_types)<=0:
            raise ValueError("forced_column_types is not defined !")

        ttl = ''
        ref_entity = self.headers[0]

        # Store the main entity
        ttl += AbstractedEntity(ref_entity).get_turtle()

        # Store all the relations
        for key, key_type in enumerate(self.forced_column_types):
            if key > 0 and key not in self.disabled_columns:
                ttl += AbstractedRelation(key_type, self.headers[key], ref_entity, self.type_dict[key_type]).get_turtle()

            if key > 0 and not key_type.startswith('entity'):
                ttl += ":" + self.headers[key] + ' displaySetting:attribute "true"^^xsd:boolean .\n'

        # Store the startpoint status
        if self.forced_column_types[0] == 'entity_start':
            ttl += ":" + ref_entity + ' displaySetting:startPoint "true"^^xsd:boolean .\n'

        return ttl

    def get_domain_knowledge(self):
        # TODO use rdflib or other abstraction layer to create rdf
        """
        Get the domain knowledge representing the source file in ttl format

        :return: ttl content for the domain knowledge
        """

        ttl = ''

        if all(types in self.forced_column_types for types in ('start', 'end', 'ref', 'taxon')):
            ttl += ":" + self.headers[0] + ' displaySetting:is_positionable "true"^^xsd:boolean .\n'
            ttl += ":is_positionable rdfs:label 'is_positionable' .\n"
            ttl += ":is_positionable rdf:type owl:ObjectProperty .\n"
            # Store the position attributes
            for key, key_type in enumerate(self.forced_column_types):
                if key > 0 and key_type == 'taxon':
                    ttl += ":" + self.headers[0] + " displaySetting:position_taxon :" + self.headers[key] + " .\n"
                if key > 0 and key_type == 'ref':
                    ttl += ":" + self.headers[0] + " displaySetting:position_reference :" + self.headers[key] + " .\n"
                if key > 0 and key_type == 'start':
                    ttl += ":" + self.headers[0] + " displaySetting:position_start :" + self.headers[key] + " .\n"
                if key > 0 and key_type == 'end':
                    ttl += ":" + self.headers[0] + " displaySetting:position_end :" + self.headers[key] + " .\n"

        for header, categories in self.category_values.items():
            indent = len(header) * " " + len("displaySetting:category") * " " + 3 * " "
            ttl += ":" + header+"Category" + " displaySetting:category :"
            ttl += (" , \n" + indent + ":").join(categories) + " .\n"

            for item in categories:
                ttl += ":" + item + " rdf:type :" + header + " ;\n" + len(item) * " " + "  rdfs:label \"" + item + "\" .\n"

        return ttl


    @cached_property
    def category_values(self):
        """
        A (lazily cached) dictionary mapping from column name (header) to the set of unique values.
        """
        self.log.warning("category_values will be computed independently, get_turtle should be used to generate both at once (better performances)")
        category_values = defaultdict(set) # key=name of a column of 'category' type -> list of found values

        with open(self.path, 'r') as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, dialect=self.dialect)
            next(tabreader) # Skip header

            entity_label=""
            # Loop on lines
            for row_number, row in enumerate(tabreader):
                #blanck line
                if len(row) == 0:
                    continue
                if len(row) != len(self.headers):
                    e = SourceFileSyntaxError('Invalid line found: '+str(self.headers)+' columns expected, found '+str(len(row))+" - (last valid entity "+entity_label+")")
                    e.filename = self.path
                    e.lineno = row_number
                    log.error(repr(e))
                    raise e

                entity_label = row[0]
                for i, (header, current_type) in enumerate(zip(self.headers, self.forced_column_types)):
                    if current_type in ('category', 'taxon', 'ref'):
                        # This is a category, keep track of allowed values for this column
                        self.category_values.setdefault(header, set()).add(row[i])

        return category_values

    def get_turtle(self, preview_only=False):
        # TODO use rdflib or other abstraction layer to create rdf

        self.category_values = defaultdict(set) # key=name of a column of 'category' type -> list of found values

        with open(self.path, 'r') as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, dialect=self.dialect)

            next(tabreader) # Skip header

            # Loop on lines
            for row_number, row in enumerate(tabreader):
                ttl    = ""
                ttlSym = ""
                #if len(row)>0:
                #    self.log.debug(row[0]+' '+str(row_number))
                #blanck line
                if len(row) == 0:
                    continue

                if len(row) != len(self.headers):
                    e = SourceFileSyntaxError('Invalid line found: '+str(len(self.headers))+' columns expected, found '+str(len(row))+" - (last valid entity "+entity_label+")")
                    e.filename = self.path
                    e.lineno = row_number
                    self.log.error(repr(e))
                    raise e

                # Create the entity (first column)
                entity_label = row[0]
                indent = (len(entity_label) + 1) * " "
                ttl += ":" + entity_label + " rdf:type :" + self.headers[0] + " ;\n"
                ttl += indent + " rdfs:label \"" + entity_label + "\" ;\n"

                # Add data from other columns
                for i, header in enumerate(self.headers): # Skip the first column
                    if i > 0 and i not in self.disabled_columns:
                        current_type = self.forced_column_types[i]
                        #if current_type == 'entity':
                            #relations.setdefault(header, {}).setdefault(entity_label, []).append(row[i]) # FIXME only useful if we want to check for duplicates
                        #else

                        #OFI : manage new header with relation@type_entity
                        #relationName = ":has_" + header # manage old way
                        relationName = ":"+header # manage old way
                        if current_type.startswith('entity'):
                            idx = header.find("@")
                            if ( idx > 0 ):
                                relationName = ":"+header[0:idx]

                        if current_type in ('category', 'taxon', 'ref'):
                            # This is a category, keep track of allowed values for this column
                            self.category_values[header].add(row[i])

                        # Create link to value
                        if row[i]: # Empty values are just ignored
                            ttl += indent + " "+ relationName + " " + self.delims[current_type][0] + row[i] + self.delims[current_type][1] + " ;\n"
                        if current_type == 'entitySym':
                            ttlSym += self.delims[current_type][0] + row[i] + self.delims[current_type][1] + " "+ relationName + " :" + entity_label  + " .\n"
                        # FIXME we will need to store undefined values one day if we want to be able to query on this

                ttl = ttl[:-2] + "."
                #manage symmetric relation
                if ttlSym != "":
                    yield ttlSym

                yield ttl
                # Stop after x lines
                if preview_only and row_number > self.preview_limit:
                    return

    def get_metadatas(self):
        """
        Create metadatas and insert them into AskOmics main graph.
        """
        self.log.debug("====== INSERT METADATAS ======")
        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)

        ttlMetadatas = "<" + self.metadatas['graphName'] + "> " + "prov:generatedAtTime " + '"' + self.metadatas['loadDate'] + '"^^xsd:dateTime .\n'
        ttlMetadatas += "<" + self.metadatas['graphName'] + "> " + "dc:creator " + '"' + self.metadatas['username'] + '"^^xsd:string  .\n'
        ttlMetadatas += "<" + self.metadatas['graphName'] + "> " + "prov:wasDerivedFrom " + '"' + self.metadatas['fileName'] + '"^^xsd:string .\n'
        ttlMetadatas += "<" + self.metadatas['graphName'] + "> " + "dc:hasVersion " + '"' + self.metadatas['version'] + '"^^xsd:string .\n'
        ttlMetadatas += "<" + self.metadatas['graphName'] + "> " + "prov:describesService " + '"' + self.metadatas['server'] + '"^^xsd:string .'

        sparqlHeader = sqb.header_sparql_config()

        ql.insert_data(ttlMetadatas, self.get_param("askomics.graph"), sparqlHeader)

    @cached_property
    def existing_relations(self):
        """
        Fetch from triplestore the existing relations if entities of the same name exist

        :return: a List of relation names
        :rtype: List
        """
        self.log.debug("existing_relations")
        existing_relations = []

        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)

        sparql_template = self.get_template_sparql(self.ASKOMICS_get_class_info_from_abstraction_queryFile)
        query = sqb.load_from_file(sparql_template, {"nodeClass": self.headers[0]}).query

        results = ql.process_query(query)

        self.log.debug(results)
        self.log.debug("==================")

        for rel in results:
            existing_relations.append(rel["relation"].replace(self.get_param("askomics.prefix"), "").replace("has_", ""))

        return existing_relations

    def compare_to_database(self):
        """
        Ask the database to compare the headers of a file to convert to the corresponding data in the database

        :return: a tuple containing 2 Lists: status of asked headers, and missing headers
        """

        headers_status = []
        missing_headers = []

        header_tmp = []
        # change header to avoid @ character
        for header in self.headers[1:]:
            idx = header.find("@")
            if idx != -1:
                header_tmp.append(header[0:idx])
                header = header[idx+1:]
            else:
                header_tmp.append(header)

        if self.existing_relations == []:
            # No results, everything is new
            for elem in header_tmp:
                headers_status.append('new')

            return headers_status, missing_headers

        for rel in self.existing_relations:
            if rel not in header_tmp:
                self.log.warning('Expected relation "%s" but did not find corresponding source file: %s.', rel, repr(header_tmp))
                missing_headers.append(rel)

        headers_status.append('present') # There are some existing relations, it means the entity is present

        for header in header_tmp[1:]:
            if header not in self.existing_relations:
                self.log.debug('New class detected "%s".', header)
                headers_status.append('new')
            elif header not in missing_headers:
                self.log.debug('Known class detected "%s".', header)
                headers_status.append('present')

        return headers_status, missing_headers

    def persist(self, urlbase,method):
        """
        Store the current source file in the triple store

        :param urlbase: the base URL of current askomics instance. It is used to let triple stores access some askomics temporary ttl files using http.
        :return: a dictionnary with information on the success or failure of the operation
        :rtype: Dict
        """

        header_ttl = self.get_turtle_template()
        content_ttl = self.get_turtle()

        ql = QueryLauncher(self.settings, self.session)

        # use insert data instead of load sparql procedure when the dataset is small
        total_triple_count = 0
        chunk_count = 1
        if method == 'load':

            fp = None

            triple_count = 0
            for triple in content_ttl:
                if not fp:
                    pathttl = self.get_ttl_directory()
                    # Temp file must be accessed by http so we place it in askomics/ttl/ dir
                    fp = tempfile.NamedTemporaryFile(dir=pathttl, prefix="tmp_"+self.metadatas['fileName'], suffix=".ttl", mode="w", delete=False)
                    fp.write(header_ttl + '\n')

                fp.write(triple + '\n')

                triple_count += 1

                if triple_count > int(self.settings['askomics.max_content_size_to_update_database']):
                    # We have reached the maximum chunk size, load it and then we will start a new chunk
                    self.log.debug("Loading ttl chunk %s file %s" % (chunk_count, fp.name))
                    fp.close()
                    data = self.load_data_from_file(fp, urlbase)
                    if data['status'] == 'failed':
                        return data

                    fp = None
                    total_triple_count += triple_count
                    triple_count = 0
                    chunk_count += 1

            # Load the last chunk
            if triple_count > 0:
                self.log.debug("Loading ttl chunk %s (last) file %s" % (chunk_count, fp.name))
                fp.close()
                data = self.load_data_from_file(fp, urlbase)
                if data['status'] == 'failed':
                    return data

            total_triple_count += triple_count

            # Data is inserted, now insert the abstraction

            # We get the abstraction now as we need first to parse the whole file to have category_values
            abstraction_ttl = self.get_abstraction()
            domain_knowledge_ttl = self.get_domain_knowledge()

            os.remove(fp.name) # Everything ok, remove previous temp file
            fp = tempfile.NamedTemporaryFile(dir=pathttl, prefix="tmp_"+self.metadatas['fileName'], suffix=".ttl", mode="w", delete=False)
            fp.write(header_ttl + '\n')
            fp.write(abstraction_ttl + '\n')
            fp.write(domain_knowledge_ttl + '\n')

            self.log.debug("Loading ttl abstraction file %s" % (fp.name))
            fp.close()
            data = self.load_data_from_file(fp, urlbase)
            if data['status'] == 'failed':
                return data
            data['total_triple_count'] = total_triple_count

        else:

            sqb = SparqlQueryBuilder(self.settings, self.session)
            header_ttl = sqb.header_sparql_config()

            graphName = "urn:sparql:" + self.name + ':' + time.strftime('%Y-%m-%d',time.localtime())

            triple_count = 0
            chunk = ""
            for triple in content_ttl:

                chunk += triple + '\n'

                triple_count += 1

                if triple_count > int(self.settings['askomics.max_content_size_to_update_database']) / 10: # FIXME the limit is much lower than for load
                    # We have reached the maximum chunk size, load it and then we will start a new chunk
                    self.log.debug("Inserting ttl chunk %s" % (chunk_count))
                    try:
                        queryResults = ql.insert_data(chunk, graphName, header_ttl)
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
                    queryResults = ql.insert_data(chunk, graphName, header_ttl)
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
                ql.insert_data(chunk, graphName, header_ttl)
            except Exception as e:
                return self._format_exception(e)

            ttlNamedGraph = "<" + graphName + "> " + "rdfg:subGraphOf" + " <" + self.get_param("askomics.graph") + "> ."
            self.metadatas['graphName'] = graphName
            sparqlHeader = sqb.header_sparql_config()
            ql.insert_data(ttlNamedGraph, self.get_param("askomics.graph"), sparqlHeader)

            data = {}

            self.metadatas['server'] = queryResults.info()['server']
            self.metadatas['loadDate'] = time.strftime('%Y-%m-%d',time.localtime())

            data['status'] = 'ok'
            data['total_triple_count'] = total_triple_count
            self.get_metadatas()

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

        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)
        graphName = "urn:sparql:" + self.name + ':' + time.strftime('%Y-%m-%d',time.localtime())
        self.metadatas['graphName'] = graphName
        ttlNamedGraph = "<" + graphName + "> " + "rdfg:subGraphOf" + " <" + self.get_param("askomics.graph") + "> ."
        sparqlHeader = sqb.header_sparql_config()
        ql.insert_data(ttlNamedGraph, self.get_param("askomics.graph"), sparqlHeader)

        url = urlbase+"/ttl/"+os.path.basename(fp.name)
        data = {}
        try:
            if self.is_defined("askomics.file_upload_url"):
                queryResults = ql.upload_data(fp.name, graphName)
                self.metadatas['server'] = queryResults.headers['Server']
                self.metadatas['loadDate'] = time.strftime('%Y-%m-%d',time.localtime())
            else:
                queryResults = ql.load_data(url, graphName)
                self.metadatas['server'] = queryResults.info()['server']
                self.metadatas['loadDate'] = time.strftime('%Y-%m-%d',time.localtime())
            data['status'] = 'ok'
        except Exception as e:
            self._format_exception(e, data=data)
        finally:
            if self.settings["askomics.debug"]:
                data['url'] = url
            else:
                os.remove(fp.name) # Everything ok, remove temp file

        self.get_metadatas()

        return data

    def _format_exception(self, e, data=None, ctx='loading data'):
        from traceback import format_tb, format_exception_only
        from html import escape

        fexception = format_exception_only(type(e), e)
        ftb = format_tb(e.__traceback__)

        self.log.error("Error in %s while %s: %s", __name__, ctx, '\n'.join(fexception + ftb))

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
