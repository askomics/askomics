"""
Classes to import data from source files
"""
import re
import logging
import csv
from itertools import count
import os.path

class SourceFile(object):
    """
    Class representing a source file.
    """

    def __init__(self, path, preview_limit):

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
            'entity'  : ':'}

        self.delims = {
            'numeric' : ('', ''),
            'text'    : ('"', '"'),
            'category': (':', ''),
            'entity'  : (':', '')}

        self.log = logging.getLogger(__name__)

        self.reset_cache()

    def reset_cache(self):
        """
        Delete any cached content concerning the file
        """
        self.headers = None

        self.category_values = None

    def get_headers(self, delimiter='\t'):
        """
        Read and return the column headers.

        :param delimiter: the character delimiting columns.
        :return: a List of column headers
        :rtype: List
        """

        # Return cached list if we have it
        if self.headers:
            return self.headers

        self.headers = []
        with open(self.path, 'r') as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, delimiter=delimiter)

            # first line is header
            self.headers = next(tabreader)
            if self.headers[0].startswith('#'):
                self.headers[0] = re.sub('^#+', '', s) # Remove leading comment signs

        return self.headers

    def get_preview_data(self, delimiter='\t'):
        """
        Read and return the values from the first lines of file.

        :param delimiter: the character delimiting columns.
        :return: a List of List of column values
        :rtype: List
        """

        with open(self.path, 'r') as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, delimiter=delimiter)

            count = 0

            next(tabreader) # Skip header

            # Loop on lines
            data = []
            for row in tabreader:

                if not data:
                    data = [[] for x in range(len(row))]

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

        types = []
        for col in columns:
            types.append(self.guess_values_type(col))

        return types

    def guess_values_type(self, values):
        """
        From a list of values, guess the data type

        :param values: a List of values to evaluate
        :return: the guessed type ('numeric', 'text' or 'category'
        """

        # First check if category
        if len(set(values)) < len(values) / 2:
            return 'category'

        # Then numeric
        num = True
        for val in values:
            num = num and self.is_decimal(val)

        if num:
            return 'numeric'

        # default is text
        return 'text'

    def is_decimal(self, value):
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
        """

        self.forced_column_types = types

    def get_preview_turtle():
        """
        Get a preview of turtle representation of data in the source file.

        This is a shortcut to get_turtle(preview_only=True)
        :return: ttl preview
        """
        return self.get_turtle(True)

    def get_abstraction(self):
        # TODO use rdflib
        """
        Get the abstraction representing the source file in ttl format

        :return: ttl content for the abstraction
        """

        ttl = ''
        ref_entity = self.get_headers()[0]

        # Store the main entity
        ttl += AbstractedEntity(ref_entity).get_turtle()

        # Store all the relations
        for key, key_type in self.forced_column_types.items():
            if key != 0:
                ttl += AbstractedRelation(key_type, self.get_headers()[key], ref_entity, self.type_dict[key_type]).get_turtle()

        # Store the startpoint status
        if self.forced_column_types[0] == 'entity_start':
            ttl += ":" + ref_entity + ' displaySetting:startPoint "true"^^xsd:boolean .\n'
        else:
            ttl += ":" + ref_entity + ' displaySetting:attribute "true"^^xsd:boolean .\n'

    def get_domain_knowledge(self):
        # TODO use rdflib
        """
        Get the domain knowledge representing the source file in ttl format

        :return: ttl content for the domain knowledge
        """

        if self.category_values == None:
            # FIXME throw an error: we need to call get_turtle first!!
            log.error('You must call get_turtle before calling get_abstraction')
            return

        ttl = ''

        for header, categories in self.category_values.items():
            indent = len(header) * " " + len("displaySetting:has_category") * " " + 3 * " "
            ttl = ":" + header + " displaySetting:has_category :"
            ttl += (" , \n" + indent + ":").join(categories) + " .\n"

            for item in categories:
                ttl += ":" + item + " rdf:type :" + header + " ;\n" + len(item) * " " + "  rdfs:label \"" + item + "\" .\n"

        # TODO we should return the category values, but they need to be generated first by get_turtle (we should not parse the file 2 times)
        # FIXME what do we do if self.category_values is empty or if it contains data from preview only?
        # FIXME maybe we could allow to get domain only when full turtle has been generated?

    def get_turtle(self, preview_only=False):
        # TODO make this a generator to avoid loading all data in memory, and allow writing in streaming mode
        # TODO use rdflib

        self.category_values = {} # key=name of a column of 'category' type -> list of found values

        with open(self.path, 'r') as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, delimiter=delimiter)

            count = 0

            next(tabreader) # Skip header

            ttl = ""

            # Loop on lines
            for row in tabreader:

                # skip commented lines (# char at the begining)
                if row[0].startswith('#'):
                    continue

                if len(row) != len(self.get_headers()):
                    log.error('Invalid line found: %s columns expected, found %s' %s (str(self.get_headers()), str(len(row))))
                    # TODO catch error somewhere
                    continue

                # Create the entity (first column)
                entity_label = row[0]
                indent = (len(entity_label) + 1) * " "
                ttl += ":" + entity_label + " rdf:type :" + self.get_headers[0] + " ;\n"
                ttl += indent + " rdfs:label \"" + entity_label + "\" ;\n"

                # Add data from other columns
                for i, header in enumerate(self.get_headers()):
                    current_type = self.forced_column_types[i]
                    #if current_type == 'entity':
                        #relations.setdefault(header, {}).setdefault(entity_label, []).append(row[i]) # FIXME only useful if we want to check for duplicates
                    #else
                    if current_type == 'category':
                        # This is a category, keep track of allowed values for this column
                        self.category_values.setdefault(header, set()).add(row[i])

                    # Create link to value
                    ttl += indent + " :has_" + header + " " + self.delims[current_type][0] + row[i] + self.delims[current_type][1] + " ;\n"

                ttl = attribute_code[:-2] + ".\n"

                # Stop after x lines
                count += 1
                if preview_only and count > self.preview_limit:
                    break

        return ttl

    def compare_to_database(self):
        """
        Ask the database to compare the headers of a file to convert to the corresponding data in the database

        :return: a tuple containing 2 Lists: missing headers, new headers, and present headers
        """
        curr_entity = self.get_headers()[0]

        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)

        sparql_template = self.get_template_sparql(self.ASKOMICS_get_class_info_from_abstraction_queryFile)
        query = sqb.load_from_file(sparql_template, {"#nodeClass#": curr_entity}).query

        results = ql.process_query(query)

        if results == []:
            # No results, everything is new
            return [], self.get_headers(), []

        bdd_relations = []
        new_headers = []
        missing_headers = []
        present_headers = []

        for result in results:
            bdd_relation = result["relation"].replace(self.get_param("askomics.prefix"), "").replace("has_", "")
            bdd_relations.append(bdd_relation)
            if bdd_relation not in self.get_headers():
                self.log.warning('Expected relation "%s" but did not find it source file: %s.', bdd_relation, repr(headers))
                missing_headers.append(bdd_relation)

        for header in self.get_headers():
            if header != curr_entity:
                if header not in bdd_relations:
                    self.log.debug('New class detected "%s".', header)
                    new_headers.append(header)
                elif header not in missing_headers:
                    self.log.debug('Known class detected "%s".', header)
                    present_headers.append(header)

        return missing_headers, new_headers, present_headers
