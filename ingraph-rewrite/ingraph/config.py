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
import os.path

log = logging.getLogger(__name__)


def file_config(filename):
    """Reads and returns configuration from a file named *filename*."""
    filename = os.path.abspath(filename)
    log.debug("Parsing configuration file %s.." % filename)
    config = {}
    execfile(filename, config)
    config_no_cruft = dict((k, v) for k, v in config.iteritems() if k not in globals())
    return config_no_cruft


def validate_xmlrpc_config(xmlrpc_config):
    if 'xmlrpc_address' not in xmlrpc_config or 'xmlrpc_port' not in xmlrpc_config:
        raise Exception("You need to set a bind address/port for the XML-RPC interface "
                        "'xmlrpc_address' and 'xmlrpc_port' settings).")
    if 'xmlrpc_username' not in xmlrpc_config or 'xmlrpc_password' not in xmlrpc_config:
        raise Exception("You need to set an XML-RPC username and password "
                        "'xmlrpc_username' and 'xmlrpc_password' settings).")
