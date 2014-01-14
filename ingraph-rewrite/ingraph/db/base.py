# Copyright (C) 2013 NETWAYS GmbH, http://netways.de
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

from collections import deque

from ingraph.cache import Plots

__all__ = ['create_database']


class Statement(object):

    ASCENDING = 'ASC'
    DESCENDING = 'DESC'

    def __init__(self, text):
        self._text = text
        self._condition = deque()
        self._params = []
        self._field_order = None

    def filter(self, field_operator, value):
        self._condition.append(field_operator)
        self._params.append(value)

    def order(self, field):
        if field.startswith('-'):
            field = field[1:]
            order = Statement.DESCENDING
        else:
            order = Statement.ASCENDING
        self._field_order = (field, order)


class Connection(object):

    def __init__(self, database):
        self._database = database
        self._raw_connection = None

    def __del__(self):
        try:
            self.close()
        except:
            pass

    def execute(self, statement, params=None):
        self._ensure_connected()
        raw_cursor = self._raw_connection.cursor()
        return raw_cursor.execute(statement, params)

    def executemany(self, statement, parambatch):
        pass

    def close(self):
        pass

    def _ensure_connected(self):
        self._raw_connection = self._database.raw_connect()


class Database(object):

    connection_class = Connection

    def connect(self):
        return self.connection_class(self)

    def raw_connect(self):
        raise NotImplementedError


class Store(object):

    def __init__(self, database):
        self._database = database
        self._connection = database.connect()
        self._aggregates = None
        self._plots = Plots(self)

    def create_host(self, host_name):
        st = Statement('INSERT INTO `host` (`name`) VALUES (%s)')
        self._connection.execute(st, (host_name,))

    def get_host(self, host_name):
        st = Statement('SELECT * FROM `host`').filter('`name` =', (host_name,))
        host = self._connection.execute(st).fetchone()
        if not host:
            raise KeyError(host_name)
        return host

    def get_host_guaranteed(self, host_name):
        try:
            host = self.get_host(host_name)
        except KeyError:
            self.create_host(host_name)
            host = self.get_host(host_name)
        return host

    def create_service(self, service_name):
        st = Statement('INSERT INTO `service` (`name`) VALUES (%s)')
        self._connection.execute(st, (service_name,))

    def get_service(self, service_name):
        st = Statement('SELECT * FROM `service`')\
            .filter('`name` =', (service_name,))
        service = self._connection.execute(st)
        if not service:
            raise KeyError(service_name)
        return service

    def get_service_guaranteed(self, service_name):
        try:
            service = self.get_service(service_name)
        except KeyError:
            self.create_service(service_name)
            service = self.get_service(service_name)
        return service

    def create_hostservice(self, host_id, service_id,
                           parent_hostservice_id=None):
        st = Statement('INSERT INTO `hostservice` (`host_id`, `service_id`, '
                       '`parent_hostservice_id`) VALUES (%s, %s, %s)')
        self._connection.execute(st,
                                 (host_id, service_id, parent_hostservice_id))

    def get_hostservice(self, host_id, service_id, parent_hostservice_id=None):
        st = Statement('SELECT * FROM `hostservice`')\
            .filter('`host_id` =', host_id)\
            .filter('`service_id` =', service_id)\
            .filter('`parent_hostservice_id =`', parent_hostservice_id)
        hostservice = self._connection.execute(st).fetchone()
        if not hostservice:
            raise KeyError("host_id={0}, service_id={1}, "
                           "parent_hostservice_id={2}"\
                               .format(host_id, service_id,
                                       parent_hostservice_id))
        return hostservice

    def get_hostservice_guaranteed(self, host_name, service_name,
                                   parent_service_name=None):
        host = self.get_host_guaranteed(host_name)
        service = self.get_service_guaranteed(service_name)
        if parent_service_name:
            parent_hostservice = self.get_hostservice_guaranteed(
                host_name=host_name,
                service_name=parent_service_name)
            parent_hostservice_id = parent_hostservice['id']
        else:
            parent_hostservice_id = None
        try:
            hostservice = self.get_hostservice(host['id'], service['id'],
                                               parent_hostservice_id)
        except KeyError:
            self.create_hostservice(host['id'], service['id'],
                                    parent_hostservice_id)
            hostservice = self.get_hostservice(host['id'], service['id'],
                                               parent_hostservice_id)
        return hostservice

    def create_plot(self, hostservice_id, plot_name, plot_uom):
        st = Statement('INSERT INTO `plot` (`hostservice_id`, `name`, `unit`) '
                       'VALUES (?, ?, ?)')
        self._connection.execute(st, (hostservice_id, plot_name, plot_uom))

    def get_plot(self, hostservice_id, plot_name):
        st = Statement('SELECT * FROM `plot`')\
            .filter('`hostservice_id` =', hostservice_id)\
            .filter('`plot_name` =', plot_name)
        plot = self._connection.execute(st).fetchone()
        if not plot:
            raise KeyError("hostservice_id={0}, plot_name={1}"\
                               .format(hostservice_id, plot_name))
        return plot

    def get_plot_guaranteed(self, hostservice_id, plot_name, plot_uom):
        try:
            plot_row = self.get_plot(hostservice_id, plot_name)
        except KeyError:
            self.create_plot(hostservice_id, plot_name, plot_uom)
            plot_row = self.get_plot(hostservice_id, plot_name)
        plot = self._plots[plot_row['plot_id']]
        plot.extend(plot_row)
        return plot

    def insert_datapoint(self, plot, timestamp, value):
        for aggregate in self._aggregates:
            plot.datapoints[aggregate['interval']]\
                .update(timestamp, value)

    def take_performance_data(self, plot, timestamp, **kwargs):
        plot.performance_data.take(timestamp, **kwargs)


def create_store(dsn):
    """Create a store instance.

    :param dsn: a string describing the data source. Example:

        "mysql://user[:password]@host[:port]/ingraph" The database
        ingraph on machine host with supplied user credentials, using mysql.
    """

    dialect, rest = dsn.split('://', 1)
    rest, db = rest.rsplit('/', 1)
    user, host = rest.rsplit('@', 1)
    try:
        host, port = host.rsplit(':', 1)
    except ValueError:
        port = None
    try:
        user, password = user.split(':', 1)
    except ValueError:
        password = None
    try:
        module = __import__('ingraph.db.%s' % (dialect,))
    except ImportError:
        raise Exception("Database dialect `%s` not supported." % (dialect,))
    return module.factory(user, password, host, port, db)
