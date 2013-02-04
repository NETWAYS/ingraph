#!/usr/bin/env python
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

from setuptools import setup
from os.path import isfile

import ingraph

config_files = []
for config_file in ('ingraph-aggregates.conf', 'ingraph-database.conf',
                    'ingraph-xmlrpc.conf'):
    if not isfile('/etc/ingraph/%s' % config_file):
        config_files.append('examples/config/%s' % config_file)

setup(
    name = ingraph.__name__,
    version = ingraph.__version__,
    description = ingraph.__description__,
    author = ingraph.__author__,
    author_email = ingraph.__contact__,
    url = ingraph.__url__,
    requires = ['sqlalchemy (>=0.6.3)'],
    packages = ['ingraph.bin', 'ingraph'],
    zip_safe = False,
    entry_points = {
        'console_scripts': ['ingraphd = ingraph.bin.ingraphd:main']
    },
    data_files = [
        ('/etc/init.d', ['contrib/init.d/ingraph']),
        ('/etc/ingraph', config_files)
    ]
)
