#! /usr/bin/env python3
# -*- coding: utf-8 -*-

from askomics.libaskomics.graph.GraphElement import GraphElement
from askomics.libaskomics.utils import pformat_generic_object

import logging

class Link(GraphElement):
    """
    Class representing a link between two nodes.
    All links have:
        - an uri (relationURI)
        - a label (relation_label)
        - a source node (source_uri and source_id)
        - a target node (target_uri and target_id)
    Some links can be specified by a hidden class with spec_uri
    Some links can modify the WHERE clause with a spec_clause
    """

    def __init__(self, source_uri, target_uri, relation_uri, relation_label, spec_uri="", spec_clause=""):
        self.source_uri = source_uri
        self.target_uri = target_uri
        self.relation_uri = relation_uri
        self.relation_label = relation_label
        self.spec_uri = spec_uri
        self.spec_clause = spec_clause

        self.log = logging.getLogger(__name__)

    def get_source_uri(self):
        return self.source_uri

    def get_target_uri(self):
        return self.target_uri

    def get_relation_uri(self):
        return self.relation_uri

    def get_relation_label(self):
        return self.relation_label

    def get_spec_uri(self):
        return self.spec_uri

    def get_spec_clause(self):
        return self.spec_clause

    def print_attr(self):
        self.log.debug(pformat_generic_object(self))

    def to_dict(self):
        return {"source_uri": self.source_uri,
                "target_uri": self.target_uri,
                "relation_uri": self.relation_uri,
                "relation_label": self.relation_label,
                "spec_uri": self.spec_uri,
                "spec_clause": self.spec_clause}

    def __str__(self):
        return "source_uri: {0}\ttarget_uri: {1}\trelation_uri {2}".format(self.source_uri, self.target_uri, self.relation_uri)
