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
import sys

log = logging.getLogger(__name__)


def file_config(filename):
    """Reads and returns configuration from a file named *filename*."""
    filename = os.path.abspath(filename)
    log.debug("Parsing configuration file %s.." % filename)
    config = {}
    execfile(filename, config)
    config_no_cruft = dict((k, v) for k, v in config.iteritems() if k not in globals())
    return config_no_cruft
