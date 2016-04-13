
#! /usr/bin/env python
# -*- coding: utf-8 -*-

class GraphElement(object):
    """ Abstract class which defines necessary methods for each different element of a rdf graph. """

    def to_dict(self):
        raise NotImplementedError

    def print_attr(self):
        raise NotImplementedError
