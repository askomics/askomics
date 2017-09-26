#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""
Classes to import data from a tsv source files
"""

import re
import csv
import uuid
import json

from collections import defaultdict
from pkg_resources import get_distribution

from askomics.libaskomics.source_file.SourceFile import SourceFile,SourceFileSyntaxError
from askomics.libaskomics.integration.AbstractedEntity import AbstractedEntity
from askomics.libaskomics.integration.AbstractedRelation import AbstractedRelation
from askomics.libaskomics.utils import cached_property, HaveCachedProperties, pformat_generic_object

class SourceFileTsv(SourceFile):
    """
    Class representing a Gff3 Source file
    """

    def __init__(self, settings, session, path, preview_limit, uri_set=None):
        SourceFile.__init__(self, settings, session, path, uri_set=uri_set)
        self.type = 'tsv'

        self.preview_limit = preview_limit

        self.forced_column_types = ['entity']
        self.disabled_columns = []
        self.key_columns = []
        self.headers = self.get_headers_by_file

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
            'entity_start'  : ':',
            'goterm': '',
            'date': 'xsd:dateTime'
            }

        self.delims = {
            'numeric' : ('', ''),
            'text'    : ('', '^^xsd:string'),
            'category': (':', ''),
            'taxon': (':', ''),
            'ref': (':', ''),
            'strand': (':', ''),
            'start' : ('', ''),
            'end' : ('', ''),
            'entity'  : (':', ''),
            'entitySym'  : (':', ''),
            'entity_start'  : (':', ''),
            'goterm': ('<http://purl.obolibrary.org/obo/GO_', '>'),
            'date': ('', '^^xsd:dateTime')
            }

    def prefix_uri_entity(self,idx):

        if idx in self.uri:
            return '<'+self.uri[idx]
        return '<'+self.get_param("askomics.prefix")

    def suffix_uri_entity(self):
        return '>';

    @cached_property
    def dialect(self):
        """
        Use csv.Sniffer to predict the CSV/TSV dialect
        """
        with open(self.path, 'r', encoding="utf-8", errors="ignore") as tabfile:
            # The sniffer needs to have enough data to guess,
            # and we restrict to a list of allowed delimiters to avoid strange results
            contents = tabfile.readline()
            dialect = csv.Sniffer().sniff(contents, delimiters=';,\t ')
            self.log.debug('CSV dialect in ' + str(self.path) + ': ' + str(pformat_generic_object(dialect)))
            return dialect

    @cached_property
    def get_headers_by_file(self):
        """
        Read and return the column headers.

        :return: a List of column headers
        :rtype: List
        """

        headers = []
        with open(self.path, 'r', encoding="utf-8", errors="ignore") as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, dialect=self.dialect)

            # first line is header
            headers = next(tabreader)
            headers = [h.strip() for h in headers]

        return headers

    def set_headers(self, headers):
        """Set the headers

        :param headers: the headers list
        :type headers: list
        """

        self.headers = headers

    def get_preview_data(self):
        """
        Read and return the values from the first lines of file.

        :return: a List of List of column values
        :rtype: List
        """

        with open(self.path, 'r', encoding="utf-8", errors="ignore") as tabfile:
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
        :return: the guessed type ('taxon','ref', 'strand', 'start', 'end', 'numeric', 'text' or 'category', 'goterm')
        """

        # check if relationShip with an other local entity
        if header.find("@") > 0:
            #general relation by default
            return "entity"

        types = {
            'ref': ('chrom', ),
            'taxon': ('taxon', 'species'),
            'strand': ('strand', ),
            'start': ('start', 'begin'),
            'end': ('end', 'stop'),
            'date': ('date', 'time', 'datetime', 'birthday')
        }

        date_regex = re.compile(r'^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}')

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
                    # test if date respect the datetime regexp
                    if typ == 'date' and not all(date_regex.match(val) for val in values):
                        break
                    return typ

        #check goterm
        if all((val.startswith("GO:") and val[3:].isdigit()) for val in values):
            return 'goterm'

        # Then, check if category
        threshold = 10
        if len(values) < 30:
            threshold = 5

        #if all(re.match(r'^\w+$', val) for val in values):#check if no scape chararcter
        if all(self.is_decimal(val) for val in values): # Then numeric
            if all(val == '' for val in values):
                return 'text'
            return 'numeric'
        elif len(set(values)) < threshold:
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

        for typ in self.forced_column_types:
            if typ not in self.delims :
                raise ValueError("Bad init of forced_column_filter unknown type :"+typ)

    def set_disabled_columns(self, disabled_columns):
        """
        Set manually curated types for column

        :param disabled_columns: a List of column ids (0 based) that should not be imported
        """

        self.disabled_columns = disabled_columns

    def set_key_columns(self, key_columns):
        """
        Set all column to build unqiue ID

        :param disabled_columns: a List of column ids (0 based) that should not be imported
        """

        self.key_columns = key_columns

    def key_id(self, row):
        """
        Get the key id by concatenate all key selected
        """

        retval = None

        for key in self.key_columns:
            if retval is None:
                retval = row[int(key)]
            else:
                retval += "_"+ row[int(key)]

        # By default the first element is index
        if retval is None:
            retval = row[0]

        return retval

    @staticmethod
    def get_strand_faldo(strand):
        """
        Get the faldo strand in function of the strand
        """

        if strand is None:
            return "faldo:BothStrandPosition"

        if strand.lower() == "plus" or strand.startswith("+"):
            return "faldo:ForwardStrandPosition"

        if strand.lower() == "minus" or strand.startswith("-"):
            return "faldo:ReverseStrandPosition"

        return "faldo:BothStrandPosition"

    def get_abstraction(self):
        """
        Get the abstraction representing the source file in ttl format

        :return: ttl content for the abstraction
        """

        # TODO use rdflib or other abstraction layer to create rdf

        if len(self.forced_column_types) <= 0:
            raise ValueError("forced_column_types is not defined !")

        ttl = ''
        ref_entity = self.headers[0]

        # Store the main entity
        ttl += AbstractedEntity(ref_entity).get_turtle()

        # Store all the relations
        for key, key_type in enumerate(self.forced_column_types):
            if key > 0 and key in self.disabled_columns:
                continue

            # *** CARREFULLY ***
            # We keep def of attribute position_ to keep cmpatibility with IHM but we don't define value for each entity
            # Position are defined inside a faldo:Location object
            #
            # ==> IHM detect position_ attribute and transforme all query with faldo:location/faldo:begin/faldo:reference
            #
            if key > 0 and not key_type.startswith('entity'):
                if key_type in ('taxon', 'ref', 'strand', 'start', 'end'):
                    uri = 'position_'+key_type
                # elif key_type == 'taxon':
                #     uri = 'position_'+key_type
                else:
                    uri = self.encode_to_rdf_uri(self.headers[key])
                ttl += ":" + uri + ' displaySetting:attribute "true"^^xsd:boolean .\n'
                # store the order of attrbutes in order to display attributes in the right order
                ttl += ":" + uri + ' displaySetting:attributeOrder "' + str(key) + '"^^xsd:decimal .\n'
            elif key == 0:
                uri_pref = self.get_param("askomics.prefix")

                if key in self.uri:
                    uri_pref = self.uri[key]

                ttl += ":" + self.encode_to_rdf_uri(self.headers[key]) + ' displaySetting:prefixUri "'+uri_pref+'"^^xsd:string .\n\n'

            if key > 0:
                ttl += AbstractedRelation(key_type, self.headers[key], ref_entity, self.type_dict[key_type]).get_turtle()
        # Store the startpoint status
        if self.forced_column_types[0] == 'entity_start':
            ttl += ":" + self.encode_to_rdf_uri(ref_entity) + ' displaySetting:startPoint "true"^^xsd:boolean .\n'

        return ttl

    def get_domain_knowledge(self):
        """
        Get the domain knowledge representing the source file in ttl format

        :return: ttl content for the domain knowledge
        """

        #TODO use rdflib or other abstraction layer to create rdf

        ttl = ''

        if all(types in self.forced_column_types for types in ('start', 'end')): # a positionable entity have to have a start and a end
            ttl += ":" + self.encode_to_rdf_uri(self.headers[0]) + ' displaySetting:is_positionable "true"^^xsd:boolean .\n'
            ttl += ":is_positionable rdfs:label 'is_positionable'^^xsd:string .\n"
            ttl += ":is_positionable rdf:type owl:ObjectProperty .\n"

        for header, categories in self.category_values.items():
            indent = len(header) * " " + len("displaySetting:category") * " " + 3 * " "
            ttl += ":" + self.encode_to_rdf_uri(header+"Category") + " displaySetting:category :"
            ttl += (" , \n" + indent + ":").join(map(self.encode_to_rdf_uri, categories)) + " .\n"

            for item in categories:
                if item.strip() != "":
                    ttl += ":" + self.encode_to_rdf_uri(item) + " rdf:type :" + self.encode_to_rdf_uri(header) + " ;\n" + len(item) * " " + "  rdfs:label " + self.escape['text'](item) + "^^xsd:string .\n"

        return ttl


    @cached_property
    def category_values(self):
        """
        A (lazily cached) dictionary mapping from column name (header) to the set of unique values.
        """
        self.log.warning("category_values will be computed independently, get_turtle should be used to generate both at once (better performances)")
        category_values = defaultdict(set) # key=name of a column of 'category' type -> list of found values

        with open(self.path, 'r', encoding="utf-8", errors="ignore") as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, dialect=self.dialect)
            next(tabreader) # Skip header

            # Loop on lines
            for row_number, row in enumerate(tabreader):
                #blanck line
                if not row:
                    continue
                if len(row) != len(self.headers):
                    exc = SourceFileSyntaxError('Invalid line found: ' + str(self.headers) +
                                                ' columns expected, found ' + str(len(row)) +
                                                " - (last valid entity " + entity_label + ")")
                    exc.filename = self.path
                    exc.lineno = row_number
                    self.log.error(repr(exc))
                    raise exc

                for i, (header, current_type) in enumerate(zip(self.headers, self.forced_column_types)):
                    if current_type in ('category', 'taxon', 'ref', 'strand'):
                        # This is a category, keep track of allowed values for this column
                        self.category_values.setdefault(header, set()).add(row[i])

        return category_values

    def get_turtle(self, preview_only=False):
        """
        Get the turtle string of a tsv file
        """

        # TODO use rdflib or other abstraction layer to create rdf

        self.category_values = defaultdict(set) # key=name of a column of 'category' type -> list of found values

        with open(self.path, 'r', encoding="utf-8", errors="ignore") as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, dialect=self.dialect)

            next(tabreader) # Skip header

            # Loop on lines
            for row_number, row in enumerate(tabreader):
                ttl = ""
                ttl_sym = ""
                #if len(row)>0:
                #    self.log.debug(row[0]+' '+str(row_number))
                #blanck line
                if not row:
                    continue

                # Create the entity (first column)
                entity_label = row[0]

                if len(row) != len(self.headers):
                    self.log.warning("*"+', '.join(row)+"*")
                    raise Exception('Invalid line found: '+str(len(self.headers))
                                             +' columns expected, found '+str(len(row))
                                             +" - (last valid entity "+entity_label+")")

                entity_id = self.key_id(row)
                pref = self.prefix_uri_entity(0)
                suf = self.suffix_uri_entity()
                indent = (len(pref)+2) * " "
                ttl += pref + self.encode_to_rdf_uri(entity_id) + suf + " rdf:type :" + self.encode_to_rdf_uri(self.headers[0]) + " ;\n"
                ttl += indent + " rdfs:label " + self.escape['text'](entity_label) + "^^xsd:string ;\n"
                start_faldo = None
                end_faldo = None
                reference_faldo = None
                strand_faldo = None

                # check positionable
                positionable = False
                if 'start' in self.forced_column_types and 'end' in self.forced_column_types :
                    # its a positionable entity
                    positionable = True
                # Add data from other columns
                for i, header in enumerate(self.headers): # Skip the first column
                    if i > 0 and i not in self.disabled_columns:
                        current_type = self.forced_column_types[i]
                        #OFI : manage new header with relation@type_entity
                        #relation_name = ":has_" + header # manage old way
                        have_prefix = False
                        relation_name = ":"+self.encode_to_rdf_uri(header) # manage old way
                        if current_type.startswith('entity'):
                            idx = header.find("@")

                            if idx > 0:
                                idx2 = header.find(":")
                                if idx2 > 0:
                                    relation_name = header[0:idx]
                                else:
                                    relation_name = ":"+self.encode_to_rdf_uri(header[0:idx])

                                type_ent = header[idx+1:]
                                clause1 = type_ent.find(":") > 0
                                if clause1 or (header[idx+1] == '<' and header[len(header)-1] == '>'):
                                    have_prefix = True
                        # Create link to value
                        if row[i]: # Empty values are just ignored
                            if current_type in ('category', 'taxon', 'ref', 'strand'):
                                # This is a category, keep track of allowed values for this column
                                self.category_values[header].add(row[i])

                             #check numeric type
                            #if current_type in ('numeric', 'start', 'end'):
                            #    if not row[i].isnumeric():
                            #        raise Exception("Type Error: Value \""+row[i]+\
                            #        "\" (Entity :"+entity_id+", Line "+str(row_number)+\
                            #        ") is not a numeric value.\n")

                            if positionable:
                                # positionable attributes
                                if current_type == 'start':
                                    start_faldo = row[i]
                                elif current_type == 'end':
                                    end_faldo = row[i]
                                elif current_type == 'taxon':
                                    ttl += indent + " " + ':position_taxon' + " " + self.delims[current_type][0] + self.encode_to_rdf_uri(row[i]) + self.delims[current_type][1] + " ;\n"
                                elif current_type == 'ref':
                                    reference_faldo = self.encode_to_rdf_uri(row[i])
                                elif current_type == 'strand':
                                    strand_faldo = row[i]
                                    ttl += indent + " " + ':position_strand' + " " + self.delims[current_type][0] + self.encode_to_rdf_uri(row[i]) + self.delims[current_type][1] + " ;\n"
                                elif have_prefix:
                                    ttl += indent + " "+ relation_name + " " + row[i] + " ;\n"
                                else:
                                    ttl += indent + " "+ relation_name + " " + self.delims[current_type][0] + self.escape[current_type](row[i]) + self.delims[current_type][1] + " ;\n"

                            else:
                                # Not positionable
                                if current_type == 'entity':
                                    pref = self.prefix_uri_entity(i)
                                    suf = self.suffix_uri_entity()
                                else:
                                    pref = self.delims[current_type][0]
                                    suf = self.delims[current_type][1]
                                ttl += indent + " "+ relation_name + " " + pref + self.escape[current_type](row[i]) + suf + " ;\n"

                        if current_type == 'entitySym':
                            pref = self.prefix_uri_entity(i)
                            suf = self.suffix_uri_entity()
                            ttl_sym += pref+\
                                      self.escape[current_type](row[i])+\
                                      suf+" "+relation_name+" :"+\
                                      self.encode_to_rdf_uri(entity_label)  + " .\n"

                # Faldo position management
                if positionable:
                    blockbase = 10000
                    block_idxstart = int(start_faldo) // blockbase
                    block_idxend = int(end_faldo) // blockbase

                    ttl += indent + ' :blockstart ' + str(block_idxstart*blockbase) +';\n'
                    ttl += indent + ' :blockend ' + str(block_idxend*blockbase) +';\n'

                    for sliceb in range(block_idxstart, block_idxend + 1):
                        if reference_faldo:
                            ttl += indent + ' :IsIncludeInRef :' + reference_faldo+"_"+str(sliceb) +' ;\n'
                        ttl += indent + ' :IsIncludeIn ' + str(sliceb) +' ;\n'

                    faldo_strand = self.get_strand_faldo(strand_faldo)

                    ttl += indent +    " faldo:location [ a faldo:Region ;\n"+\
                              indent + "                  faldo:begin [ a faldo:ExactPosition;\n"+\
                              indent + "                                a "+faldo_strand+";\n"+\
                              indent + "                                faldo:position "+str(start_faldo)+";\n"
                    if reference_faldo:
                        ttl += indent + "                                faldo:reference :"+reference_faldo+" ;\n"

                    ttl += indent + "                                    ];\n"

                    ttl += indent + "                  faldo:end [ a faldo:ExactPosition;\n"+\
                              indent + "                              a "+faldo_strand+";\n"+\
                              indent + "                              faldo:position "+str(end_faldo)+";\n"
                    if reference_faldo:
                        ttl += indent + "                              faldo:reference :"+reference_faldo+";\n"
                    ttl += indent + "                                  ]]   "

                ttl = ttl[:-2] + "."


                #manage symmetric relation
                if ttl_sym != "":
                    yield ttl_sym

                yield ttl
                # Stop after x lines
                if preview_only and row_number > self.preview_limit:
                    return
