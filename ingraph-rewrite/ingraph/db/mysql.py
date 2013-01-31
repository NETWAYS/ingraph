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

from __future__ import division
import oursql
import sys
import logging
from time import time
from threading import Lock, RLock
from decimal import Decimal

from sqlalchemy import pool

from ingraph.scheduler import Scheduler, synchronized, RotationJob, RecurringJob
from ingraph.cache import Node, UniqueSortedRingBuffer

__all__ = ['MySQLAPI']

log = logging.getLogger(__name__)
partition_lock = Lock()
datapoint_lock = Lock()
performance_data_lock = RLock()


class Datapoint(object):

    __slots__ = ('min', 'max', 'avg', 'count')

    def __init__(self, avg=0, min=None, max=None, count=0, **kwargs):
        self.avg = avg
        self.min = min
        self.max = max
        self.count = count

    def update(self, value):
        value = Decimal(repr(value))
        self.avg = (self.avg + value) / 2
        self.min = value if self.min == None else min(self.min, value)
        self.max = value if self.max == None else max(self.max, value)
        self.count += 1


class DatapointCache(dict):

    def __init__(self, dbapi, mapping):
        self.dbapi = dbapi
        dict.__init__(self, mapping)

    def __getitem__(self, key):
        interval, plot_id, timestamp = key
        interval_cache = dict.__getitem__(self, interval)
        try:
            plot_cache = interval_cache[plot_id]
        except KeyError:
            plot_cache = interval_cache[plot_id] = {}
        try:
            item = plot_cache[timestamp]
        except KeyError:
            datapoint = self.dbapi.fetch_datapoint(self.dbapi.connect(), interval, plot_id, timestamp)
            if datapoint:
                item = Datapoint(**datapoint)
            else:
                item = Datapoint()
            plot_cache[timestamp] = item
        return item

    def generate_parambatch(self, interval):
        interval_cache = dict.__getitem__(self, interval)
        for plot_id, plot_cache in interval_cache.iteritems():
            for timestamp, datapoint in sorted(plot_cache.iteritems()):
                yield plot_id, timestamp, datapoint.avg, datapoint.min, datapoint.max, datapoint.count

    def clear_interval(self, interval):
        dict.__getitem__(self, interval).clear()


class PerformanceData(Node):

    __slots__ = ('timestamp', 'lower_limit', 'upper_limit', 'warn_lower', 'warn_upper', 'warn_type',
                 'crit_lower', 'crit_upper', 'crit_type', 'phantom')

    def __init__(self, **kwargs):
        for slot in self.__class__.__slots__:
            object.__setattr__(self, slot, None)
        self.update(**kwargs)
        self.phantom = True

    def __setattr__(self, name, value):
        if value != '':
            # Prevent that empty strings overwrite None/NULL values which would cause invalid decimal value exception
            object.__setattr__(self, name, value)

    def update(self, **kwargs):
        values = dict((k, v) for (k, v) in kwargs.iteritems() if k in self.__class__.__slots__)
        for k, v in values.iteritems():
            setattr(self, k, v)

    def __eq__(self, other):
        if not isinstance(other, PerformanceData):
            return False
        return all(getattr(self, slot) == getattr(other, slot) for slot in self.__class__.__slots__ if slot != 'phantom' and slot != 'timestamp')

    def __repr__(self):
        if not self:
            return '%s()' % self.__class__.__name__
        return '%s(%r)' % (self.__class__.__name__, dict((slot, getattr(self, slot)) for slot in self.__class__.__slots__))


class PerformanceDataCache(dict):

    def __init__(self, dbapi):
        self.dbapi = dbapi
        self.__pending = []
        self.__abandon = []

    def __getitem__(self, key):
        plot_id, timestamp = key
        try:
            plot_cache = dict.__getitem__(self, plot_id)
        except KeyError:
            plot_cache = self[plot_id] = UniqueSortedRingBuffer()
            performance_data_rows = self.dbapi.fetch_performance_data(self.dbapi.connect(), plot_id)
            for performance_data_row in performance_data_rows:
                performance_data = PerformanceData(**performance_data_row)
                performance_data.phantom = False
                plot_cache[performance_data_row['timestamp']] = performance_data
        plot_cache[timestamp] = PerformanceData(timestamp=timestamp)
        return plot_cache[timestamp]

    def generate_parambatch(self):
        for plot_id, plot_cache in self.iteritems():
            if len(plot_cache) < 2:
                continue
            for i, performance_data in enumerate(plot_cache):
                if (i == 0 and performance_data.phantom) or ((isinstance(performance_data.prev, PerformanceData) and
                                                              performance_data.prev != performance_data) or
                                                             (isinstance(performance_data.next, PerformanceData) and
                                                              performance_data.next != performance_data)):
                    self.__pending.append((plot_id, performance_data.key))
                    yield (plot_id, performance_data.timestamp, performance_data.lower_limit, performance_data.upper_limit,
                           performance_data.warn_lower, performance_data.warn_upper, performance_data.warn_type,
                           performance_data.crit_lower, performance_data.crit_upper, performance_data.crit_type)
                else:
                    self.__abandon.append((plot_id, performance_data.key))

    def commit(self):
        for plot_id, key in self.__pending:
            dict.__getitem__(self, plot_id)[key].phantom = False
        del self.__pending[:]
        for plot_id, key in self.__abandon:
            del dict.__getitem__(self, plot_id)[key]
        del self.__abandon[:]


class MySQLAPI(object):

    def __init__(self, user, passwd, host, port, db):
        oursql_kwargs = {
            'user': user,
            'host': host,
            'db': db,
            'autoreconnect': True
        }
        if port:
            oursql_kwargs['port'] = port
        if passwd:
            oursql_kwargs['passwd'] = passwd
        self.oursql_kwargs = oursql_kwargs
        pool.manage(oursql)
        self._scheduler = Scheduler()

    def connect(self):
        try:
            connection = oursql.connect(**self.oursql_kwargs)
        except oursql.PermissionsError as e:
            log.critical("ERROR %d: %s" % (e[0], e[1]))
            sys.exit(1)
        return connection

    def setup_database_schema(self, aggregates):
        # TODO(el): Track aggregates for changes
        log.debug("Checking database schema..")
        connection = self.connect()
        present = int(time())
        existing_datapoint_tables = [table for table in self.fetch_datapoint_tables(connection)]
        configured_datapoint_tables = []
        for aggregate in aggregates:
            datapoint_table = 'datapoint_%i' % aggregate['interval']
            configured_datapoint_tables.append(datapoint_table)
            if datapoint_table not in existing_datapoint_tables:
                log.info("Creating table %s.." % datapoint_table)
                ahead = present + aggregate['retention-period']
                self.create_datapoint_table(connection, aggregate['interval'], present, ahead)
            self._schedule_rotation(connection, datapoint_table)
        for tablename in [tablename for tablename in
                          existing_datapoint_tables if tablename not in
                          configured_datapoint_tables]:
            log.info("Dropping table %s.." % tablename)
            self.drop_table(connection, tablename)
        self._scheduler.add(RecurringJob("Inserting datapoints", 0, 10, self._insert_datapoints))
        self._scheduler.add(RecurringJob("Inserting performance data", 0, 10, self._insert_performance_data))
        self._scheduler.start()
        self._aggregates = aggregates
        self._datapoint_cache = DatapointCache(self, dict.fromkeys((aggregate['interval'] for aggregate in aggregates), {}))
        self._performance_data_cache = PerformanceDataCache(self)

    @synchronized(partition_lock)
    def _rotate_partition(self, tablename, partitionname, next_values_less_than):
        connection = self.connect()
        log.info("Dropping partition %d from %s.." % (partitionname, tablename))
        self.drop_partition(connection, tablename, partitionname)
        log.info("Adding partition %d to %s.." % (next_values_less_than, tablename))
        self.add_partition(connection, tablename, next_values_less_than)

    def _schedule_rotation(self, connection, tablename):
        partitions = [partition for partition in self.fetch_partitions(connection, tablename)]
        present, ahead = (int(float(partitions[0].encode('ascii', 'ignore'))),
                          int(float(partitions[1].encode('ascii', 'ignore'))))
        retention_period = ahead - present
        log.debug("%s: Detected retention period %d.." % (tablename, retention_period))
        now = int(time())
        if now - retention_period > ahead:
            self._rotate_partition(tablename, present, now)
            self._rotate_partition(tablename, ahead, now + retention_period)
            present = now
            ahead = now + retention_period
        elif now > ahead:
            self._rotate_partition(tablename, present, ahead + retention_period)
            present = ahead
            ahead += retention_period
        self._scheduler.add(RotationJob("Rotating %s" % tablename, present + retention_period - now, retention_period * 2,
                                        self._rotate_partition, tablename, present, retention_period * 2))
        self._scheduler.add(RotationJob("Rotating %s" % tablename, ahead + retention_period - now, retention_period * 2,
                                        self._rotate_partition, tablename, ahead, retention_period * 2))

    def drop_table(self, connection, tablename):
        connection.cursor().execute('DROP TABLE %s' % tablename, plain_query=True)

    def fetch_host(self, connection, name):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SELECT * FROM `host` WHERE `name` = ?', (name,))
        return cursor.fetchone()

    def insert_host(self, connection, name):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('INSERT INTO `host` (`id`, `name`) VALUES (?, ?)', (None, name))
        return self.fetch_host(connection, name)

    def fetch_service(self, connection, name):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SELECT * FROM `service` WHERE `name` = ?', (name,))
        return cursor.fetchone()

    def insert_service(self, connection, name):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('INSERT INTO `service` (`id`, `name`) VALUES (?, ?)', (None, name))
        return self.fetch_service(connection, name)

    def fetch_host_service(self, connection, host_id, service_id):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SELECT * FROM `hostservice` WHERE `host_id` = ? AND `service_id` = ?',
                       (host_id, service_id))
        return cursor.fetchone()

    def insert_host_service(self, connection, host_id, service_id):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('INSERT INTO `hostservice` (`id`, `host_id`, `service_id`) VALUES (?, ?, ?)',
                       (None, host_id, service_id))
        return self.fetch_host_service(connection, host_id, service_id)

    def fetch_plot(self, connection, host_service_id, name, uom):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SELECT * FROM `plot` WHERE `hostservice_id` = ? AND `name` = ? AND `unit` = ?',
                       (host_service_id, name, uom))
        return cursor.fetchone()

    def insert_plot(self, connection, host_service_id, name, uom):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('INSERT INTO `plot` (`id`, `hostservice_id`, `name`, `unit`) VALUES (?, ?, ?, ?)',
                       (None, host_service_id, name, uom))
        return self.fetch_plot(connection, host_service_id, name, uom)

    def fetch_datapoint_tables(self, connection):
        cursor = connection.cursor()
        cursor.execute('SHOW TABLES LIKE "datapoint_%"', plain_query=True)
        for row in cursor:
            yield row[0]

    def create_datapoint_table(self, connection, interval, present, ahead):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute(
            '''CREATE TABLE `datapoint_%d` (
                `plot_id` int(11) NOT NULL,
                `timestamp` int(11) NOT NULL,
                `min` decimal(20,5) NOT NULL,
                `max` decimal(20,5) NOT NULL,
                `avg` decimal(20,5) NOT NULL,
                `count` int(11) NOT NULL,
                PRIMARY KEY (`plot_id`, `timestamp`)
            ) ENGINE=InnoDB DEFAULT CHARSET=latin1
            PARTITION BY RANGE(timestamp) (
                PARTITION `%d` VALUES LESS THAN (%d) ENGINE = InnoDB,
                PARTITION `%d` VALUES LESS THAN (%d) ENGINE = InnoDB
            )''' % (interval, present, present, ahead, ahead))

    def fetch_datapoint(self, connection, interval, plot_id, timestamp):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SELECT * FROM  `datapoint_%d` WHERE `plot_id` = ? AND `timestamp` = ?' % interval,
            (plot_id, timestamp))
        return cursor.fetchone()

    @synchronized(datapoint_lock)
    def insert_datapoint(self, connection, plot_id, timestamp, value):
        for aggregate in self._aggregates:
            datapoint = self._datapoint_cache[aggregate['interval'], plot_id, timestamp - timestamp % aggregate['interval']]
            datapoint.update(value)

    @synchronized(partition_lock)
    @synchronized(datapoint_lock)
    def _insert_datapoints(self):
        connection = self.connect()
        for interval in self._datapoint_cache.iterkeys():
            cursor = connection.cursor(oursql.DictCursor)
            try:
                cursor.executemany(
                    '''INSERT INTO `datapoint_%d` (`plot_id`, `timestamp`, `avg`, `min`, `max`, `count`)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    avg = (avg + VALUES(avg)) / 2,
                    count = count + VALUES(count),
                    min = IF(min < VALUES(min), min, VALUES(min)),
                    max = IF(max > VALUES(max), max, VALUES(max))''' % interval,
                    self._datapoint_cache.generate_parambatch(interval))
            except:
                connection.rollback()
                raise
            else:
                connection.commit()
                self._datapoint_cache.clear_interval(interval)
            finally:
                cursor.close()

    @synchronized(performance_data_lock)
    def fetch_performance_data(self, connection, plot_id):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SELECT * FROM  `performance_data` WHERE `plot_id` = ?',
                       (plot_id,))
        return cursor

    @synchronized(performance_data_lock)
    def insert_performance_data(self, connection, plot_id, timestamp, **kwargs):
        performance_data = self._performance_data_cache[(plot_id, timestamp)]
        performance_data.update(**kwargs)

    @synchronized(performance_data_lock)
    def _insert_performance_data(self):
        connection = self.connect()
        cursor = connection.cursor(oursql.DictCursor)
        try:
            cursor.executemany(
                '''INSERT IGNORE INTO `performance_data` (
                `plot_id`, `timestamp`, `lower_limit`, `upper_limit`,
                `warn_lower`, `warn_upper`, `warn_type`, `crit_lower`, `crit_upper`, `crit_type`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                self._performance_data_cache.generate_parambatch())
        except:
            connection.rollback()
            raise
        else:
            connection.commit()
            self._performance_data_cache.commit()
        finally:
            cursor.close()

    def fetch_partitions(self, connection, tablename):
        cursor = connection.cursor()
        cursor.execute('''SELECT DISTINCT `partition_name`
                       FROM `information_schema`.`partitions`
                       WHERE `table_schema` = ? AND `table_name` = ?''',
                       (self.oursql_kwargs['db'], tablename))
        for row in cursor:
            yield row[0]

    def add_partition(self, connection, tablename, values_less_than):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('ALTER TABLE `%s` ADD PARTITION (PARTITION `%s` VALUES LESS THAN (%i))' %
                       (tablename, values_less_than, values_less_than))

    def drop_partition(self, connection, tablename, partitionname):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('ALTER TABLE `%s` DROP PARTITION `%s`' % (tablename, partitionname))

    def fetch_hosts(self, connection, host_pattern=None, limit=None, offset=None):
        condition = []
        params = []
        if host_pattern:
            condition.append('`name` LIKE ?')
            params.append(host_pattern)
        query = 'SELECT `name` AS `host_name`FROM `host`'
        countQuery = 'SELECT COUNT(`id`) FROM `host`'
        try:
            where = condition.pop()
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
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute(query, params)
        countCursor = connection.cursor()
        countCursor.execute(countQuery, params)
        return cursor, countCursor.fetchone()[0]

    def fetch_services(self, connection, host_pattern=None, service_pattern=None, limit=None, offset=None):
        condition = []
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
            where = condition.pop()
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
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute(query, params)
        countCursor = connection.cursor()
        countCursor.execute(countQuery, params)
        return cursor, countCursor.fetchone()[0]

    def fetch_plots(self, connection, host_pattern=None, service_pattern=None, parent_service_pattern=None, plot_pattern=None,
                    limit=None, offset=None):
        condition = []
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
        query = '''SELECT `p`.`name` AS `plot_name`, `h`.`name` AS `host_name`, `s`.`name` AS `service_name`,
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
            where = condition.pop()
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
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute(query, params)
        countCursor = connection.cursor()
        countCursor.execute(countQuery, params)
        return cursor, countCursor.fetchone()[0]

    def close(self):
        self._scheduler.stop()
        log.info("Inserting datapoints currently hold in memory..")
        self._insert_datapoints()
        log.info("Inserting performance data currently hold in memory..")
        self._insert_performance_data()
