"""
Classes to import data from a gff3 source files
"""
import re
#import logging
#import csv
#from collections import defaultdict
#from itertools import count
#import os.path
#import tempfile
#import time
#import getpass
#import urllib.parse
#from pkg_resources import get_distribution
from BCBio.GFF import GFFExaminer
from BCBio import GFF

from askomics.libaskomics.source_file.SourceFile import SourceFile
#from askomics.libaskomics.ParamManager import ParamManager
#from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
#from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.utils import cached_property, HaveCachedProperties, pformat_generic_object, rreplace
#from askomics.libaskomics.integration.AbstractedEntity import AbstractedEntity
#from askomics.libaskomics.integration.AbstractedRelation import AbstractedRelation

class SourceFileGff(SourceFile):
    """
    Class representing a Gff3 Source file
    """


    def get_entities(self):
        """
        get all the entities present in a gff file

        :return: The list of all the entities
        :rtype: List
        """
        exam = GFFExaminer()
        handle = open(self.path)
        entities = []
        gff_type = exam.available_limits(handle)['gff_type']
        for ent in gff_type:
            entities.append(ent[0])

        handle.close()

        return entities

    def integrate(self, taxon, entities):
        """
        integrate the gff file
        """

        self.log.debug('--> integrate <--')
        self.log.debug(self.path)
        handle = open(self.path)

        limit = dict(
            gff_type = entities
        )

        self.log.debug('--> go!')

        regex = re.compile(r'.*:')
        ttl = ''

        abstraction_dict = {}
        domain_knowledge_dict = {}
        pos_attr_list = [
            'position_taxon', 'position_ref', 'position_start', 'position_end',
            'position_strand'
        ]
        categories_list = ['position_taxon', 'position_ref', 'position_strand']

        #TODO: test which loop is the faster
        # for rec in GFF.parse(handle, limit_info=limit, target_lines=1000):
        for rec in GFF.parse(handle, limit_info=limit):
            for feat in rec.features:
                type_entity = ':'+feat.type
                id_entity = regex.sub('', feat.id)
                start_entity = int(feat.location.start)
                end_entity = int(feat.location.end)

                if int(feat.location.strand == 1):
                    strand_entity = ':plus'
                elif int(feat.location.strand == -1):
                    strand_entity = ':minus'
                else:
                    strand_entity = ''

                taxon_entity = ':' + taxon
                # ref_entity = feat.ref
                ref_entity = str(':1') #FIXME: feat.ref not working (equal to NONE)

                attribute_dict = {
                    'rdf:type': type_entity,
                    'rdfs:label': '\"'+id_entity+'\"',
                    ':position_taxon': taxon_entity,
                    ':position_ref': str(ref_entity),
                    ':position_start': start_entity,
                    ':position_end': end_entity,
                    ':position_strand': strand_entity
                }

                # Abstraction
                if type_entity not in abstraction_dict.keys():
                    abstraction_dict[type_entity] = {'pos_attr': pos_attr_list, 'normal_attr' : []}

                # Domain knowledge ---------------------------------------------------------------
                if type_entity not in domain_knowledge_dict.keys():
                    domain_knowledge_dict[type_entity] = {'category' : {}}

                if domain_knowledge_dict[type_entity]['category'] == {}:
                    for category in categories_list:
                        domain_knowledge_dict[type_entity]['category'][category] = []

                # Strand
                if strand_entity not in domain_knowledge_dict[type_entity]['category']['position_strand']:
                    domain_knowledge_dict[type_entity]['category']['position_strand'].append(strand_entity)
                # taxon
                if taxon_entity not in domain_knowledge_dict[type_entity]['category']['position_taxon']:
                    domain_knowledge_dict[type_entity]['category']['position_taxon'].append(taxon_entity)
                # ref
                if ref_entity not in domain_knowledge_dict[type_entity]['category']['position_ref']:
                    domain_knowledge_dict[type_entity]['category']['position_ref'].append(ref_entity)
                # ---------------------------------------------------------------------------------

                for qualifier_key, qualifier_value in feat.qualifiers.items():
                    for val in qualifier_value:
                        if qualifier_key == 'Parent':
                            attribute_dict[':' + str(qualifier_key)] = str(':' + regex.sub('', val))
                            # Store the parent relation in abstraction
                            if {'Parent' : re.sub(r':.*', '', val)} not in abstraction_dict[type_entity]['normal_attr']:
                                abstraction_dict[type_entity]['normal_attr'].append({'Parent' : re.sub(r':.*', '', val)})
                        else:
                            attribute_dict[':' + str(qualifier_key)] = str('\"' + val + '\"')
                            # store normal attr in abstraction
                            if qualifier_key not in abstraction_dict[type_entity]['normal_attr']:
                                abstraction_dict[type_entity]['normal_attr'].append(qualifier_key)

                entity = {":"+id_entity: attribute_dict}

                # self.log.debug('===================> Entity <===================')
                # self.log.debug(entity)
                # self.log.debug('================================================')

                ttl += self.get_content_ttl(entity)

            ttl += self.get_abstraction_ttl(abstraction_dict)
            ttl += self.get_domain_knowledge_ttl(domain_knowledge_dict)

            self.log.debug(ttl)

        handle.close()


    def get_content_ttl(self, entity):
        """

        """

        for id_entity, attribute_dict in entity.items():
            first = True
            ttl = str(id_entity)
            indent = len(str(id_entity)) * ' ' + ' '
            for key, attr in attribute_dict.items():
                if first:
                    ttl += ' ' + str(key) + ' ' + str(attr) + ' ;\n'
                    first = False
                else:
                    ttl += indent + str(key) + ' ' + str(attr) + ' ;\n'

        ttl += '\n'

        ttl = rreplace(ttl, ';', '.', 1)

        return ttl

    def get_abstraction_ttl(self, abstraction):



        ttl =  '#################\n'
        ttl += '#  Abstraction  #\n'
        ttl += '#################\n\n'

        for entity, attribute_dict in abstraction.items():
            ttl += entity + ' ' + 'rdf:type owl:Class ;\n'
            indent = len(entity) * ' ' + ' '
            ttl += indent + 'rdfs:label \"' + entity.replace(":", "") + "\" ;\n"
            ttl += indent + 'displaySetting:startPoint \"true\"^^xsd:boolean .\n\n'
            for type_attr, attr_list in attribute_dict.items():
                if type_attr == 'pos_attr': # positionable attributes
                    for pos_attr in attr_list:
                        ttl += ':' + pos_attr + ' displaySetting:attribute \"true\"^^xsd:boolean ;\n'
                        indent = len(pos_attr) * ' ' + '  '
                        ttl += indent + 'rdf:type owl:ObjectProperty ;\n'
                        ttl += indent + 'rdfs:label \"' + pos_attr.replace('position_', '') + '\" ;\n'
                        ttl += indent + 'rdfs:domain ' + entity + ' ;\n'
                        ttl += indent + 'rdfs:range :' + pos_attr.replace('position_', '') + "Category .\n\n"
                else: # other attributes
                    for attr in attr_list:
                        if type(attr) == type({}): # Parent relation
                            for key, value in attr.items():
                                ttl += ':' + key + ' rdf:type owl:ObjectProperty ;\n'
                                indent = len(key) * ' ' + '  '
                                ttl += indent + 'rdfs:label \"' + key + '\" ;\n'
                                ttl += indent + 'rdfs:domain ' + entity + " ;\n"
                                ttl += indent + 'rdfs:range :' + value + ' .\n\n'
                        else: # normal attributes
                            ttl += ':'+ attr + ' displaySetting:attribute \"true\"^^xsd:boolean ;\n'
                            indent = len(attr) * ' ' + '  '
                            ttl += indent + 'rdf:type owl:DatatypeProperty ;\n'
                            ttl += indent + 'rdfs:label \"' + attr + '\" ;\n'
                            ttl += indent + 'rdfs:domain ' + entity + " ;\n"
                            ttl += indent + 'rdfs:range xsd:string .\n\n'

        return ttl

    def get_domain_knowledge_ttl(self, domain_knowledge):

        ttl =  '######################\n'
        ttl += '#  Domain knowledge  #\n'
        ttl += '######################\n\n'

        for entity, bla_dict in domain_knowledge.items():
            # Positionable entity
            ttl += entity + ' displaySettings:is_positionable \"true\"^^xsd:boolean .\n'
            ttl += ':is_positionable rdfs:label \'is_positionable\' .\n'
            ttl += ':is_positionable rdf:type owl:ObjectProperty .\n\n'

            for bla, category_dict in bla_dict.items():
                for category, cat_list in category_dict.items():
                    # indent = len(category + ' displaySetting:category ') * ' '
                    for cat in cat_list:
                        ttl += ':' + str(category.replace('position_', '')) + 'Category displaySetting:category ' + str(cat) + ' .\n'
                        ttl += str(cat) + ' rdf:type :strand ;\n'
                        indent = len(str(cat)) * ' ' + ' '
                        ttl += indent + 'rdfs:label \"' + str(cat.replace(':', '')) + '\" .\n'

            ttl += '\n'

        return ttl