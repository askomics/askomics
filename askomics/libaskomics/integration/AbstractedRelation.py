#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import logging
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
        type_range = identifier

        #Keep compatibility with old version
        if idx  != -1:
            type_range = identifier[idx+1:len(identifier)]
            identifier = identifier[0:idx]
        else:
            identifier = identifier

        self.uri = ":"+identifier
        self.label = identifier
        print(relation_type)
        print(identifier)

        print("RELATIONTYPE:"+relation_type)

        if relation_type == "entity":
            self.relation_type = "owl:ObjectProperty"
            self.rdfs_range = ":" + type_range
        elif relation_type.lower() == "category":
            self.relation_type = "owl:ObjectProperty"
            self.rdfs_range = ":" + type_range+"Category"
        else:
            self.relation_type = "owl:DatatypeProperty"
            self.rdfs_range = rdfs_range

        self.rdfs_domain = ":" + rdfs_domain
        self.log = logging.getLogger(__name__)

    def set_uri(self, identifier):
        self.uri = ":" + identifier

    def set_label(self, identifier):
        self.label = identifier

    def set_relation_type(self, relation_type):
        if relation_type == "entity" or relation_type == "category":
            self.relation_type = "owl:ObjectProperty"
        else:
            self.relation_type = "owl:DatatypeProperty"

    def set_domain(self, rdfs_domain):
        self.rdfs_domain = rdfs_domain

    def set_range(self, rdfs_range):
        if self.relation_type == "owl:ObjectProperty":
            self.rdfs_range = ":" + rdfs_range
        else:
            self.rdfs_range = rdfs_range

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

    def print_attr(self):
        self.log.debug(pformat_generic_object(self))

    def to_dict(self):
        return {"uri": self.uri,
                "label": self.label,
                "relation_type": self.relation_type,
                "domain": self.rdfs_domain,
                "range": self.rdfs_range}

    def get_turtle(self):
        """
        return the turtle code describing an AbstractedRelation
        for the abstraction file generation.
        """
        indent = (len(self.get_uri())) * " "
        turtle = self.get_uri() + " rdf:type " + self.get_relation_type() + " ;\n"
        turtle += indent + ' rdfs:label "' + self.get_label() + '" ;\n'
        turtle += indent + " rdfs:domain " + self.get_domain() + " ;\n"
        turtle += indent + " rdfs:range " + self.get_range() + " .\n\n"
        return turtle
