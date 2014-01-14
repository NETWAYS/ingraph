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
import threading
import itertools

from ingraph.synchronize import synchronized

__all__ = ['get_cache', 'memoize', 'Plots']

cache_lock = threading.RLock()
_caches = {}


@synchronized(cache_lock)
def get_cache(name):
    try:
        cache = _caches[name]
    except KeyError:
        cache = _caches[name] = {}
    return cache


def memoize(f=None, cache={}):
    """Memoization decorator for both instance methods and functions."""
    if f is None:
        return functools.partial(memoize, cache=cache)
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        key = (f, tuple(args), frozenset(kwargs.items()))
        try:
            rs = cache[key]
        except KeyError:
            rs = cache[key] = f(*args, **kwargs)
        return rs
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
            return "{0}()".format(self.__class__.__name__)
        return "{0}(key={1})".format(self.__class__.__name__, self.key)


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

    def validate(self, insort, node):
        return True

    def __setitem__(self, key, node,
                    # Find rightmost value less than key
                    find_ins=bisect.bisect_right,
                    proxy=weakref.proxy):
        if key not in self.__map:
            i = find_ins(self.__pointers, key)
            try:
                insort = self.__map[self.__pointers[i]]
            except IndexError:
                insort = self.__root
            if not self.validate(insort, node):
                return
            self.__pointers.insert(i, key)
            self.__map[key] = node
            last = insort.prev
            node.prev, node.next, node.key = last, insort, key
            last.next = insort.prev = proxy(node)

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
            return "{0}()".format(self.__class__.__name__)
        return "{0}({1})".format(self.__class__.__name__, self.__map)


class PerformanceData(Node):

    __slots__ = ('timestamp', 'lower_limit', 'upper_limit',
                 'warn_lower', 'warn_upper', 'warn_type',
                 'crit_lower', 'crit_upper', 'crit_type', 'phantom')

    def __init__(self, **kwargs):
        for slot in self.__slots__:
            object.__setattr__(self, slot, None)
        self.update(**kwargs)
        self.phantom = True

    def update(self, filter=itertools.itfilter, **kwargs):
        for k, v in filter(lambda k, v: k in self.__slots__, kwargs):
            setattr(self, k, v)

    def __eq__(self, other):
        if not isinstance(other, PerformanceData):
            return False
        for slot in ('lower_limit', 'upper_limit', 'warn_lower', 'warn_upper',
                     'crit_lower', 'crit_upper'):
            try:
                if format(getattr(self, slot), '.4f') !=\
                        format(getattr(other, slot), '4.f'):
                    return False
            except:
                return False
        return all(getattr(self, slot) ==\
                   getattr(other, slot) for slot in ('warn_type', 'crit_type'))

    def __repr__(self):
        if not self:
            return '%s()' % self.__class__.__name__
        return '%s(%r)' % (
            self.__class__.__name__,
            dict((slot, getattr(self, slot)) for slot in self.__slots__))


class PerformanceDataContainer(UniqueSortedRingBuffer):

    def __init__(self, store, plot_id):
        self._plot_id = plot_id
        self._pending = []
        UniqueSortedRingBuffer.__init__(self)
        for performance_data in store.get_performance_data(plot_id):
            self[performance_data['timestamp']] = PerformanceData(
                **performance_data)

    def validate(self, insort, node):
        if node != insort.prev and node != insort:
            return True
        return False

    def generate_parambatch(self, proxy=weakref.proxy):
        for p in self:
            if p.phantom:
                self._pending.append(proxy(p))
                yield (self._plot_id, p.timestamp,
                       p.lower_limit, p.upper_limit,
                       p.warn_lower, p.warn_upper, p.warn_type,
                       p.crit_lower, p.crit_upper, p.crit_type)

    def commit(self):
        for p in self._pending:
            p.phantom = False
        del self._pending[:]

class Datapoint(object):

    __slots__ = ('min', 'max', 'avg', 'count', 'dirty', 'phantom')

    def __init__(self, avg=None, min=None, max=None, count=0):
        self.avg = avg
        self.min = min
        self.max = max
        self.count = count
        self.dirty = False
        self.phantom = True

    def update(self, value, last_value):
        self.avg = (self.avg * self.count + value) / (self.count + 1)
        self.count += 1
        self.min = value if self.min == None else min(self.min, value)
        self.max = value if self.max == None else max(self.max, value)
        self.dirty = True

    def _rate(self, value, last_value):
        if last_value > value:
            # We're checking for possible overflows by comparing the last raw value with the current
            # raw value. If the last value is greater than 80% of the 32 or 64 bit boundary and the
            # current value is below 20% of the matching boundary chances are it was an overflow
            # rather than a counter reset. However, if the new value is 0 we assume it's a counter
            # reset anyway.
            if (value != 0 and last_value > 0.8 * 1 << 32 and value < 0.2 * 1 << 32):
                # 32bit counter overflow
                print("32-bit Counter overflow detected: last_value: %d, value: %d" % (last_value, value))
                last_value = -(1 << 32 - last_value)
            elif (value != 0 and last_value > 0.8 * 1 << 64 and value < 0.2 * 1 << 64):
                # 64bit counter overflow
                print("64-bit Counter overflow detected: last_value: %d, value: %d" % (last_value, value))
                last_value = -(1 << 64 - last_value)
            else:
                # ordinary counter reset
                print("Counter reset detected: last_value: %d, value: %d" % (last_value, value))
                last_value = 0

        return (value - last_value) / (timestamp - last_timestamp)


class Interval(dict):

    def __init__(self, store, plot_id, interval):
        self._store = store
        self._plot_id = plot_id
        self._interval = interval
        boundaries = store.get_interval_boundaries(interval, plot_id)
        if boundaries:
            self._start, self._end = boundaries['start'], boundaries['end']
            end_datapoint = store.get_datapoint(interval, plot_id, self._end)
            self._last_value = end_datapoint['avg']
        else:
            self._start = self._end = self._last_value = None
        dict.__init__(self)

    def update(self, timestamp, value):
        timestamp_normalized = timestamp - timestamp % self._interval
        last_value = None
        try:
            datapoint = self[timestamp_normalized]
        except KeyError:
            if not self._start:
                datapoint = Datapoint(avg=value)
                self._start = self._end = timestamp_normalized
            elif timestamp_normalized < self._start:
                datapoint = Datapoint(avg=value)
                self._start = timestamp_normalized
            elif timestamp_normalized > self._end:
                datapoint = Datapoint(avg=value)
                self._end = timestamp_normalized
            else:
                datapoint_row = self._store.get_datapoint(
                    self._interval, self._plot_id, timestamp_normalized)
                if datapoint_row:
                    datapoint = Datapoint(
                        avg=float(datapoint_row['avg']),
                        min=float(datapoint_row['min']),
                        max=float(datapoint_row['max']),
                        count=datapoint_row['count'])
                else:
                    datapoint = Datapoint()
            self[timestamp_normalized] = datapoint
        datapoint.update(value, last_value)


class DatapointContainer(dict):

    def __init__(self, store, plot_id):
        self._store = store
        self._plot_id = plot_id
        dict.__init__(self)

    def __getitem__(self, interval):
        try:
            interval = dict.__getitem__(self, interval)
        except KeyError:
            interval = Interval(self._store, self._plot_id, interval)
        return interval


class Plot(dict):

    def __init__(self, store, plot_id):
        self.datapoints = DatapointContainer(store, plot_id)
        self.performance_data = PerformanceDataContainer(store, plot_id)
        dict.__init__(self)


class Plots(dict):

    def __init__(self, store):
        self._store = store
        dict.__init__(self)

    def __getitem__(self, plot_id):
        try:
            plot = dict.__getitem__(self, plot_id)
        except KeyError:
            plot = Plot(self._store, plot_id)
        return plot
