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

from ingraph.db.mysql import MySQLDb
from ingraph.cache import memoize

__all__ = ['connect']


def connect(dsn):
    return Db(dsn)


class Db(object):

    _dialects = {
        'mysql': MySQLDb
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
        self._conn = self.__class__._dialects[dialect.lower()](user, passwd, host, port, db)

    def close(self):
        return self._conn.close()

    @memoize
    def fetch_host(self, name):
        res = self._conn.fetch_host(name)
        if not res:
            res = self._conn.insert_host(name)
        return res

    @memoize
    def fetch_service(self, name):
        res = self._conn.fetch_service(name)
        if not res:
            res = self._conn.insert_service(name)
        return res

    @memoize
    def fetch_host_service(self, host_name, service_name):
        host = self.fetch_host(host_name)
        service = self.fetch_service(service_name)
        res = self._conn.fetch_host_service(host['id'], service['id'])
        if not res:
            res = self._conn.insert_host_service(host['id'], service['id'])
        return res

    @memoize
    def fetch_plot(self, host_service_id, name):
        res = self._conn.fetch_plot(host_service_id, name)
        if not res:
            res = self._conn.insert_plot(host_service_id, name)
        return res

    def fetch_datapoint_tables(self):
        return self._conn.fetch_datapoint_tables()

    def create_datapoint_table(self, tablename, retention_period):
        return self._conn.create_datapoint_table(tablename, retention_period)

    def insert_datapoint(self, tablename, params):
        return self._conn.insert_datapoint(tablename, params)

    def fetch_partitions(self, tablename):
        return self._conn.fetch_partitions(tablename)

    def add_partition(self, tablename, values_less_than, absolute=False):
        return self._conn.add_partition(tablename, values_less_than, absolute=False)

    def drop_partition(self, tablename, partitionname):
        return self._conn.drop_partition(tablename, partitionname)
