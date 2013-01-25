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

import oursql
import sys
import logging
from time import time
from threading import Lock

from sqlalchemy import pool

from ingraph.scheduler import Scheduler, synchronized

__all__ = ['MySQLAPI']

lock = Lock()
log = logging.getLogger(__name__)


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
            sys.exit(0)
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
        self._scheduler.start()

    # Prevent 'Cannot remove all partitions, use DROP TABLE instead'
    @synchronized(lock)
    def _rotate_partition(self, tablename, partitionname, next_values_less_than):
        log.debug("Dropping partition %d from %s.." % (partitionname, tablename))
        self.drop_partition(self.connect(), tablename, partitionname)
        log.debug("Adding partition %d to %s.." % (next_values_less_than, tablename))
        self.add_partition(self.connect(), tablename, next_values_less_than)

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
            present = ahead
            ahead = now + retention_period
        elif now > ahead:
            self._rotate_partition(tablename, present, ahead + retention_period)
            present = ahead
            ahead += retention_period
        self._scheduler.add("Rotate first partition of %s" % tablename, now - present, retention_period,
            self._rotate_partition, tablename, present, retention_period * 2)
        self._scheduler.add("Rotate second partition of %s" % tablename, ahead + retention_period - now, retention_period,
            self._rotate_partition, tablename, ahead, retention_period * 2)

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
        try:
            cursor.execute('INSERT INTO `service` (`id`, `name`) VALUES (?, ?)', (None, name))
        except:
            connection.rollback()
            raise
        else:
            connection.commit()
        finally:
            cursor.close()
        return self.fetch_service(connection, name)

    def fetch_host_service(self, connection, host_id, service_id):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SELECT * FROM `hostservice` WHERE `host_id` = ? AND `service_id` = ?',
                       (host_id, service_id))
        return cursor.fetchone()

    def insert_host_service(self, connection, host_id, service_id):
        cursor = connection.cursor(oursql.DictCursor)
        try:
            cursor.execute('INSERT INTO `hostservice` (`id`, `host_id`, `service_id`) VALUES (?, ?, ?)',
                           (None, host_id, service_id))
        except:
            connection.rollback()
            raise
        else:
            connection.commit()
        finally:
            cursor.close()
        return self.fetch_host_service(connection, host_id, service_id)

    def fetch_plot(self, connection, host_service_id, name, uom):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SELECT * FROM `plot` WHERE `hostservice_id` = ? AND `name` = ? AND `unit` = ?',
                       (host_service_id, name, uom))
        return cursor.fetchone()

    def insert_plot(self, connection, host_service_id, name, uom):
        cursor = connection.cursor(oursql.DictCursor)
        try:
            cursor.execute('INSERT INTO `plot` (`id`, `hostservice_id`, `name`, `unit`) VALUES (?, ?, ?, ?)',
                           (None, host_service_id, name, uom    ))
        except:
            connection.rollback()
            raise
        else:
            connection.commit()
        finally:
            cursor.close()
        return self.fetch_plot(connection, host_service_id, name, uom)

    def fetch_datapoint_tables(self, connection):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SHOW TABLES LIKE "datapoint%"', plain_query=True)
        res = []
        for table in cursor:
            res.extend(table.values())
        return res

    def create_datapoint_table(self, connection, tablename, retention_period):
        cursor = connection.cursor(oursql.DictCursor)
        now = time()
        next = now + retention_period
        try:
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
        except:
            connection.rollback()
            raise
        else:
            connection.commit()
        finally:
            cursor.close()
        return True

    def insert_datapoint(self, connection, tablename, params):
        cursor = connection.cursor(oursql.DictCursor)
        # TODO(el): Aggregate in RAM
        try:
            cursor.execute(
                '''INSERT INTO `%s` (`plot_id`, `timestamp`, `min`, `max`, `avg`, `count`)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                avg = count * (avg / (count + 1)) + VALUES(avg) / (count + 1),
                count = count + 1,
                min = IF(min < VALUES(min), min, VALUES(min)),
                max = IF(max > VALUES(max), max, VALUES(max))''' % tablename,
                params)
        except:
            connection.rollback()
            raise
        else:
            connection.commit()
        finally:
            cursor.close()
        return True

    def fetch_partitions(self, connection, tablename):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('''SELECT DISTINCT `partition_name` FROM `information_schema`.`partitions`
                       WHERE `table_schema` = ? AND `table_name` = ?''',
                       (self.oursql_kwargs['db'], tablename))
        return cursor.fetchall()

    def add_partition(self, connection, tablename, values_less_than):
        cursor = connection.cursor(oursql.DictCursor)
        try:
            cursor.execute('ALTER TABLE `%s` ADD PARTITION (PARTITION `%s` VALUES LESS THAN (%i))' %
                           (tablename, values_less_than, values_less_than))
        except:
            connection.rollback()
            raise
        else:
            connection.commit()
        finally:
            cursor.close()
        return True

    def drop_partition(self, connection, tablename, partitionname):
        cursor = connection.cursor(oursql.DictCursor)
        try:
            cursor.execute('ALTER TABLE `%s` DROP PARTITION `%s`' % (tablename, partitionname))
        except:
            connection.rollback()
            raise
        else:
            connection.commit()
        finally:
            cursor.close()
        return True

    def close(self):
        self._scheduler.stop()
