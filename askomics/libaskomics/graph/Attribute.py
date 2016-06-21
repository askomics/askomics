#! /usr/bin/env python3
# -*- coding: utf-8 -*-

from askomics.libaskomics.graph.GraphElement import GraphElement

import logging

class Attribute(GraphElement):
    """
    Class representing a node attribute.
    Attributes are displayed and customizable on the right
    side of the AskOmics interrogation interface.
    """

    def __init__(self, uri, type_uri, label):
        self.uri = uri
        self.type = type_uri
        self.label = label

        self.log = logging.getLogger(__name__)

    def get_uri(self):
        return self.uri

    def get_type(self):
        return self.type

    def get_label(self):
        return self.label

    def to_dict(self):
        return {
                'uri': self.uri,
                'type_uri': self.type,
                'label': self.label,
        }

    def print_attr(self):
        self.log.debug("uri =" + self.uri)
        self.log.debug("type_uri =" + str(self.type))
        self.log.debug("label =" + self.label)

    def __str__(self):
        return "\turi: {0}\type_uri: {1}\tlabel: {2}\t".format(self.uri, self.type, self.label)
