"""
Classes to import data from a gff3 source files
"""
#import re
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
from askomics.libaskomics.utils import cached_property, HaveCachedProperties, pformat_generic_object
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

        #FIXME: use target_lines to speedup the integration
        # for rec in GFF.parse(handle, limit_info=limit, target_lines=1000):
        for rec in GFF.parse(handle, limit_info=limit):
            for feat in rec.features:
                type_entity = ':'+feat.type
                id_entity = feat.id.replace(type_entity+":", "")
                start_entity = int(feat.location.start)
                end_entity = int(feat.location.end)

                if int(feat.location.strand == 1):
                    strand_entity = ':plus'
                elif int(feat.location.strand == -1):
                    strand_entity = ':minus'
                else:
                    strand_entity = ''

                taxon_entity = taxon
                ref_entity = feat.ref

                attribute_dict = {
                    'rdf:type': type_entity,
                    'rdfs:label': id_entity,
                    ':position_taxon': taxon_entity,
                    ':position_ref': ref_entity,
                    ':position_start': start_entity,
                    ':position_end': end_entity,
                    ':position_strand': strand_entity
                }

                for qualifier_key, qualifier_value in feat.qualifiers.items():
                    for val in qualifier_value:
                        attribute_dict[':'+str(qualifier_key)] = str(val)

                entity = {":"+id_entity: attribute_dict}

                self.log.debug('===================> Entity <===================')
                self.log.debug(entity)
                self.log.debug('================================================')

        handle.close()