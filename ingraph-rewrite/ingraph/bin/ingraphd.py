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

import ingraph

from ingraph.daemon import UnixDaemon, add_optparse_daemon_options
from ingraph.config import file_config
from ingraph.db import connect
from ingraph.parser import PerfdataParser, InvalidPerfdata
from ingraph.log import add_optparse_logging_options
from ingraph.scheduler import Scheduler

log = logging.getLogger(__name__)


class IngraphDaemon(UnixDaemon):

    name = "inGraph"

    def __init__(self, **kwargs):
        self._perfdata_dir = kwargs.pop('perfdata_dir')
        self._perfdata_pattern = kwargs.pop('perfdata_pattern')
        self._conn = None
        self._scheduler = Scheduler()
        self._dismissed = Event()
        self._process_performancedata_thread = None
        super(IngraphDaemon, self).__init__(**kwargs)

    def _setup_database_schema(self):
        # TODO(el): Track aggregates for changes
        log.debug("Checking database schema..")
        existing_datapoint_tables = self._conn.fetch_datapoint_tables()
        configured_datapoint_tables = []
        for aggregate in self._aggregates:
            datapoint_table = 'datapoint_%i' % aggregate['interval']
            configured_datapoint_tables.append(datapoint_table)
            if datapoint_table not in existing_datapoint_tables:
                log.info("Creating table %s.." % datapoint_table)
                self._conn.create_datapoint_table(datapoint_table, aggregate['retention-period'])
            self._schedule_rotation(datapoint_table)
        self._scheduler.start()

    def _rotate(self, tablename, threshold, retention_period, absolute=False):
        log.info("Rotating %s:%i since they hit their retention period.." % (tablename, threshold))
        self._conn.drop_partition(tablename, threshold)
        self._conn.add_partition(tablename, retention_period, absolute)

    def _schedule_rotation(self, tablename):
        partitions = self._conn.fetch_partitions(tablename)
        present, ahead = int(partitions[0]['partition_name']), int(partitions[1]['partition_name'])
        retention_period = ahead - present
        now = int(time())
        if now > ahead:
            self._rotate(tablename, ahead, retention_period)
        if now - retention_period > present:
            self._rotate(tablename, present, now, absolute=True)
        self._scheduler.add("%s-rotation every %ds" % (tablename, retention_period), retention_period, self._rotate, tablename, retention_period)

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
            self._conn = connect(databse_config['dsn'])
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
        self._setup_database_schema()
        # We'll reconnect later since all open fds will be closed on daemonization, see _before_run
        self._conn.close()

    def _process_performancedata(self):
        pathname = os.path.join(self._perfdata_dir, self._perfdata_pattern)
        parser = PerfdataParser()
        while not self._dismissed.isSet():
            perfdata_files = self._find_perfdata_files(pathname)[:1]
            input = fileinput.input(perfdata_files)
            input.last_processed_file = None
            for line in input:
                input.current_file = input.filename()
                if input.last_processed_file is None or input.last_processed_file != input.current_file:
                    log.debug("Parsing performance data file %s.." % input.current_file)
                    input.last_processed_file = input.current_file
                try:
                    observation, perfdata = parser.parse(line)
                except InvalidPerfdata, e:
                    log.erorr("%s %s:%i" % (e, input.filename(), input.filelineno()))
                    continue
                host_service_record = self._conn.fetch_host_service(observation['host'], observation['service'])
                for plot, value in perfdata.iteritems():
                    plot_record = self._conn.fetch_plot(host_service_record['id'], plot)
                    for aggregate in self._aggregates:
                        params = (plot_record['id'],
                                  observation['timestamp'] - observation['timestamp'] % aggregate['interval'],
                                  0, 0, value, 1)
                        self._conn.insert_datapoint('datapoint_%i' % aggregate['interval'], params)
            # TODO(el): Implement delete mode
            map(lambda file: shutil.move(file, '%s.bak' % file), perfdata_files)

    def _before_run(self):
        self._conn = connect(self._dsn)

    def run(self):
        self._before_run()
        self._process_performancedata_thread = Thread(target=self._process_performancedata, name=__name__)
        self._process_performancedata_thread.setDaemon(True)
        self._process_performancedata_thread.start()
        try:
            while not self._dismissed.isSet():
                # TODO(el): Serve requests
                self._dismissed.wait(sys.maxint) # A call to wait() without a timeout never raises KeyboardInterrupt
        except KeyboardInterrupt:
            sys.exit(0)

    def _find_perfdata_files(self, pathname):
        ifiles = iglob(pathname)
        # Process new performance data first
        return sorted(ifiles, key=lambda f: os.path.getmtime(f))

    def cleanup(self):
        self._dismissed.set()
        log.info("Waiting for daemon to complete processing open performance data files..")
        self._process_performancedata_thread.join()

def add_optparse_ingraph_options(parser):
    ingraph_group = OptionGroup(parser, "inGraph",
                                "These are the options to specify the inGraph daemon:")
    ingraph_group.add_option('-P', '--perfdata-dir', dest='perfdata_dir', default='/var/lib/icinga/perfdata', metavar='DIR',
                             help="Set the performance data directory DIR. [default: %default]")
    ingraph_group.add_option('-e', '--pattern', dest='perfdata_pattern', default='*-perfdata.*[0-9]', metavar='PATTERN',
                             help="Find all performance data files matching the shell pattern PATTERN. [default: %default]")
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
