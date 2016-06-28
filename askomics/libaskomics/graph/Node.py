#! /usr/bin/env python3
# -*- coding: utf-8 -*-

from askomics.libaskomics.graph.GraphElement import GraphElement

import logging

class Node(GraphElement):
    """
    Class representing a node.
    A node is define by:
        - an uri
        - a label
        - a node_id
        - a list of shortcuts to follow in the sparql query to reach
          another node or a node attribute
    """

    def __init__(self, uri, label):
        self.uri = uri
        self.label = label
        self.log = logging.getLogger(__name__)

    def get_uri(self):
        return self.uri

    def get_label(self):
        return self.label

    def print_attr(self):
        self.log.debug("uri =" + self.uri)
        self.log.debug("label =" + self.label)

    def to_dict(self):
        return {
                "uri": self.uri,
                "label": self.label
                }
