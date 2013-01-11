# Copyright (C) 2012 NETWAYS GmbH, http://netways.de
#
# This file is part of inGraph (https://www.netways.org/projects/ingraph).
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

import logging

from functools import wraps, partial

__all__ = ['memoize', 'LRUCache']

log = logging.getLogger(__name__)


def memoize(f=None, cache={}):
    """Memoization decorator for both instance methods and functions."""
    if f is None:
        return partial(memoize, cache=cache)
    @wraps(f)
    def wrapper(*args, **kwargs):
        key = (f, tuple(args), frozenset(kwargs.items()))
        try:
            res = cache[key]
        except KeyError:
            res = cache[key] = f(*args, **kwargs)
        return res
    return wrapper


class LRUCache:
    """Least-recently-used cache."""
    pass
