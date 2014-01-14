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
import xmlrpclib

import ingraph
from ingraph.subcommand import Subcommand
from ingraph.daemon import UnixDaemon, get_option_parser
from ingraph.config import file_config, validate_xmlrpc_config

__all__ = ['PurgeCmd']

log = logging.getLogger(__name__)


class PurgeDaemon(UnixDaemon):

    name = "inGraph - purge"

    def __init__(self, **kwargs):
        try:
            self._host_pattern = kwargs.pop('host_pattern')
        except KeyError:
            log.critical("Mandatory argument -H|--hostname missing.")
            sys.exit(1)
        try:
            self._service_pattern = kwargs.pop('service_pattern')
        except KeyError:
            log.critical("Mandatory argument -S|--servicename missing.")
            sys.exit(1)
        self._xmlrpc_config = None
        self.api = None
        UnixDaemon.__init__(self, **kwargs)

    def get_xmlrpc_url(self, xmlrpc_config):
        return 'http://%s:%s@%s:%s/' % (xmlrpc_config['xmlrpc_username'], xmlrpc_config['xmlrpc_password'],
                                        xmlrpc_config['xmlrpc_address'], xmlrpc_config['xmlrpc_port'])

    def before_daemonize(self):
        try:
            xmlrpc_config = file_config('ingraph-xmlrpc.conf')
        except IOError as e:
            log.critical(e)
            sys.exit(1)
        try:
            validate_xmlrpc_config(xmlrpc_config)
        except Exception as e:
            log.critical(e)
            sys.exit(1)
        self._xmlrpc_config = xmlrpc_config

    def run(self):
        self.api = xmlrpclib.ServerProxy(self.get_xmlrpc_url(self._xmlrpc_config), allow_none=True)
        self.api.deleteHostService(self._host_pattern, self._service_pattern)


class PurgedCmd(Subcommand):

    def __init__(self):
        self.daemon = None
        parser = get_option_parser(version="%%prog %s" % ingraph.__version__, pidfile='/var/run/ingraph/ingraph-purged.pid')
        parser.add_option('-H', '--hostname', dest='host_pattern', help='hostname')
        parser.add_option('-S', '--servicename', dest='service_pattern', help='servicename')
        Subcommand.__init__(self, name='purge', parser=parser, help='purge')

    def __call__(self, options, args):
        # Remove all None-values from options
        self.daemon = PurgeDaemon(**dict((k, v) for k, v in vars(options).iteritems() if v is not None))
        # Exec daemon function
        return getattr(self.daemon, args[0])()
