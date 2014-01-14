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

from collections import deque

from ingraph.db.mysql import MySQLAPI
from ingraph.cache import memoize, get_cache

__all__ = ['connect', 'IngraphDatabaseAPI']


def connect(dsn):
    return IngraphDatabaseFacade(dsn)
>>>>>>> Stashed changes

from ingraph.cache import memoize, get_cache

class IngraphDatabaseFacade(object):

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
        try:
            self.dbapi = self.__class__._dialects[dialect.lower()](user, passwd, host, port, db)
        except KeyError:
            raise Exception("Database dialect `%s` not supported. Supported dialects are: %s." %
                            (dialect, ', '.join(self.__class__._dialects.iterkeys())))

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
            rs = self.dbapi.insert_host(self.dbapi.cursor(), host_name)
        return rs

    @memoize(cache=get_cache('service'))
    def get_service(self, service_name):
        rs = self.dbapi.get_service(self.dbapi.cursor(), service_name)
        if not rs:
            raise KeyError(service_name)
        return rs

    @memoize(cache=get_cache('service'))
    def get_service_guaranteed(self, service_name):
        try:
            rs = self.get_service(service_name)
        except KeyError:
            rs = self.dbapi.insert_service(self.dbapi.cursor(), service_name)
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


class IngraphDatabaseAPI(object):

    def cursor(self):
        raise NotImplementedError

    def get_host(self, cursor, host_name):
        cursor.execute('SELECT * FROM `host` WHERE `name` = ?', (host_name,))
        return cursor.fetchone()

    def get_host(self, cursor, host_name):
        cursor.execute('SELECT * FROM `host` WHERE `name` = ?', (host_name,))
        return cursor.fetchone()

    def insert_host(self, cursor, host_name):
        cursor.execute('INSERT INTO `host` (`name`) VALUES (?)', (host_name,))
        return self.get_host(cursor, host_name)

    def get_service(self, cursor, service_name):
        cursor.execute('SELECT * FROM `service` WHERE `name` = ?', (service_name,))
        return cursor.fetchone()

    def insert_service(self, cursor, service_name):
        cursor.execute('INSERT INTO `service` (`name`) VALUES (?)', (service_name,))
        return self.get_service(cursor, service_name)

    def get_host_service(self, cursor, host_id, service_id, parent_hostservice_id=None):
        query = 'SELECT * FROM `hostservice` WHERE `host_id` = ? AND `service_id` = ?'
        params = [host_id, service_id]
        if parent_hostservice_id:
            query += ' AND `parent_hostservice_id` = ?'
            params.append(parent_hostservice_id)
        cursor.execute(query, params)
        return cursor.fetchone()

    def insert_host_service(self, cursor, host_id, service_id, parent_hostservice_id=None):
        cursor.execute('INSERT INTO `hostservice` (`host_id`, `service_id`, `parent_hostservice_id`) VALUES (?, ?, ?)',
                       (host_id, service_id, parent_hostservice_id))
        return self.get_host_service(cursor, host_id, service_id, parent_hostservice_id)

    def get_plot(self, cursor, host_service_id, plot_name):
        cursor.execute('SELECT * FROM `plot` WHERE `hostservice_id` = ? AND `name` = ?',
                       (host_service_id, plot_name))
        return cursor.fetchone()

    def insert_plot(self, cursor, host_service_id, plot_name, plot_uom):
        cursor.execute('INSERT INTO `plot` (`hostservice_id`, `name`, `unit`) VALUES (?, ?, ?)',
                       (host_service_id, plot_name, plot_uom))
        return self.get_plot(cursor, host_service_id, plot_name)

    def get_plot_boundaries(self, cursor, interval, plot_id):
        cursor.execute('SELECT MIN(`timestamp`) AS start, MAX(`timestamp`) AS end FROM `datapoint_%d` WHERE `plot_id` = ?' % interval, (plot_id,))
        row = self.cursor.fetchone()
        start = row['start']
        end = row['end']
        return start, end

    def fetch_hosts(self, cursor, host_pattern=None, limit=None, offset=None):
        condition = deque()
        params = []
        if host_pattern:
            condition.append('`name` LIKE ?')
            params.append(host_pattern)
        query = 'SELECT `name` AS `host_name`FROM `host`'
        countQuery = 'SELECT COUNT(`id`) FROM `host`'
        try:
            where = condition.popleft()
        except IndexError:
            # No condition
            pass
        else:
            query += ' WHERE %s' % where
            countQuery += ' WHERE %s' % where
        if limit:
            query += ' LIMIT %d' % limit
        if offset:
            query += ' OFFSET %d' % offset
        cursor.execute(query, params)
        countCursor = cursor.connection.cursor()
        countCursor.execute(countQuery, params)
        return cursor, countCursor.fetchone()[0]

    def fetch_services(self, cursor, host_pattern=None, service_pattern=None, limit=None, offset=None):
        condition = deque()
        params = []
        if host_pattern:
            condition.append('`h`.`name` LIKE ?')
            params.append(host_pattern)
        if service_pattern:
            condition.append('`s`.`name` LIKE ?')
            params.append(service_pattern)
        query = '''SELECT `s`.`name` AS `service_name`, `ps`.`name` AS `parent_service_name`
                   FROM `hostservice` `hs`
                   INNER JOIN `host` `h` ON `hs`.`host_id` = `h`.`id`
                   INNER JOIN `service` `s` ON `hs`.`service_id` = `s`.`id`
                   LEFT JOIN `hostservice` `phs` ON `hs`.`parent_hostservice_id` = `phs`.`id`
                   LEFT JOIN `service` `ps` ON `phs`.`service_id` = `ps`.`id`'''
        countQuery = '''SELECT COUNT(`hs`.`id`)
                   FROM `hostservice` `hs`
                   INNER JOIN `host` `h` ON `hs`.`host_id` = `h`.`id`
                   INNER JOIN `service` `s` ON `hs`.`service_id` = `s`.`id`
                   LEFT JOIN `hostservice` `phs` ON `hs`.`parent_hostservice_id` = `phs`.`id`
                   LEFT JOIN `service` `ps` ON `phs`.`service_id` = `ps`.`id`'''
        try:
            where = condition.popleft()
        except IndexError:
            # No condition
            pass
        else:
            query += ' WHERE %s' % where
            countQuery += ' WHERE %s' % where
            for and_ in condition:
                query += ' AND %s' % and_
                countQuery += ' AND %s' % and_
        if limit:
            query += ' LIMIT %d' % limit
        if offset:
            query += ' OFFSET %d' % offset
        cursor.execute(query, params)
        countCursor = cursor.connection.cursor()
        countCursor.execute(countQuery, params)
        return cursor, countCursor.fetchone()[0]

    def fetch_plots(self, cursor, host_pattern=None, service_pattern=None, parent_service_pattern=None, plot_pattern=None,
                    limit=None, offset=None):
        condition = deque()
        params = []
        if host_pattern:
            condition.append('`h`.`name` LIKE ?')
            params.append(host_pattern)
        if service_pattern:
            condition.append('`s`.`name` LIKE ?')
            params.append(service_pattern)
        if parent_service_pattern:
            condition.append('`ps`.`name` LIKE ?')
            params.append(parent_service_pattern)
        if plot_pattern:
            condition.append('`p`.`name` LIKE ?')
            params.append(plot_pattern)
        query = '''SELECT `p`.`id`, `p`.`name` AS `plot_name`, `h`.`name` AS `host_name`, `s`.`name` AS `service_name`,
                          `ps`.`name` AS `parent_service_name`
                   FROM `plot` `p`
                   INNER JOIN `hostservice` `hs` ON `p`.`hostservice_id` = `hs`.`id`
                   INNER JOIN `host` `h` ON `hs`.`host_id` = `h`.`id`
                   INNER JOIN `service` `s` ON `hs`.`service_id` = `s`.`id`
                   LEFT JOIN `hostservice` `phs` ON `hs`.`parent_hostservice_id` = `phs`.`id`
                   LEFT JOIN `service` `ps` ON `phs`.`service_id` = `ps`.`id`'''
        countQuery = '''SELECT COUNT(`p`.`id`)
                   FROM `plot` `p`
                   INNER JOIN `hostservice` `hs` ON `p`.`hostservice_id` = `hs`.`id`
                   INNER JOIN `host` `h` ON `hs`.`host_id` = `h`.`id`
                   INNER JOIN `service` `s` ON `hs`.`service_id` = `s`.`id`
                   LEFT JOIN `hostservice` `phs` ON `hs`.`parent_hostservice_id` = `phs`.`id`
                   LEFT JOIN `service` `ps` ON `phs`.`service_id` = `ps`.`id`'''
        try:
            where = condition.popleft()
        except IndexError:
            # No condition
            pass
        else:
            query += ' WHERE %s' % where
            countQuery += ' WHERE %s' % where
            for and_ in condition:
                query += ' AND %s' % and_
                countQuery += ' AND %s' % and_
        if limit:
            query += ' LIMIT %d' % limit
        if offset:
            query += ' OFFSET %d' % offset
        cursor.execute(query, params)
        countCursor = cursor.connection.cursor()
        countCursor.execute(countQuery, params)
        return cursor, countCursor.fetchone()[0]

    def fetch_datapoints(self, cursor, plot_id, start, end, interval):
        cursor.execute('''SELECT * FROM `datapoint_%d`
                          WHERE `timestamp` BETWEEN ? AND ? AND `plot_id` = ?
                          ORDER BY `timestamp` ASC''' % (interval), (start, end, plot_id))
        return cursor

    def fetch_performance_data(self, cursor, plot_id, start, end):
        cursor.execute('''SELECT * FROM `performance_data`
                          WHERE `timestamp` BETWEEN ? AND ? AND `plot_id` = ?
                          ORDER BY `timestamp` ASC''', (start, end, plot_id))
        return cursor

    def drop_table(self, cursor, tablename):
        cursor.execute('DROP TABLE %s' % tablename)
