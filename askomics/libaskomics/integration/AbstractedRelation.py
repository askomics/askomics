#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import logging
import urllib.parse
from askomics.libaskomics.utils import pformat_generic_object

class AbstractedRelation(object):
    """
    An AbstractedRelation represents the relations of the database.
    There are two kinds of relations:
        - ObjectProperty binds an instance of a class with another.
        - DatatypeProperty binds an instance of a class with a string
          or a numeric value.
    In Askomics, an ObjectProperty can be represented as:
        - a node on the display graph (relation_type = entity).
        - an attribute of a node (relation_type = category).
    All DatatypeProperty are represented as nodes attributes.
    Each relation has an uri composed by the database prefix (:), "has_"
    and an identifier that is the header of the tabulated file being
    converted.
    Each relation also has a domain (the class of the source node) and a
    range (the class of the target). The range is the header of the
    tabulated file being converted in case of ObjectProperty and a
    specified class (xsd:string or xsd:numeric) in case of DatatypeProperty.
    """

    def __init__(self, relation_type, identifier, rdfs_domain, rdfs_range):
        idx = identifier.find("@")
        type_range =  identifier

        #Keep compatibility with old version
        if idx  != -1:
            type_range = identifier[idx+1:len(identifier)]
            self.label = identifier[0:idx]

        else:
            self.label = identifier

        identifier =  urllib.parse.quote(self.label)
        self.uri = ":"+identifier

        self.col_type = relation_type

        if relation_type.startswith("entity"):
            self.relation_type = "owl:ObjectProperty"
            if type_range.find(":")<0:
                self.rdfs_range = ":" + urllib.parse.quote(type_range)
            else:
                self.rdfs_range = type_range

        elif relation_type.lower() in ('category', 'taxon', 'ref', 'strand'):
            self.relation_type = "owl:ObjectProperty"
            self.rdfs_range = ":" + urllib.parse.quote(type_range+"Category")
        else:
            self.relation_type = "owl:DatatypeProperty"
            self.rdfs_range = rdfs_range

        self.rdfs_domain = ":" + urllib.parse.quote(rdfs_domain)
        self.log = logging.getLogger(__name__)

    def get_uri(self):
        return self.uri

    def get_label(self):
        return self.label

    def get_relation_type(self):
        return self.relation_type

    def get_domain(self):
        return self.rdfs_domain

    def get_range(self):
        return self.rdfs_range

    def get_col_type(self):
        return self.col_type

    def get_turtle(self):
        """
        return the turtle code describing an AbstractedRelation
        for the abstraction file generation.
        """

        if self.get_col_type() in ('start', 'end', 'taxon', 'ref', 'strand'):
            self.log.debug('---> POSITIONABLE ATTRIBUTE <---')
            uri = ':position_'+self.get_col_type()
        else:
            uri = self.get_uri()

        indent = (len(uri)) * " "
        turtle = uri + " rdf:type " + self.get_relation_type() + " ;\n"
        turtle += indent + ' rdfs:label "' + self.get_label() + '"^^xsd:string ;\n'
        turtle += indent + " rdfs:domain " + self.get_domain() + " ;\n"
        turtle += indent + " rdfs:range " + self.get_range() + " .\n\n"
        return turtle
