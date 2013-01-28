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
from threading import Lock, Event
from decimal import Decimal

from sqlalchemy import pool

from ingraph.scheduler import Scheduler, synchronized, RotationJob, RecurringJob

__all__ = ['MySQLAPI']

log = logging.getLogger(__name__)
partition_lock = Lock()
datapoint_lock = Lock()


class Datapoint(object):

    __slots__ = ('min', 'max', 'avg', 'count')

    def __init__(self, avg=0, min=None, max=None, count=0):
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

    def __init__(self, dbapi, aggregates):
        self.dbapi = dbapi
        dict.__init__(self, dict.fromkeys((aggregate['interval'] for aggregate in aggregates), {}))

    def __getitem__(self, key):
        interval, plot_id, timestamp = key
        subcache = dict.__getitem__(self, interval)
        try:
            item = subcache[(plot_id, timestamp)]
        except KeyError:
            interval, plot_id, timestamp = key
            datapoint = self.dbapi.fetch_datapoint(self.dbapi.connect(), interval, plot_id, timestamp)
            if datapoint:
                item = Datapoint(avg=datapoint['avg'], min=datapoint['min'], max=datapoint['max'],
                                 count=datapoint['count'])
            else:
                item = Datapoint()
            subcache[(plot_id, timestamp)] = item
        return item

    def generate_parambatch(self, interval):
        interval_cache = dict.__getitem__(self, interval)
        for key, datapoint in sorted(interval_cache.iteritems()):
            plot_id, timestamp = key
            yield plot_id, timestamp, datapoint.avg, datapoint.min, datapoint.max, datapoint.count

    def clear_interval(self, interval):
        dict.__getitem__(self, interval).clear()


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
        self._partitions = {}

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
        existing_datapoint_tables = self.fetch_datapoint_tables(connection)
        configured_datapoint_tables = []
        for aggregate in aggregates:
            datapoint_table = 'datapoint_%i' % aggregate['interval']
            configured_datapoint_tables.append(datapoint_table)
            if datapoint_table not in existing_datapoint_tables:
                log.info("Creating table %s.." % datapoint_table)
                self.create_datapoint_table(connection, datapoint_table, aggregate['retention-period'])
            self._schedule_rotation(connection, datapoint_table)
            # TODO(el): How to maintain no longer active tables
        self._scheduler.add(RecurringJob("Inserting datapoints", 0, 10, self._insert_datapoints))
        self._scheduler.start()
        self._aggregates = aggregates
        self._datapoint_cache = DatapointCache(self, aggregates)

    @synchronized(partition_lock)
    def _rotate_partition(self, tablename, partitionname, next_values_less_than):
        connection = self.connect()
        log.debug("Dropping partition %d from %s.." % (partitionname, tablename))
        self.drop_partition(connection, tablename, partitionname)
        log.debug("Adding partition %d to %s.." % (next_values_less_than, tablename))
        self.add_partition(connection, tablename, next_values_less_than)

    def _schedule_rotation(self, connection, tablename):
        partitions = self.fetch_partitions(connection, tablename)
        present, ahead = (int(float(partitions[0]['partition_name'].encode('ascii', 'ignore'))),
                          int(float(partitions[1]['partition_name'].encode('ascii', 'ignore'))))
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
        self._scheduler.add(RotationJob("Deleting datapoints which exceed their lead time", present + retention_period - now, retention_period * 2,
                                        self._rotate_partition, tablename, present, retention_period * 2))
        self._scheduler.add(RotationJob("Deleting datapoints which exceed their lead time", ahead + retention_period - now, retention_period * 2,
                                        self._rotate_partition, tablename, ahead, retention_period * 2))

    def fetch_host(self, connection, name):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SELECT * FROM `host` WHERE `name` = ?', (name,))
        return cursor.fetchone()

    def insert_host(self, connection, name):
        cursor = connection.cursor(oursql.DictCursor)
        try:
            cursor.execute('INSERT INTO `host` (`id`, `name`) VALUES (?, ?)', (None, name))
        except:
            connection.rollback()
            raise
        else:
            connection.commit()
        finally:
            cursor.close()
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
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SHOW TABLES LIKE "datapoint%"', plain_query=True)
        res = []
        for table in cursor:
            res.extend(table.values())
        return res

    def create_datapoint_table(self, connection, tablename, retention_period):
        now = time()
        next = now + retention_period
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute(
            '''CREATE TABLE `%s` (
                `plot_id` int(11) NOT NULL,
                `timestamp` int(11) NOT NULL,
                `min` decimal(20,5) NOT NULL,
                `max` decimal(20,5) NOT NULL,
                `avg` decimal(20,5) NOT NULL,
                `count` int(11) NOT NULL,
                PRIMARY KEY (`plot_id`, `timestamp`)
            ) ENGINE=InnoDB DEFAULT CHARSET=latin1
            PARTITION BY RANGE(timestamp) (
                PARTITION `%i` VALUES LESS THAN (%i) ENGINE = InnoDB,
                PARTITION `%i` VALUES LESS THAN (%i) ENGINE = InnoDB
            )''' % (tablename, now, now, next, next))

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

    @synchronized(datapoint_lock)
    def insert_datapoint(self, connection, plot_id, timestamp, value):
        for aggregate in self._aggregates:
            params = (plot_id,
                      timestamp - timestamp % aggregate['interval'],
                      value, value, value, 1)
            datapoint = self._datapoint_cache[aggregate['interval'], plot_id, timestamp % aggregate['interval']]
            datapoint.update(value)

    def fetch_datapoint(self, connection, interval, plot_id, timestamp):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SELECT * FROM  `datapoint_%d` WHERE `plot_id` = ? AND `timestamp` = ?' % interval,
                       (plot_id, timestamp))
        return cursor.fetchone()

    def fetch_partitions(self, connection, tablename):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('''SELECT DISTINCT `partition_name` FROM `information_schema`.`partitions`
                       WHERE `table_schema` = ? AND `table_name` = ?''',
                       (self.oursql_kwargs['db'], tablename))
        return cursor.fetchall()

    def add_partition(self, connection, tablename, values_less_than):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('ALTER TABLE `%s` ADD PARTITION (PARTITION `%s` VALUES LESS THAN (%i))' %
                       (tablename, values_less_than, values_less_than))

    def drop_partition(self, connection, tablename, partitionname):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('ALTER TABLE `%s` DROP PARTITION `%s`' % (tablename, partitionname))

    def close(self):
        self._scheduler.stop()
        log.info("Inserting datapoints currently hold in memory..")
        self._insert_datapoints()
