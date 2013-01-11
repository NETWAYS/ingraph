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

#import shelve
#import pickle
import logging
import sys

from time import time, sleep
from random import randint
from threading import Event, Lock, Thread, Timer
from functools import wraps

__all__ = ['Scheduler']

log = logging.getLogger(__name__)

lock = Lock()


def synchronized(lock):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            lock.acquire()
            try:
                return f(*args, **kwargs)
            finally:
                lock.release()
        return wrapper
    return decorator


class Store(object):
    """Job store."""
    def __init__(self):
#        self._db = shelve.open(path, protocol=pickle.HIGHEST_PROTOCOL)
        self._db = {}

    def _generate_id(self):
        while True:
            id = '%i' % randint(1, 100)
            try:
                self._db[id]
            except KeyError:
                return id
            else:
                continue

    def add(self, item):
        item.id = self._generate_id()
        self._db[item.id] = item

    def iteritems(self):
        for key in self._db:
            yield (key, self._db[key])

    def close(self):
#        self._db.close()
        pass


class RecurringJob(object):
    """Recurring job."""
    def __init__(self, jobname, interval, f, *args, **kwargs):
        self.pending = True
        self._timer = None
        self.jobname = jobname
        self._interval = interval
        self._f = f
        self._args = args
        self._kwargs = kwargs
        self._dismissed = Event()

    def run(self):
        self.start()
        log.debug("Exectuing job '%s'.." % self.jobname)
        self._f(*self._args, **self._kwargs)

    def start(self):
        if not self._dismissed.isSet():
            self.pending = False
            self._timer = Timer(self._interval, self.run)
            self._timer.start()

    def stop(self):
        self._dismissed.set()
        try:
            self._timer.cancel()
            self._timer.join()
        except:
            pass

    def __call__(self, *args, **kwargs):
        self.start()

#    def __getstate__(self):
#        state = self.__dict__.copy()
#        state.pop('_dismissed', None)
#        return state

#    def __setstate__(self, state):
#        state['_dismissed'] = Event()
#        self.__dict__ = state


class Scheduler(object):
    """Scheduler."""
    __shared_state = {}

    def __new__(cls, *args, **kwargs):
        self = object.__new__(cls, *args, **kwargs)
        self.__dict__ = cls.__shared_state
        return self

    def __init__(self, daemonic=True):
        self._daemonic = daemonic
        self._dismissed = Event()
        self._store = Store()
        self._wakeup = Event()
        self._thread = None

    @synchronized(lock)
    def add(self, jobname, interval, f, *args, **kwargs):
        log.debug("Adding yet pending job '%s'.." % jobname)
        job = RecurringJob(jobname, interval, f, *args, **kwargs)
        self._store.add(job)
        self._wakeup.set()

    @synchronized(lock)
    def _schedule(self):
        log.debug("Scheduling peding jobs..")
        for _, job in self._store.iteritems():
            if job.pending:
                job.start()

    def run(self):
        self._wakeup.clear()
        try:
            while not self._dismissed.isSet():
                self._schedule()
                self._wakeup.wait(sys.maxint) # A call to wait() without a timeout never raises KeyboardInterrupt
        except KeyboardInterrupt:
            self.stop()

    @synchronized(lock)
    def stop(self):
        self._dismissed.set()
        self._wakeup.set()
        for _, job in self._store.iteritems():
            job.stop()
        if self._thread:
            self._thread.join()
        self._store.close()

    def start(self):
        log.debug("Starting scheduler..")
        self._thread = Thread(target=self.run, name=__name__)
        self._thread.setDaemon(self._daemonic)
        self._thread.start()
