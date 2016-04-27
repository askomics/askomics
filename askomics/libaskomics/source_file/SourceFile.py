"""
Classes to import data from source files
"""
import re
import logging
import csv
from collections import defaultdict
from itertools import count
import os.path

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

        self.forced_column_types = None # FIXME should it have a default value? (guessed headers?) otherwise we must call the setter before using this (or make it an arg to methods using this)

        self.type_dict = {
            'numeric' : 'xsd:decimal',
            'text'    : 'xsd:string',
            'category': ':',
            'entity'  : ':',
            'entity_start'  : ':'}

        self.delims = {
            'numeric' : ('', ''),
            'text'    : ('"', '"'),
            'category': (':', ''),
            'entity'  : (':', ''),
            'entity_start'  : (':', '')}

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
            if headers[0].startswith('#'):
                headers[0] = re.sub('^#+', '', s) # Remove leading comment signs

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
                # skip commented lines (# char at the begining)
                if row[0].startswith('#'):
                    continue

                # Fill data lists
                for i, val in enumerate(row):
                    data[i].append(val)

                # Stop after x lines
                count += 1
                if count > self.preview_limit:
                    break

        return data

    def guess_column_types(self, columns):
        """
        For each column given, return a guessed column type

        :param columns: List of List of values
        :return: List of guessed column types
        """

        return [self.guess_values_type(col) for col in columns]

    def guess_values_type(self, values):
        """
        From a list of values, guess the data type

        :param values: a List of values to evaluate
        :return: the guessed type ('numeric', 'text' or 'category'
        """

        # First check if category
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

        ttl = ''
        ref_entity = self.headers[0]

        # Store the main entity
        ttl += AbstractedEntity(ref_entity).get_turtle()

        # Store all the relations
        for key, key_type in enumerate(self.forced_column_types):
            if key > 0 and key not in self.disabled_columns:
                ttl += AbstractedRelation(key_type, self.headers[key], ref_entity, self.type_dict[key_type]).get_turtle()

        # Store the startpoint status
        if self.forced_column_types[0] == 'entity_start':
            ttl += ":" + ref_entity + ' displaySetting:startPoint "true"^^xsd:boolean .\n'
        else:
            ttl += ":" + ref_entity + ' displaySetting:attribute "true"^^xsd:boolean .\n'

        return ttl

    def get_domain_knowledge(self):
        # TODO use rdflib or other abstraction layer to create rdf
        """
        Get the domain knowledge representing the source file in ttl format

        :return: ttl content for the domain knowledge
        """

        ttl = ''

        for header, categories in self.category_values.items():
            indent = len(header) * " " + len("displaySetting:has_category") * " " + 3 * " "
            ttl += ":" + header + " displaySetting:has_category :"
            ttl += (" , \n" + indent + ":").join(categories) + " .\n"

            for item in categories:
                ttl += ":" + item + " rdf:type :" + header + " ;\n" + len(item) * " " + "  rdfs:label \"" + item + "\" .\n"

        return ttl


    @cached_property
    def category_values(self):
        """
        A (lazily cached) dictionary mapping from column name (header) to the set of unique values.
        """
        self.log.warning("category_values are computed independently, get_turtle should be used to generate both at once")
        category_values = defaultdict(set) # key=name of a column of 'category' type -> list of found values

        with open(self.path, 'r') as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, dialect=self.dialect)
            next(tabreader) # Skip header

            # Loop on lines
            for row_number, row in enumerate(tabreader):
                # skip commented lines (# char at the begining)
                if row[0].startswith('#'):
                    continue

                if len(row) != len(self.headers):
                    e = SourceFileSyntaxError('Invalid line found: %s columns expected, found %s' %s (str(self.headers), str(len(row))))
                    e.filename = self.path
                    e.lineno = row_number
                    log.error(repr(e))
                    raise e #FIXME: Do we want to read the file anyway ?

                for i, (header, current_type) in enumerate(zip(self.headers, self.forced_column_types)):
                    if current_type == 'category':
                        # This is a category, keep track of allowed values for this column
                        self.category_values.setdefault(header, set()).add(row[i])

        return category_values

    def get_preview_turtle(self):
        """
        Get a preview of turtle representation of data in the source file.

        This is a shortcut to get_turtle(preview_only=True)
        :return: ttl preview
        """
        return self.get_turtle(True)

    def get_turtle(self, preview_only=False):
        # TODO make this a generator to avoid loading all data in memory, and allow writing in streaming mode
        #      hum, not sure if it's not better to first parse the whole file before touching the db in case the file is malformatted
        #      see if we can rollback in case of error
        # TODO use rdflib or other abstraction layer to create rdf

        self.category_values = defaultdict(set) # key=name of a column of 'category' type -> list of found values

        with open(self.path, 'r') as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, dialect=self.dialect)

            count = 0

            next(tabreader) # Skip header

            ttl = ""

            # Loop on lines
            for row in tabreader:
                # skip commented lines (# char at the begining)
                if row[0].startswith('#'):
                    continue

                if len(row) != len(self.headers):
                    e = SourceFileSyntaxError('Invalid line found: %s columns expected, found %s' %s (str(self.headers), str(len(row))))
                    e.filename = self.path
                    e.lineno = row_number
                    self.log.error(repr(e))
                    raise e #FIXME: Do we want to read the file anyway ?

                # Create the entity (first column)
                entity_label = row[0]
                indent = (len(entity_label) + 1) * " "
                ttl += ":" + entity_label + " rdf:type :" + self.headers[0] + " ;\n"
                ttl += indent + " rdfs:label \"" + entity_label + "\" ;\n"

                # Add data from other columns
                for i, header in enumerate(self.headers[1:]): # Skip the first column
                    if i not in self.disabled_columns:
                        current_type = self.forced_column_types[i]
                        #if current_type == 'entity':
                            #relations.setdefault(header, {}).setdefault(entity_label, []).append(row[i]) # FIXME only useful if we want to check for duplicates
                        #else
                        if current_type == 'category':
                            # This is a category, keep track of allowed values for this column
                            self.category_values[header].add(row[i])

                        # Create link to value
                        if row[i]: # Empty values are just ignored
                            ttl += indent + " :has_" + header + " " + self.delims[current_type][0] + row[i] + self.delims[current_type][1] + " ;\n"
                        # FIXME we will need to store undefined values one day if we want to be able to query on this

                ttl = ttl[:-2] + ".\n"

                # Stop after x lines
                count += 1
                if preview_only and count > self.preview_limit:
                    break

        return ttl

    @cached_property
    def existing_relations(self):
        """
        Fetch from triplestore the existing relations if entities of the same name exist

        :return: a List of relation names
        :rtype: List
        """

        existing_relations = []

        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)

        sparql_template = self.get_template_sparql(self.ASKOMICS_get_class_info_from_abstraction_queryFile)
        query = sqb.load_from_file(sparql_template, {"#nodeClass#": self.headers[0]}).query

        results = ql.process_query(query)

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

        if self.existing_relations == []:
            # No results, everything is new
            for k, h in enumerate(self.headers):
                headers_status.append('new')

            return headers_status, missing_headers


        for rel in self.existing_relations:
            if rel not in self.headers:
                self.log.warning('Expected relation "%s" but did not find corresponding source file: %s.', rel, repr(headers))
                missing_headers.append(rel)

        headers_status.append('present') # There are some existing relations, it means the entity is present

        for header in self.headers[1:]:
            if header not in self.existing_relations:
                self.log.debug('New class detected "%s".', header)
                headers_status.append('new')
            elif header not in missing_headers:
                self.log.debug('Known class detected "%s".', header)
                headers_status.append('present')

        return headers_status, missing_headers
