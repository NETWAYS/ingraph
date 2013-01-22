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

import re

from ingraph.db.mysql import MySQLAPI
from ingraph.cache import memoize

__all__ = ['connect']


def connect(dsn):
    return Database(dsn)


class Database(object):

    _dialects = {
        'mysql': MySQLAPI
    }

    def __init__(self, dsn):
        dialect, _ = dsn.split('://', 1)
        _, db = _.rsplit('/', 1)
        user, host = _.rsplit('@', 1)
        try:
            host, port = host.rsplit(':', 1)
        except ValueError:
            port = None
        try:
            user, passwd = user.split(':', 1)
        except ValueError:
            passwd = None
        self.connection = self.__class__._dialects[dialect.lower()](user, passwd, host, port, db)

    @memoize
    def fetch_host(self, name):
        res = self.connection.fetch_host(self.connection.connect(), name)
        if not res:
            res = self.connection.insert_host(self.connection.connect(), name)
        return res

    @memoize
    def fetch_service(self, name):
        res = self.connection.fetch_service(self.connection.connect(), name)
        if not res:
            res = self.connection.insert_service(self.connection.connect(), name)
        return res

    @memoize
    def fetch_host_service(self, host_name, service_name):
        host = self.fetch_host(host_name)
        service = self.fetch_service(service_name)
        res = self.connection.fetch_host_service(self.connection.connect(), host['id'], service['id'])
        if not res:
            res = self.connection.insert_host_service(self.connection.connect(), host['id'], service['id'])
        return res

    @memoize
    def fetch_plot(self, host_service_id, name, uom):
        res = self.connection.fetch_plot(self.connection.connect(), host_service_id, name, uom)
        if not res:
            res = self.connection.insert_plot(self.connection.connect(), host_service_id, name, uom)
        return res

    def fetch_datapoint_tables(self):
        return self.connection.fetch_datapoint_tables(self.connection.connect())

    def create_datapoint_table(self, tablename, retention_period):
        return self.connection.create_datapoint_table(self.connection.connect(), tablename, retention_period)

    def insert_datapoint(self, tablename, params):
        return self.connection.insert_datapoint(self.connection.connect(), tablename, params)

    def fetch_partitions(self, tablename):
        return self.connection.fetch_partitions(self.connection.connect(), tablename)

    def add_partition(self, tablename, values_less_than):
        return self.connection.add_partition(self.connection.connect(), tablename, values_less_than)

    def drop_partition(self, tablename, partitionname):
        return self.connection.drop_partition(self.connection.connect(), tablename, partitionname)

    def __getattr__(self, key):
        return getattr(self.connection, key)
