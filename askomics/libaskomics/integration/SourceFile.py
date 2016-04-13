#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import logging

class SourceFile(object):
    """
    Container of the name and content of tabulated file being converted.
    """

    def __init__(self, name, content):
        self.name = name
        self.content = content

        self.log = logging.getLogger(__name__)

    def get_name(self):
        return self.name

    def get_content(self):
        return self.content

    def print_attr(self):
        self.log.debug("name = " + self.name)
        self.log.debug("content = " + self.content)

    def to_dict(self):
        return {"name": self.name,
                "content": self.content}
