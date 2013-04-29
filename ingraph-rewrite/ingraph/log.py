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

import sys
import logging

__all__ = ['add_optparse_logging_options']


class LogFormatter(logging.Formatter):
    """Log formatter with color support which is enabled automatically by importing it."""
    def __init__(self, *args, **kwargs):
        logging.Formatter.__init__(self, *args, **kwargs)
        self._color = sys.stderr.isatty()
        if self._color:
            self._colors = {
                logging.DEBUG: ('\x1b[34m',), # Blue
                logging.INFO: ('\x1b[32m',), # Green
                logging.WARNING: ('\x1b[33m',), # Yellow
                logging.ERROR: ('\x1b[31m',), # Red
                logging.CRITICAL: ('\x1b[1m', '\x1b[31m'), # Bold, Red
            }
            self._footer = '\x1b[0m'

    def format(self, record):
        formatted_message = logging.Formatter.format(self, record)
        if self._color:
            formatted_message = (''.join(self._colors.get(record.levelno)) + formatted_message +
                                 len(self._colors.get(record.levelno)) * self._footer)
        return formatted_message


def add_optparse_logging_options(parser, default_loglevel='DEBUG'):
    LOGLEVELS = ('INFO', 'WARNING', 'ERROR', 'CRITICAL', 'DEBUG')
    parser.add_option('-v', '--verbose', dest='logging_level', default=default_loglevel, choices=LOGLEVELS,
                      help="Print verbose informational messages. One of %s. [default: %%default]" % ', '.join(LOGLEVELS))


channel = logging.StreamHandler()
channel.setFormatter(LogFormatter(fmt='%(asctime)-15s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
logging.getLogger().addHandler(channel)
