#!/usr/bin/env python
#
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
import os.path
import fileinput
from optparse import OptionParser, OptionGroup
from glob import iglob
from time import time
from threading import Thread, Event
from tempfile import NamedTemporaryFile
import errno
import shutil
from threading import Lock
from Queue import Queue

import ingraph

from ingraph.daemon import UnixDaemon, add_optparse_daemon_options
from ingraph.config import file_config
from ingraph.db import connect
from ingraph.parser import PerfdataParser, InvalidPerfdata
from ingraph.log import add_optparse_logging_options
from ingraph.scheduler import synchronized

log = logging.getLogger(__name__)
perfdata_lock = Lock()
MAX_THREADS=2


class IngraphDaemon(UnixDaemon):

    name = "inGraph"

    def __init__(self, **kwargs):
        self._perfdata_mode = kwargs.pop('perfdata_mode')
        self._perfdata_dir = kwargs.pop('perfdata_dir')
        self._perfdata_pattern = kwargs.pop('perfdata_pattern')
        self._perfdata_pathname = os.path.join(self._perfdata_dir, self._perfdata_pattern)
        self.connection = None
        self._dismissed = Event()
        self._remaining_perfdata = None
        self._process_performancedata_threadpool = []
        super(IngraphDaemon, self).__init__(**kwargs)

    def before_daemonize(self):
        log.info("Starting inGraph daemon..")
        try:
            databse_config = file_config('/share/netways.ingraph/ingraph-rewrite/examples/config/ingraph-database.conf')
        except IOError as e:
            log.critical(e)
            sys.exit(1)
        log.debug("Connecting to the database..")
        try:
            self._dsn = databse_config['dsn']
            self.connection = connect(databse_config['dsn'])
        except KeyError:
            log.critical("You need to set a database connection string (`dsn` setting) in your database configuration file.")
            sys.exit(1)
        try:
            aggregates_config = file_config('/share/netways.ingraph/ingraph-rewrite/examples/config/ingraph-aggregates.conf')
        except IOError as e:
            log.critical(e)
            sys.exit(1)
        try:
            self._aggregates = aggregates_config['aggregates']
        except KeyError:
            log.critical("You need to define aggregates (`aggregates` setting) in your aggregates configuration file.")
            sys.exit(1)
        try:
            tempfile = NamedTemporaryFile(dir=self._perfdata_dir, delete=False)
            tempfile.close()
            os.remove(tempfile.name)
        except OSError as e:
            if e.errno == errno.EACCES:
                log.critical("Performance data directory %s is not writable. "
                             "Please make sure that the directory is writable for the inGraph daemon user so "
                             "processed files are moved or deleted accordingly." % self._perfdata_dir)
                sys.exit(1)
            # Not a permission error
            raise
        self.connection.setup_database_schema(self._aggregates)

    @synchronized(perfdata_lock)
    def _consume_perfdata_file(self):
        if not self._remaining_perfdata:
            files = iglob(self._perfdata_pathname)
            # TODO(el): Synchronize with active threads
            self._remaining_perfdata = sorted(files, key=lambda file: os.path.getmtime(file))
        perfdata_to_process = self._remaining_perfdata.pop()
        return perfdata_to_process

    def _process_performancedata(self):
        parser = PerfdataParser()
        while not self._dismissed.isSet():
            file = self._consume_perfdata_file()
            log.debug("Parsing performance data file %s.." % file)
            for line in open(file):
                try:
                    observation, perfdata = parser.parse(line)
                except InvalidPerfdata, e:
                    log.error("%s %s:%i" % (e, input.filename(), input.filelineno()))
                    continue
                host_service_record = self.connection.fetch_host_service(observation['host'], observation['service'])
                for plot, values in perfdata.iteritems():
                    value, uom, min, max = values
                    plot_record = self.connection.fetch_plot(host_service_record['id'], plot, uom)
                    self.connection.insert_datapoint(plot_record['id'], observation['timestamp'], value)
            #if self._perfdata_mode == 'BACKUP':
            #    shutil.move(file, '%s.bak' % file)
            #elif self._perfdata_mode == 'REMOVE':
            #    os.remove(file)

    def run(self):
        for i in xrange(0, MAX_THREADS):
            t = Thread(target=self._process_performancedata, name="Process performance data %d" % (i + 1))
            self._process_performancedata_threadpool.append(t)
            t.setDaemon(True)
            t.start()
        try:
            while not self._dismissed.isSet():
                # TODO(el): Serve requests
                self._dismissed.wait(sys.maxint) # A call to wait() without a timeout never raises KeyboardInterrupt
        except KeyboardInterrupt:
            sys.exit(0)

    def cleanup(self):
        self._dismissed.set()
        log.info("Waiting for daemon to complete processing open performance data files..")
        for t in self._process_performancedata_threadpool:
            t.join()
        self.connection.close()


def add_optparse_ingraph_options(parser):
    PERFDATA_MODES = ('BACKUP', 'REMOVE')
    ingraph_group = OptionGroup(parser, "inGraph",
                                "These are the options to specify the inGraph daemon:")
    ingraph_group.add_option('-P', '--perfdata-dir', dest='perfdata_dir', default='/var/lib/icinga/perfdata', metavar='DIR',
                             help="Set the performance data directory DIR. [default: %default]")
    ingraph_group.add_option('-e', '--pattern', dest='perfdata_pattern', default='*-perfdata.*[0-9]', metavar='PATTERN',
                             help="Find all performance data files matching the shell pattern PATTERN. [default: %default]")
    ingraph_group.add_option('-m', '--mode', dest='perfdata_mode', default='BACKUP', choices=PERFDATA_MODES,
                             help="perfdata files post processing, one of: %s [default: %%default]" % ', '.join(PERFDATA_MODES))
    parser.add_option_group(ingraph_group)


class UnsupportedDaemonFunction(Exception): pass


if __name__ == '__main__':
    daemon_functions = ('start', 'stop', 'restart', 'status')
    usage = "Usage: %%prog [options] {%s}" % '|'.join(daemon_functions)
    parser = OptionParser(usage=usage,
                          version="%%prog %s" % ingraph.__version__)
    add_optparse_logging_options(parser)
    add_optparse_daemon_options(parser)
    add_optparse_ingraph_options(parser)
    (options, args) = parser.parse_args()
    try:
        if args[0] not in daemon_functions:
            raise UnsupportedDaemonFunction()
    except (IndexError, UnsupportedDaemonFunction):
        parser.print_usage()
        sys.exit(1)
    logging.getLogger().setLevel(getattr(logging, options.logging_level))
    # Remove all None-values from options
    daemon_kwargs = dict((k, v) for k, v in options.__dict__.iteritems() if v is not None)
    ingraphd = IngraphDaemon(**daemon_kwargs)
    # Exec daemon function
    getattr(ingraphd, args[0])()
