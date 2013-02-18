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
from optparse import OptionGroup
from glob import iglob
from threading import Thread, Event
from tempfile import NamedTemporaryFile
import errno
import shutil
from threading import Lock

import ingraph
from ingraph.daemon import UnixDaemon, get_option_parser
from ingraph.config import file_config, validate_xmlrpc_config
from ingraph.db import connect
from ingraph.parser import PerfdataParser, InvalidPerfdata
from ingraph.log import add_optparse_logging_options
from ingraph.scheduler import synchronized
from ingraph.xmlrpc import AuthenticatedXMLRPCServer
from ingraph.api import  IngraphAPI

log = logging.getLogger(__name__)
perfdata_lock = Lock()
MAX_THREADS = 4


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
        self._server = None
        self._server_thread = None
        super(IngraphDaemon, self).__init__(**kwargs)

    def before_daemonize(self):
        log.info("Starting inGraph daemon..")
        try:
            databse_config = file_config('ingraph-database.conf')
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
            aggregates_config = file_config('ingraph-aggregates.conf')
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
        try:
            xmlrpc_config = file_config('ingraph-xmlrpc.conf')
        except IOError as e:
            log.critical(e)
            sys.exit(1)
        validate_xmlrpc_config(xmlrpc_config)
        self._xmlrpc_config = xmlrpc_config

    @synchronized(perfdata_lock)
    def _consume_perfdata_file(self):
        if self._dismissed.isSet():
            return None
        if not self._remaining_perfdata:
            from time import sleep
            sleep(10)
            # TODO(el): Synchronize with active threads
            files = iglob(self._perfdata_pathname)
            self._remaining_perfdata = sorted(files, key=lambda file: os.path.getmtime(file))
        try:
            perfdata_to_process = self._remaining_perfdata.pop()
        except IndexError:
            return None
        return perfdata_to_process

    def _process_performancedata(self):
        parser = PerfdataParser()
        while not self._dismissed.isSet():
            filename = self._consume_perfdata_file()
            if not filename:
                continue
            log.debug("Parsing performance data file %s.." % filename)
            f = open(filename)
            for lineno, line in enumerate(f):
                try:
                    observation, perfdata = parser.parse(line)
                except InvalidPerfdata, e:
                    log.warn("%s %s:%i" % (e, filename, lineno + 1))
                    continue
                host_service_record = self.connection.get_host_service_guaranteed(observation['host'], observation['service'])
                for performance_data in perfdata:
                    if performance_data['child_service']:
                        parent_host_service_record = self.connection.get_host_service_guaranteed(
                            observation['host'], performance_data.pop('child_service'), observation['service'])
                        hostservice_id = parent_host_service_record['id']
                    else:
                        hostservice_id = host_service_record['id']
                    plot_record = self.connection.get_plot_guaranteed(hostservice_id, performance_data.pop('label'), performance_data.pop('uom'))
                    self.connection.insert_datapoint(plot_record['id'], observation['timestamp'], performance_data.pop('value'))
                    self.connection.insert_performance_data(plot_record['id'], observation['timestamp'], **performance_data)
            f.close()
            if self._perfdata_mode == 'BACKUP':
                shutil.move(filename, '%s.bak' % filename)
            elif self._perfdata_mode == 'REMOVE':
                os.remove(filename)

    def run(self):
        self.connection.setup_database_schema(self._aggregates)
        log.info("Starting XML-RPC interface on %s:%d..." %
                 (self._xmlrpc_config['xmlrpc_address'], self._xmlrpc_config['xmlrpc_port']))
        try:
            self._server = AuthenticatedXMLRPCServer(
                (self._xmlrpc_config['xmlrpc_address'], self._xmlrpc_config['xmlrpc_port']), allow_none=True)
        except Exception as e:
            log.critical(e)
            sys.exit(1)
        self._server.timeout = 5
        if sys.version_info[:2] < (2,6):
            self._server.socket.settimeout(self._server.timeout)
        self._server.required_username = self._xmlrpc_config['xmlrpc_username']
        self._server.required_password = self._xmlrpc_config['xmlrpc_password']
        self._server.register_introspection_functions()
        self._server.register_multicall_functions()
        self._server.register_instance(IngraphAPI(self.connection))
        self._server_thread = Thread(target=self._server.serve_forever)
        self._server_thread.setDaemon(True)
        self._server_thread.start()
        for i in xrange(0, MAX_THREADS):
            t = Thread(target=self._process_performancedata, name="Process performance data %d" % (i + 1))
            self._process_performancedata_threadpool.append(t)
            t.setDaemon(True)
            t.start()
        try:
            while not self._dismissed.isSet():
                self._dismissed.wait(sys.maxint) # A call to wait() without a timeout never raises KeyboardInterrupt
        except KeyboardInterrupt:
            sys.exit(0)

    def cleanup(self):
        self._dismissed.set()
        if self._server:
            self._server.shutdown()
            self._server_thread.join()
        log.info("Waiting for daemon to complete processing open performance data files..")
        for t in self._process_performancedata_threadpool:
            t.join(2)
        self.connection.close()


def add_optparse_ingraph_options(parser):
    PERFDATA_MODES = ('BACKUP', 'REMOVE', 'LEAVEMEBE')
    ingraph_group = OptionGroup(parser, "inGraph",
                                "These are the options to specify the inGraph daemon:")
    ingraph_group.add_option('-P', '--perfdata-dir', dest='perfdata_dir', default='/var/lib/icinga/perfdata', metavar='DIR',
                             help="Set the performance data directory DIR. [default: %default]")
    ingraph_group.add_option('-e', '--pattern', dest='perfdata_pattern', default='*-perfdata.*[0-9]', metavar='PATTERN',
                             help="Find all performance data files matching the shell pattern PATTERN. [default: %default]")
    ingraph_group.add_option('-m', '--mode', dest='perfdata_mode', default='BACKUP', choices=PERFDATA_MODES,
                             help="perfdata files post processing, one of: %s [default: %%default]" % ', '.join(PERFDATA_MODES))
    parser.add_option_group(ingraph_group)


def main():
    parser = get_option_parser(version="%%prog %s" % ingraph.__version__)
    add_optparse_logging_options(parser)
    add_optparse_ingraph_options(parser)
    options, args = parser.parse_args()
    logging.getLogger().setLevel(getattr(logging, options.logging_level))
    # Remove all None-values from options
    ingraphd = IngraphDaemon(**dict((k, v) for k, v in options.__dict__.iteritems() if v is not None))
    # Exec daemon function
    getattr(ingraphd, args[0])()


if __name__ == '__main__':
    sys.exit(main())
