"""Some reusable utilities : Bases, decorators, utility functions, etc.
Also a place to isolate "python magic" tricks.
"""

import sys
from pprint import pformat
from itertools import chain, repeat, islice

# Names exported :
__all__ = [
    # Utility functions
        'pformat_generic_object',
    # Itertools additions :
        'intersperse_chain',
        'prefix_lines',
    # Decorators
        'cached_property',
    # Bases and mixins
        'HaveCachedProperties',
    ]


#
# Utility functions
#

def pformat_generic_object(obj):
    "Pretty print a object and its attributes to string"
    pubattrs = {k:v for k, v in obj.__dict__.items() if not k.startswith('_') }
    name = getattr(obj, '__qualname__', type(obj).__qualname__)
    return "{0}({1})".format(name, pformat(pubattrs))

#
# Itertools additions :
#
def intersperse_chain(delimiter, iterators):
    """ yield delimiter between the elements of each iterators.
    >>> list(intersperse_chain('sep', [['str1', 'str2'], ['str3', 'str4'], ['str5']]))
    ['str1', 'str2', 'sep', 'str3', 'str4', 'sep', 'str5']
    """
    iterators = iter(iterators)
    yield from next(iterators)
    for it in iterators:
        yield delimiter
        yield from it

def prefix_lines(prefix, strings):
    r"""
    >>> list(prefix_lines('\t', ['line1', 'line2']))
    ['\tline1', '\tline2']
    """
    return (prefix + s for s in strings)


#
# Decorators
#

class cached_property(object):
    """Like @property on a member function, but also cache the calculation in
    self.__dict__[function name].
    The function is called only once since the cache stored as an instance
    attribute override the property residing in the class attributes. Following accesses
    cost no more than standard Python attribute access.
    If the instance attribute is deleted the next access will re-evaluate the function.
    Source: https://blog.ionelmc.ro/2014/11/04/an-interesting-python-descriptor-quirk/
    usage:
        class Shape(object):

            @cached_property
            def area(self):
                # compute value
                return value
    """
    __slots__ = ('func')
    def __init__(self, func):
        self.func = func

    def __get__(self, obj, cls):
        value = obj.__dict__[self.func.__name__] = self.func(obj)
        return value

#
# Bases and mixins
#

class HaveCachedProperties(object):
    """Provide cache management for classes with @cached_property attributes."""
    @classmethod
    def get_cached_properties(cls):
        # cached_property instances are in the class dict with other class attributes
        return (attr for attr, cp in cls.__dict__.items()
                if isinstance(cp, cached_property))

    def get_cache(self):
        """Explicit access (as a dictionary) to all the values cached in the attributes of this object.
        Return the subset of self.__dict__ for keys in self.get_cached_properties().
        """
        properties = set(self.get_cached_properties())
        # The caches are stored in the instance dictionary with the same names than the properties
        return {attr: cache for attr, cache in self.__dict__.items() if attr in properties}

    def set_cache(self, cache_dict, reset=True):
        """ Set the cache.
        If reset is True, reset caches not present in cache_dict keys().
        With reset = False, a reset is still possible if cache_dict[key] is None

            self.cache = cache_dict
        is equivalent to:
            self.set_cache(cache_dict, reset=True)
        """
        properties = set(self.get_cached_properties())
        if not reset:
            properties &= cache_dict.keys()

        for key in properties:
            cache = cache_dict.get(key)
            if cache is None:
                self.__dict__.pop(key, None)
            else:
                self.__dict__[key] = cache

    def reset_cache(self):
        "Equivalent to self.set_cache({}, reset=True) or del self.cache"
        for key in self.get_cached_properties():
            self.__dict__.pop(key, None)

    cache = property(get_cache, set_cache, reset_cache,
                     "Explicit access (as a dictionary) to all the values cached in the attributes of this object.")
