#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import logging

class AbstractedEntity(object):
    """
    An AbstractedEntity represents the classes of the database.
    It is defined by an uri and a label.
    """

    def __init__(self, identifier):
        self.uri = ":" + identifier
        self.label = identifier

        self.log = logging.getLogger(__name__)

    def get_uri(self):
        return self.uri

    def get_label(self):
        return self.label

    def print_attr(self):
        self.log.debug("uri = " + self.uri)
        self.log.debug("label = " + self.label)

    def to_dict(self):
        return {"uri": self.uri,
                "label": self.label}

    def get_turtle(self):
        """
        return the turtle code describing an AbstractedEntity
        for the abstraction file generation.
        """
        turtle = self.get_uri() + " rdf:type owl:Class ;\n"
        turtle += (len(self.get_uri()) + 1) * " " + "rdfs:label \"" + self.label + "\" .\n\n"
        return turtle
