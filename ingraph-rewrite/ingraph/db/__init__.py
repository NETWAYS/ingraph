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

from ingraph.db.mysql import MySQLAPI
from ingraph.cache import memoize, get_cache

__all__ = ['connect']


def connect(dsn):
    return IngraphDatabase(dsn)


class IngraphDatabase(object):

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

    @memoize(cache=get_cache('host'))
    def get_host(self, host_name):
        rs = self.dbapi.get_host(self.dbapi.connect(), host_name)
        if not rs:
            raise KeyError(host_name)
        return rs

    @memoize(cache=get_cache('host'))
    def get_host_guaranteed(self, host_name):
        try:
            rs = self.get_host(host_name)
        except KeyError:
            rs = self.dbapi.insert_host(self.dbapi.connect(), host_name)
        return rs

    @memoize(cache=get_cache('service'))
    def get_service(self, service_name):
        rs = self.dbapi.get_service(self.dbapi.connect(), service_name)
        if not rs:
            raise KeyError(service_name)
        return rs

    @memoize(cache=get_cache('service'))
    def get_service_guaranteed(self, service_name):
        try:
            rs = self.get_service(service_name)
        except KeyError:
            rs = self.dbapi.insert_service(self.dbapi.connect(), service_name)
        return rs

    @memoize(cache=get_cache('hostservice'))
    def get_host_service(self, host_name, service_name, parent_service_name=None):
        host = self.get_host(host_name)
        service = self.get_service(service_name)
        if parent_service_name:
            parent_host_service = self.get_host_service(host_name=host_name, service_name=parent_service_name)
            parent_host_service_id = parent_host_service['id']
        else:
            parent_host_service_id = None
        return self.dbapi.get_host_service(self.dbapi.connect(), host['id'], service['id'], parent_host_service_id)

    @memoize(cache=get_cache('hostservice'))
    def get_host_service_guaranteed(self, host_name, service_name, parent_service_name=None):
        host = self.get_host_guaranteed(host_name)
        service = self.get_service_guaranteed(service_name)
        if parent_service_name:
            parent_hostservice = self.get_host_service_guaranteed(host_name=host_name, service_name=parent_service_name)
            parent_hostservice_id = parent_hostservice['id']
        else:
            parent_hostservice_id = None
        rs = self.dbapi.get_host_service(self.dbapi.connect(), host['id'], service['id'], parent_hostservice_id)
        if not rs:
            rs = self.dbapi.insert_host_service(self.dbapi.connect(), host['id'], service['id'], parent_hostservice_id)
        return rs

    @memoize(cache=get_cache('plot'))
    def get_plot(self, host_service_id, plot_name):
        rs =  self.dbapi.get_plot(self.dbapi.connect(), host_service_id, plot_name)
        if not rs:
            raise KeyError((host_service_id, plot_name))
        return rs

    @memoize(cache=get_cache('plot'))
    def get_plot_guaranteed(self, host_service_id, plot_name, plot_uom):
        try:
            rs = self.get_plot(host_service_id, plot_name)
            # TODO(el): Update uom if changed
        except KeyError:
            rs = self.dbapi.insert_plot(self.dbapi.connect(), host_service_id, plot_name, plot_uom)
        return rs

    def fetch_hosts(self, host_pattern=None, limit=None, offset=None):
        return self.dbapi.fetch_hosts(self.dbapi.connect(), host_pattern, limit, offset)

    def fetch_services(self, host_pattern=None, service_pattern=None, limit=None, offset=None):
        return self.dbapi.fetch_services(self.dbapi.connect(), host_pattern, service_pattern, limit, offset)

    def fetch_plots(self, host_pattern=None, service_pattern=None, parent_service_pattern=None, plot_pattern=None,
                    limit=None, offset=None):
        return self.dbapi.fetch_plots(self.dbapi.connect(), host_pattern, service_pattern, parent_service_pattern,
                                      plot_pattern, limit, offset)

    def fetch_datapoints(self, plot_ids, start=None, end=None, interval=None, null_tolerance=0):
        return self.dbapi.fetch_datapoints(self.dbapi.connect(), plot_ids, start, end, interval, null_tolerance)

    def fetch_performance_data(self, plot_ids, start=None, end=None):
        return self.dbapi.fetch_performance_data(self.dbapi.connect(), plot_ids, start, end)

    def delete_datapoints(self, parambatch):
        return self.dbapi.delete_datapoints(self.dbapi.connect(), parambatch)

    def delete_plots(self, parambatch):
        return self.dbapi.delete_plots(self.dbapi.connect(), parambatch)

    def delete_performance_data(self, parambatch):
        return self.dbapi.delete_performance_data(self.dbapi.connect(), parambatch)

    def delete_host_services_unconstrained(self):
        return self.dbapi.delete_host_services_unconstrained(self.dbapi.connect())

    def delete_services_unconstrained(self):
        return self.dbapi.delete_services_unconstrained(self.dbapi.connect())

    def delete_hosts_unconstrained(self):
        return self.dbapi.delete_hosts_unconstrained(self.dbapi.connect())

    def __getattr__(self, key):
        return getattr(self.dbapi, key)
