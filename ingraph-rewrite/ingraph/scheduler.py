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
import sys

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
        self.db = {}

    def _generate_id(self):
        while True:
            id = '%i' % randint(1, 100)
            try:
                self.db[id]
            except KeyError:
                return id
            else:
                continue

    def add(self, item):
        item.id = self._generate_id()
        self.db[item.id] = item

    def __getattr__(self, key):
        return getattr(self.db, key)


class Rotation(object):
    """Recurring rotation job."""
    def __init__(self, jobname, timeout, interval, rotation_f, tablename, values_less_than, slope):
        self.pending = True
        self.jobname = jobname
        self._timer = None
        self._interval = interval
        self._timeout = timeout
        self._rotation_f = rotation_f
        self._tablename = tablename
        self._values_less_than = values_less_than
        self._slope = slope
        self._dismissed = Event()

    def run(self):
        self.start()
        log.debug("Exectuing job `%s`.." % self.jobname)
        self._rotation_f(self._tablename, self._values_less_than, self._values_less_than + self._slope)
        self._values_less_than += self._slope

    def start(self):
        if not self._dismissed.isSet():
            self.pending = False
            if self._timeout:
                log.debug("%s: Job's first execution delayed %ds.." % (self.jobname, self._timeout))
                self._timer = Timer(self._timeout, self.run)
                self._timeout = 0
            else:
                self._timer = Timer(self._interval, self.run)
            self._timer.start()

    def stop(self):
        self._dismissed.set()
        try:
            self._timer.cancel()
            self._timer.join()
        except:
            raise


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
        self.store = Store()
        self._wakeup = Event()
        self._thread = None

    @synchronized(lock)
    def add(self, jobname, timeout, interval, rotation_f, tablename, values_less_than, slope):
        log.debug("Adding yet pending job `%s`.." % jobname)
        job = Rotation(jobname, timeout, interval, rotation_f, tablename, values_less_than, slope)
        self.store.add(job)
        self._wakeup.set()

    @synchronized(lock)
    def _schedule(self):
        for job in self.store.itervalues():
            if job.pending:
                job.start()

    def run(self):
        self._wakeup.clear()
        while not self._dismissed.isSet():
            self._schedule()
            self._wakeup.wait(sys.maxint) # A call to wait() without a timeout never raises KeyboardInterrupt


    @synchronized(lock)
    def stop(self):
        log.info("Waiting for active jobs to finish..")
        self._dismissed.set()
        self._wakeup.set()
        for _, job in self.store.iteritems():
            job.stop()
        if self._thread:
            self._thread.join()

    def start(self):
        self._thread = Thread(target=self.run, name=__name__)
        self._thread.setDaemon(self._daemonic)
        self._thread.start()
