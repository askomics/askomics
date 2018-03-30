#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import logging
import json

from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.utils import pformat_generic_object

class AbstractedEntity(object):
    """
    An AbstractedEntity represents the classes of the database.
    It is defined by an uri and a label.
    """

    def __init__(self, identifier,prefix):
        self.uri = ParamManager.encode_to_rdf_uri(identifier,prefix)
        self.label = identifier

        self.log = logging.getLogger(__name__)

    def get_uri(self):
        return self.uri

    def get_turtle(self):
        """
        return the turtle code describing an AbstractedEntity
        for the abstraction file generation.
        """
        turtle = self.get_uri() + " rdf:type owl:Class ;\n"

        turtle += (len(self.get_uri()) + 1) * " " + "askomics:entity \"true\"^^xsd:boolean ;\n"
        turtle += (len(self.get_uri()) + 1) * " " + "rdfs:label " + json.dumps(self.label) + "^^xsd:string .\n\n"
        turtle += '\n'
        turtle += 'rdfs:label rdf:type owl:DatatypeProperty .\n'
        turtle += 'rdfs:label askomics:attribute "true"^^xsd:boolean .\n'
        turtle += 'rdfs:label askomics:attributeOrder "1"^^xsd:decimal .\n'
        turtle += 'rdfs:label rdfs:label "label" .\n'
        turtle += 'rdfs:label rdfs:domain '+self.get_uri()+' .\n'
        turtle += 'rdfs:label rdfs:range xsd:string .\n'
        return turtle
