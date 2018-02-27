#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import logging
import json

from askomics.libaskomics.ParamManager import ParamManager
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

    def __init__(self, relation_type, identifier, identifier_prefix,rdfs_domain, prefixDomain, rdfs_range, prefixRange):
        idx = identifier.find("@")
        type_range =  identifier

        if idx > 0:
            self.label = identifier[0:idx]
        else:
            self.label = identifier

        self.uri = ParamManager.encode_to_rdf_uri(self.label,prefix="askomics:")

        self.rdfs_range = rdfs_range

        if relation_type.startswith("entity"):
            self.relation_type = "owl:ObjectProperty"

        elif relation_type == "goterm":
            self.relation_type = "owl:ObjectProperty"
            self.rdfs_range = "owl:Class"
        else:
            self.relation_type = "owl:DatatypeProperty"

        self.rdfs_domain = ParamManager.encode_to_rdf_uri(rdfs_domain,prefixDomain)
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

    def get_turtle(self):
        """
        return the turtle code describing an AbstractedRelation
        for the abstraction file generation.
        """

        uri = self.get_uri()

        indent = (len(uri)) * " "
        turtle = uri + " rdf:type " + self.get_relation_type() + " ;\n"
        turtle += indent + ' rdfs:label ' + json.dumps(self.get_label()) + '^^xsd:string ;\n'
        turtle += indent + " rdfs:domain " + self.get_domain() + " ;\n"
        turtle += indent + " rdfs:range " + self.get_range() + " .\n\n"
        return turtle
