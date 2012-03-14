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

import sys

if sys.version_info[:2] < (2, 4):
    sys.exit('inGraph requires Python version 2.4 or later')
elif sys.version_info[:2] >= (3,):
    sys.exit('inGraph is not yet compatible with Python 3')

__name__ = 'ingraph'
__version__ = '1.0'
__author__ = 'NETWAYS GmbH'
__contact__ = 'info@netways.de'
__url__ = 'https://www.netways.org'
__description__ = 'Data collection and graphing utility for monitoring systems'
