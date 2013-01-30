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

import functools
import collections
import bisect
import weakref

__all__ = ['memoize', 'Node', 'UniqueSortedRingBuffer']


def memoize(f=None, cache={}):
    """Memoization decorator for both instance methods and functions."""
    if f is None:
        return functools.partial(memoize, cache=cache)
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        key = (f, tuple(args), frozenset(kwargs.items()))
        try:
            res = cache[key]
        except KeyError:
            res = cache[key] = f(*args, **kwargs)
        return res
    return wrapper


class Node(object):

    __slots__ = ('prev', 'next', 'key', '__weakref__')

    def __eq__(self, other):
        if not isinstance(other, Node):
            return False
        return self.key == other.key

    def __ne__(self, other):
        return not self == other

    def __repr__(self):
        if not self:
            return '%s()' % self.__class__.__name__
        return '%s(key=%s)' % (self.__class__.__name__, self.key)


class UniqueSortedRingBuffer(collections.MutableMapping):

    def __init__(self):
        self.__root = root = Node()
        root.key = None
        root.prev = root.next = weakref.proxy(root)
        self.__pointers = []
        self.__map = {}

    def __len__(self):
        return len(self.__pointers)

    def __contains__(self, key):
        return key in self.__pointers

    def __eq__(self, other):
        if not isinstance(other, UniqueSortedRingBuffer):
            return False
        if len(self) != len(other):
            return False
        for a, b in zip(self, other):
            if a != b:
                return False
        return True

    def __ne__(self, other):
        return not self == other

    def __setitem__(self, key, node):
        if key not in self.__pointers:
            # Find rightmost value less than key
            i = bisect.bisect_right(self.__pointers, key)
            try:
                insort = self.__map[self.__pointers[i]]
            except IndexError:
                insort = self.__root
            self.__pointers.insert(i, key)
            self.__map[key] = node
            last = insort.prev
            node.prev, node.next, node.key = last, insort, key
            last.next = insort.prev = weakref.proxy(node)

    def __getitem__(self, key):
        return self.__map[key]

    def __delitem__(self, key):
        self.__pointers.remove(key)
        node = self.__map.pop(key)
        node.prev.next = node.next
        node.next.prev = node.prev

    def __iter__(self):
        root = self.__root
        curr = root.next
        while curr is not root:
            yield curr
            curr = curr.next

    def __reversed__(self):
        root = self.__root
        curr = root.prev
        while curr is not root:
            yield curr
            curr = curr.prev

    def __repr__(self):
        if not self:
            return '%s()' % self.__class__.__name__
        return '%s(%r)' % (self.__class__.__name__, self.__map)
