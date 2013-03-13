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

import sys

from ingraph.subcommand import SubcommandsOptionParser
from ingraph.cmd.purge import PurgeCmd
from ingraph.cmd.ingraphd import IngraphdCmd

__all__ = ['main']


def main():
    parser = SubcommandsOptionParser(
        subcommands = (PurgeCmd(), IngraphdCmd())
    )
    options, cmd, cmd_opts, cmd_args = parser.parse_args()
    cmd(cmd_opts, cmd_args)


if __name__ == '__main__':
    sys.exit(main())
