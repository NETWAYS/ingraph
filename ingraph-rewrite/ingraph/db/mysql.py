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

from sqlalchemy import pool

__all__ = ['MySQLAPI']

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

    def connect(self):
        try:
            connection = oursql.connect(**self.oursql_kwargs)
        except oursql.PermissionsError as e:
            log.critical("ERROR %d: %s" % (e[0], e[1]))
            sys.exit(0)
        else:
            return connection

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
            return self.fetch_service(connection, name)
        finally:
            cursor.close()

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
            return self.fetch_host_service(connection, host_id, service_id)
        finally:
            cursor.close()

    def fetch_plot(self, connection, host_service_id, name):
        cursor = connection.cursor(oursql.DictCursor)
        cursor.execute('SELECT * FROM `plot` WHERE `hostservice_id` = ? AND `name` = ?',
                       (host_service_id, name))
        return cursor.fetchone()

    def insert_plot(self, connection, host_service_id, name):
        cursor = connection.cursor(oursql.DictCursor)
        try:
            cursor.execute('INSERT INTO `plot` (`id`, `hostservice_id`, `name`) VALUES (?, ?, ?)',
                           (None, host_service_id, name))
        except:
            connection.rollback()
            raise
        else:
            connection.commit()
            return self.fetch_plot(connection, host_service_id, name)
        finally:
            cursor.close()

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
            return True
        finally:
            cursor.close()

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
            return True
        finally:
            cursor.close()

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
            return True
        finally:
            cursor.close()

    def drop_partition(self, connection, tablename, partitionname):
        cursor = connection.cursor(oursql.DictCursor)
        try:
            cursor.execute('ALTER TABLE `%s` DROP PARTITION `%s`' % (tablename, partitionname))
        except:
            connection.rollback()
            raise
        else:
            connection.commit()
            return True
        finally:
            cursor.close()
