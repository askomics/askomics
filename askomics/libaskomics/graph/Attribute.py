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

    def __init__(self, attr_id, uri, type_uri, label, parent):
        self.attr_id = attr_id
        self.uri = uri
        self.type = type_uri
        self.label = label
        self.parent = parent

        self.log = logging.getLogger(__name__)

    def get_id(self):
        return self.attr_id

    def get_uri(self):
        return self.uri

    def get_type(self):
        return self.type

    def get_label(self):
        return self.label

    def get_parent(self):
        return self.parent

    def to_dict(self):
        return {'id': self.attr_id,
                'uri': self.uri,
                'type_uri': self.type,
                'label': self.label,
                'parent': self.parent}

    def print_attr(self):
        self.log.debug("id =" + self.attr_id)
        self.log.debug("uri =" + self.uri)
        self.log.debug("type_uri =" + str(self.type))
        self.log.debug("label =" + self.label)
        self.log.debug("parent =" + str(self.parent))

    def __str__(self):
        return "id: {0}\turi: {1}\type_uri: {2}\tlabel: {3}\tparent {4}".format(self.attr_id, self.uri, self.type, self.label, self.parent)
