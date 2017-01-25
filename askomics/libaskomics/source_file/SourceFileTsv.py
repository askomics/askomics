"""
Classes to import data from a gff3 source files
"""
import re
import csv
from collections import defaultdict
from pkg_resources import get_distribution
import urllib.parse

from askomics.libaskomics.source_file.SourceFile import SourceFile
from askomics.libaskomics.integration.AbstractedEntity import AbstractedEntity
from askomics.libaskomics.integration.AbstractedRelation import AbstractedRelation
from askomics.libaskomics.utils import cached_property, HaveCachedProperties, pformat_generic_object

class SourceFileTsv(SourceFile):
    """
    Class representing a Gff3 Source file
    """

    def __init__(self, settings, session, path, preview_limit):

        SourceFile.__init__(self, settings, session, path)

        self.type = 'tsv'

        self.preview_limit = preview_limit

        self.forced_column_types = ['entity']

        self.category_values = defaultdict(set)

        self.type_dict = {
            'numeric' : 'xsd:decimal',
            'text'    : 'xsd:string',
            'category': ':',
            'taxon': ':',
            'ref': ':',
            'strand': ':',
            'start': 'xsd:decimal',
            'end': 'xsd:decimal',
            'entity'  : ':',
            'entitySym'  : ':',
            'entity_start'  : ':'}

        self.delims = {
            'numeric' : ('', ''),
            'text'    : ('"', '"^^xsd:string'),
            'category': (':', ''),
            'taxon': (':', ''),
            'ref': (':', ''),
            'strand': (':', ''),
            'start' : ('', ''),
            'end' : ('', ''),
            'entity'  : (':', ''),
            'entitySym'  : (':', ''),
            'entity_start'  : (':', '')}

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

    def guess_values_type(self, values, header):
        """
        From a list of values, guess the data type

        :param values: a List of values to evaluate
        :param num: index of the header
        :return: the guessed type ('taxon','ref', 'strand', 'start', 'end', 'numeric', 'text' or 'category')
        """

        types = {'ref':('chrom', 'ref'), 'taxon':('taxon', 'species'), 'strand':('strand',), 'start':('start', 'begin'), 'end':('end', 'stop')}

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
                    # Test if strand is a category with only 2 elements max
                    if typ == 'strand' and len(set(values)) != 2:
                        break

                    return typ



        # check if relationShip with an other local entity
        if header.find("@")>0:
            #m = re.search('@(...):', header)
            #maybe by value
            #if all( (val.lower().find("go:")>=0) for val in values):
            #    raise ValueError("header for go:term follow this syntax: relationName@go:term")

            #general relation by default
            return "entity"
        # Then, check if category

        #if all(re.match(r'^\w+$', val) for val in values):#check if no scape chararcter
        if all(self.is_decimal(val) for val in values): # Then numeric
            return 'numeric'
        elif len(set(values)) < len(values) / 2:
            return 'category'


        # default is text
        return 'text'

    @staticmethod
    def is_decimal(value):
        """
        Determine if given value is a decimal (integer or float) or not

        :param value: the value to evaluate
        :return: True if the value is decimal
        """

        if value == "":
            return True
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
            if key > 0 and not key_type.startswith('entity'):
                if key_type in ('taxon', 'ref', 'strand', 'start', 'end'):
                    uri = 'position_'+key_type
                else:
                    uri = urllib.parse.quote(self.headers[key])
                ttl += ":" + uri + ' displaySetting:attribute "true"^^xsd:boolean .\n'

            if key > 0 and key not in self.disabled_columns:
                ttl += AbstractedRelation(key_type, self.headers[key], ref_entity, self.type_dict[key_type]).get_turtle()

        # Store the startpoint status
        if self.forced_column_types[0] == 'entity_start':
            ttl += ":" + urllib.parse.quote(ref_entity) + ' displaySetting:startPoint "true"^^xsd:boolean .\n'

        return ttl

    def get_domain_knowledge(self):
        # TODO use rdflib or other abstraction layer to create rdf
        """
        Get the domain knowledge representing the source file in ttl format

        :return: ttl content for the domain knowledge
        """

        ttl = ''

        if all(types in self.forced_column_types for types in ('start', 'end')): # a positionable entity have to have a start and a end
            ttl += ":" + urllib.parse.quote(self.headers[0]) + ' displaySetting:is_positionable "true"^^xsd:boolean .\n'
            ttl += ":is_positionable rdfs:label 'is_positionable' .\n"
            ttl += ":is_positionable rdf:type owl:ObjectProperty .\n"

        for header, categories in self.category_values.items():
            indent = len(header) * " " + len("displaySetting:category") * " " + 3 * " "
            ttl += ":" + urllib.parse.quote(header+"Category") + " displaySetting:category :"
            ttl += (" , \n" + indent + ":").join(map(urllib.parse.quote,categories)) + " .\n"

            for item in categories:
                ttl += ":" + urllib.parse.quote(item) + " rdf:type :" + urllib.parse.quote(header) + " ;\n" + len(item) * " " + "  rdfs:label \"" + item + "\" .\n"

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

            entity_label = ""
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
                    if current_type in ('category', 'taxon', 'ref', 'strand'):
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
                ttl += ":" + urllib.parse.quote(entity_label) + " rdf:type :" + urllib.parse.quote(self.headers[0]) + " ;\n"
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
                        relationName = ":"+urllib.parse.quote(header) # manage old way
                        if current_type.startswith('entity'):
                            idx = header.find("@")
                            if ( idx > 0 ):
                                relationName = ":"+urllib.parse.quote(header[0:idx])

                        if current_type in ('category', 'taxon', 'ref', 'strand'):
                            # This is a category, keep track of allowed values for this column
                            self.category_values[header].add(row[i])
                            row[i] = urllib.parse.quote(row[i])

                        # Create link to value
                        if row[i]: # Empty values are just ignored
                            # positionable attributes
                            if current_type == 'start':
                                ttl += indent + " " + ':position_start' + " " + self.delims[current_type][0] + row[i] + self.delims[current_type][1] + " ;\n"
                            elif current_type == 'end':
                                ttl += indent + " " + ':position_end' + " " + self.delims[current_type][0] + row[i] + self.delims[current_type][1] + " ;\n"
                            elif current_type == 'taxon':
                                ttl += indent + " " + ':position_taxon' + " " + self.delims[current_type][0] + row[i] + self.delims[current_type][1] + " ;\n"
                            elif current_type == 'ref':
                                ttl += indent + " " + ':position_ref' + " " + self.delims[current_type][0] + row[i] + self.delims[current_type][1] + " ;\n"
                            elif current_type == 'strand':
                                ttl += indent + " " + ':position_strand' + " " + self.delims[current_type][0] + row[i] + self.delims[current_type][1] + " ;\n"
                            else:
                                ttl += indent + " "+ relationName + " " + self.delims[current_type][0] + row[i] + self.delims[current_type][1] + " ;\n"

                        if current_type == 'entitySym':
                            ttlSym += self.delims[current_type][0] + row[i] + self.delims[current_type][1] + " "+ relationName + " :" + urllib.parse.quote(entity_label)  + " .\n"

                ttl = ttl[:-2] + "."
                #manage symmetric relation
                if ttlSym != "":
                    yield ttlSym

                yield ttl
                # Stop after x lines
                if preview_only and row_number > self.preview_limit:
                    return

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
