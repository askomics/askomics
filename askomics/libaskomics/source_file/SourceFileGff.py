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

    def integrate(self):
        """integrate the gff file

        [description]
        """
        self.log.debug('---> parse gff <---')
        handle = open(self.path)
        it = 0
        for rec in GFF.parse(handle):
            self.log.debug('it: '+str(it))
            it+=1

            #self.log.debug('--> '+str(rec))
            self.log.debug('===> '+str(rec.features[0]))
            #self.log.debug('type: '+str(type(rec)))
            #self.log.debug('typef: '+str(type(rec.features)))

        handle.close()