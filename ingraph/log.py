# inGraph (https://www.netways.org/projects/ingraph)
# Copyright (C) 2011-2012 NETWAYS GmbH
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

class FileLikeLogger(object):
    """A file-like python.logging.Logger interface."""

    def __init__(self, logger, loglvl):
        self._logger = logger
        self._loglvl = loglvl

    def write(self, msg):
        msg = msg.rstrip()
        if msg:
            # Do not log if empty
            self._logger.log(self._loglvl, msg)

    def flush(self):
        for handler in self._logger.handlers:
            handler.flush()

    def close(self):
        for handler in self._logger.handlers:
            handler.close()
            
    def __del__(self):
        self.close()