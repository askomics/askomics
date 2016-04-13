#! /usr/bin/env python
# -*- coding: utf-8 -*-

class SparqlQuery(object):
    """
    Simple container for a sparql query.
    """
    def __init__(self, query):
        self.query = query
