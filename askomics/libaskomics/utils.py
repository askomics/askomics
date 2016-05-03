"""Some python magic to provide utility Bases, decorators, utility functions, etc. """

import sys
from pprint import pformat

__all__ = ['pformat_generic_object',
           'cached_property', 'HaveCachedProperties']


def pformat_generic_object(obj):
    "Pretty print a object and its attributes to string"
    pubattrs = {k:v for k, v in obj.__dict__.items() if not k.startswith('_') }

    if sys.version_info >= (3,3):
        name = getattr(obj, '__qualname__', type(obj).__qualname__)
    else:
        name = getattr(obj, '__name__', type(obj).__name__)
    return "{0}({1})".format(name, pformat(pubattrs))

class cached_property(object):
    """Like @property on a member function, but cache the calculation in
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


class HaveCachedProperties(object):
    """Provide cache management for classes using cached_property."""
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
