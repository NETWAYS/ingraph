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
from optparse import OptionParser, OptionGroup

from daemon import UnixDaemon, add_optparse_daemon_options
from config import file_config
from MySQLdb import connect as connect_to_mysql
from MySQLdb.cursors import DictCursor
import log
from log import add_optparse_logging_options
from time import time, sleep

log = logging.getLogger(__name__)


def connect(dsn):
    dialect, _ = dsn.split('://', 1)
    _, database = _.rsplit('/', 1)
    _, host = _.rsplit('@', 1)
    try:
        host, port = host.rsplit(':', 1)
    except ValueError:
        port = None
    username, password = _.split(':', 1)
    mysqldb_kwargs = {
        'host': host,
        'user': username,
        'db': database,
        'passwd': password,
        'cursorclass': DictCursor
    }
    if port:
        mysqldb_kwargs['port'] = port
    return connect_to_mysql(**mysqldb_kwargs)


class CleanupDaemon(UnixDaemon):

    name = "inGraph-cleanup"

    def before_daemonize(self):
        log.info("Starting inGraph-cleanup daemon..")
        try:
            databse_config = file_config('ingraph-database.conf')
        except IOError, e:
            log.critical(e)
            sys.exit(1)
        log.debug("Connecting to the database..")
        try:
            self._conn = connect(databse_config['dsn'])
        except KeyError:
            log.critical("You need to set a database connection string (`dsn` setting) in your database configuration file.")
            sys.exit(1)

    def run(self):
        log.debug("Starting cleanup..")
        cur = self._conn.cursor()
        cur.execute('SELECT * FROM `timeframe`')
        timeframes = [tf for tf in cur.fetchall() if tf['active'] and tf['retention_period']]
        lastlog = time()
        numdeleted = 0
        try:
            while True:
                for tf in timeframes:
                    threshold = time() - tf['retention_period']
                    cur.execute('DELETE FROM datapoint WHERE timeframe_id = %s AND timestamp < %s LIMIT 1000', (tf['id'], threshold))
                    numdeleted += cur.rowcount
                if lastlog + 60 < time():
                    log.debug("Deleted %d datapoints" % (numdeleted,))
                    lastlog = time()
                    numdeleted = 0
                sleep(2)
        except KeyboardInterrupt:
            sys.exit(0)


class UnsupportedDaemonFunction(Exception): pass


if __name__ == '__main__':
    daemon_functions = ('start', 'stop', 'restart', 'status')
    usage = "Usage: %%prog [options] {%s}" % '|'.join(daemon_functions)
    parser = OptionParser(usage=usage,
        version="%%prog 1.0")
    add_optparse_logging_options(parser)
    add_optparse_daemon_options(parser)
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
    housekeepd = CleanupDaemon(**daemon_kwargs)
    # Exec daemon function
    getattr(housekeepd, args[0])()
