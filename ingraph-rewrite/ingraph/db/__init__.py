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
        self.dbapi = self.__class__._dialects[dialect.lower()](user, passwd, host, port, db)

    @memoize
    def fetch_host(self, name):
        res = self.dbapi.fetch_host(self.dbapi.connect(), name)
        if not res:
            res = self.dbapi.insert_host(self.dbapi.connect(), name)
        return res

    @memoize
    def fetch_service(self, name):
        res = self.dbapi.fetch_service(self.dbapi.connect(), name)
        if not res:
            res = self.dbapi.insert_service(self.dbapi.connect(), name)
        return res

    @memoize
    def fetch_host_service(self, host_name, service_name):
        host = self.fetch_host(host_name)
        service = self.fetch_service(service_name)
        res = self.dbapi.fetch_host_service(self.dbapi.connect(), host['id'], service['id'])
        if not res:
            res = self.dbapi.insert_host_service(self.dbapi.connect(), host['id'], service['id'])
        return res

    @memoize
    def fetch_plot(self, host_service_id, name, uom):
        res = self.dbapi.fetch_plot(self.dbapi.connect(), host_service_id, name, uom)
        if not res:
            res = self.dbapi.insert_plot(self.dbapi.connect(), host_service_id, name, uom)
        return res

    def insert_datapoint(self, plot_id, timestamp, value):
        return self.dbapi.insert_datapoint(self.dbapi.connect(), plot_id, timestamp, value)

    def insert_performance_data(self, plot_id, timestamp, **kwargs):
        return self.dbapi.insert_performance_data(self.dbapi.connect(), plot_id, timestamp, **kwargs)

    def __getattr__(self, key):
        return getattr(self.dbapi, key)
