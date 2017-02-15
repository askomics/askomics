"""Contain UtilsTest"""

import unittest
from askomics.libaskomics.utils import *

class UtilsTest(unittest.TestCase):
    """Contain all test for utils.py"""

    @staticmethod
    def test_property():
        class TestProperty(HaveCachedProperties):
            @cached_property
            def test_property(self):
                return "Ok1"

            def set_cache(self, v):
                "Test if the cached property can be set directly as an attribute."
                self.test_property = v

        t = TestProperty()
        assert t.cache == {}, "starting with clear cache"

        t.test_property # Compute the value and cache it
        assert t.cache == {'test_property': 'Ok1'}, "cache computed on attribute access"

        t.cache = {}
        assert t.cache == {}, "Cache cleared on t.cache = {}"

        t.set_cache("Ok2")
        assert t.cache == {'test_property': 'Ok2'}, "Cache value set directly on the attribute"

        del t.test_property
        assert t.cache == {}, "deleting attribute delete the cache"

        t.test_property # Compute the value and cache it
        del t.cache
        assert t.cache == {}, "deleting cache attribute delete the cache"

        t.test_property # Compute the value and cache it
        t.cache = { 'test_property': None }
        assert t.cache == {}, "setting the cache dict with a None value delete the cache"

