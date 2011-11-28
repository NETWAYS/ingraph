#!/usr/bin/env python
# inGraph (https://www.netways.org/projects/ingraph)
# Copyright (C) 2011 NETWAYS GmbH
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
import distribute_setup
distribute_setup.use_setuptools()
from setuptools import setup

import ingraph

console_scripts = ['ingraphd = ingraph.bin.ingraphd:main',
                   'ingraph-collectord = ingraph.bin.ingraph_collectord:main',
                   'check_ingraph = ingraph.bin.check_ingraph:main']
setup(name=ingraph.__name__,
      version=ingraph.__version__,
      description="Data collection and graphing utility for monitoring systems",
      author=ingraph.__author__,
      author_email=ingraph.__contact__,
      url=ingraph.__url__,
      install_requires=['sqlalchemy>=0.6.3'],
      packages=['ingraph.bin', 'ingraph'],
      entry_points={
        'console_scripts': console_scripts
      })
