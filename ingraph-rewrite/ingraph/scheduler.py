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

__all__ = ['synchronized', 'Scheduler', 'RecurringJob', 'RotationJob']

log = logging.getLogger(__name__)
job_lock = Lock()


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


class RecurringJob(object):
    """Recurring job."""
    def __init__(self, jobname, delay, interval, f, *args, **kwargs):
        self.jobname = jobname
        self._delay = delay
        self._interval = interval
        self._f = f
        self._args = args
        self._kwargs = kwargs
        self.pending = True
        self._dismissed = Event()
        self._timer = None

    def run(self):
        self.start()
        log.debug("%s.." % self.jobname)
        self._f(*self._args, **self._kwargs)

    def start(self):
        if not self._dismissed.isSet():
            self.pending = False
            if self._delay:
                log.debug("%s first execution delayed %ds.." % (self.jobname, self._delay))
                self._timer = Timer(self._delay, self.run)
                self._delay = 0
            else:
                # TODO(el): !
                log.debug("%s execution scheduled in %ds.." % (self.jobname, self._interval))
                self._timer = Timer(self._interval, self.run)
            self._timer.start()

    def stop(self):
        self._dismissed.set()
        try:
            self._timer.cancel()
            self._timer.join()
        except AttributeError:
            # Catch 'NoneType' object has no attribute 'cancel' for not yet created timers
            pass


class RotationJob(RecurringJob):
    """Recurring rotation job."""
    def __init__(self, jobname, delay, interval, rotation_f, tablename, values_less_than, slope):
        self._tablename = tablename
        self._values_less_than = values_less_than
        self._slope = slope
        RecurringJob.__init__(self, jobname, delay, interval, rotation_f)

    def run(self):
        self.start()
        log.debug("%s.." % self.jobname)
        self._f(self._tablename, self._values_less_than, self._values_less_than + self._slope)
        self._values_less_than += self._slope


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

    @synchronized(job_lock)
    def add(self, job):
        self.store.add(job)
        self._wakeup.set()

    @synchronized(job_lock)
    def _schedule(self):
        for job in self.store.itervalues():
            if job.pending:
                job.start()

    def run(self):
        self._wakeup.clear()
        while not self._dismissed.isSet():
            self._schedule()
            self._wakeup.wait(sys.maxint) # A call to wait() without a timeout never raises KeyboardInterrupt

    @synchronized(job_lock)
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
