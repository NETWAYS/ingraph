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
from time import time

import ingraph
from ingraph.subcommand import Subcommand
from ingraph.daemon import UnixDaemon, get_option_parser
from ingraph.config import file_config, validate_xmlrpc_config
from ingraph.db import connect
from ingraph.parser import PerfdataParser, InvalidPerfdata
from ingraph.log import add_optparse_logging_options
from ingraph.scheduler import synchronized
from ingraph.xmlrpc import AuthenticatedXMLRPCServer
from ingraph.api import  IngraphAPI

__all__ = ['IngraphdCmd']

log = logging.getLogger(__name__)


class IngraphDaemon(UnixDaemon):

    name = "inGraph"

    def __init__(self, **kwargs):
        self._perfdata_mode = kwargs.pop('perfdata_mode')
        self._perfdata_dir = kwargs.pop('perfdata_dir')
        self._perfdata_pattern = kwargs.pop('perfdata_pattern')
        self._perfdata_pathname = os.path.join(self._perfdata_dir, self._perfdata_pattern)
        self.connection = None
        self._server = None
        self._server_thread = None
        self._dismissed = Event()
        UnixDaemon.__init__(self, **kwargs)

    def before_daemonize(self):
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

    def _process_perfdata(self, filename, parser=PerfdataParser()):
        start = time()
        log.info("Parsing performance data file %s.." % filename)
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
        log.debug("Processed %s in %3fs" % (filename, time() - start))

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
        self._server_thread.daemon = True
        self._server_thread.start()
        try:
            while not self._dismissed.is_set():
                for filename in sorted(iglob(self._perfdata_pathname), key=lambda file: os.path.getmtime(file), reverse=True)[:50]:
                    self._process_perfdata(filename)
        except KeyboardInterrupt:
            sys.exit(0)

    def cleanup(self):
        log.info("Waiting for daemon to complete processing open performance data files..")
        self._dismissed.set()
        if self._server:
            log.info("Stopping XML-RPC interface..")
            self._server.shutdown()
            self._server_thread.join()
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


class IngraphdCmd(Subcommand):

    def __init__(self):
        self.daemon = None
        parser = get_option_parser(version="%%prog %s" % ingraph.__version__)
        add_optparse_logging_options(parser)
        add_optparse_ingraph_options(parser)
        Subcommand.__init__(self, name='daemon', parser=parser, help='daemon')

    def __call__(self, options, args):
        logging.getLogger().setLevel(getattr(logging, options.logging_level))
        # Remove all None-values from options
        self.daemon = IngraphDaemon(**dict((k, v) for k, v in options.__dict__.iteritems() if v is not None))
        # Exec daemon function
        getattr(self.daemon, args[0])()
