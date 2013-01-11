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

__all__ = ['MySQLDb']

log = logging.getLogger(__name__)


class MySQLDb(object):

    def __init__(self, user, passwd, host, port, db):
        oursql_kwargs = {
            'user': user,
            'host': host,
            'db': db
        }
        if port:
            oursql_kwargs['port'] = port
        if passwd:
            oursql_kwargs['passwd'] = passwd
        self._db = db
        try:
            self._conn = oursql.connect(**oursql_kwargs)
        except oursql.PermissionsError as e:
            log.critical("ERROR %d: %s" % (e[0], e[1]))
            sys.exit(0)
        self._curs = self._conn.cursor(oursql.DictCursor)

    def close(self):
        self._curs.close()
        return self._conn.close()

    def fetch_host(self, name):
        self._curs.execute('SELECT * FROM `host` WHERE `name` = ?', (name,))
        res = self._curs.fetchall()
        try:
            res = res[0]
        except KeyError:
            res = None
        finally:
            return res

    def insert_host(self, name):
        try:
            self._curs.execute('INSERT INTO `host` (`id`, `name`) VALUES (?, ?)', (None, name))
        except:
            self._conn.rollback()
            raise
        else:
            self._conn.commit()
        return self.fetch_host(name)

    def fetch_service(self, name):
        self._curs.execute('SELECT * FROM `service` WHERE `name` = ?', (name,))
        res = self._curs.fetchall()
        try:
            res = res[0]
        except KeyError:
            res = None
        finally:
            return res

    def insert_service(self, name):
        try:
            self._curs.execute('INSERT INTO `service` (`id`, `name`) VALUES (?, ?)', (None, name))
        except:
            self._conn.rollback()
            raise
        else:
            self._conn.commit()
        return self.fetch_service(name)

    def fetch_host_service(self, host_id, service_id):
        self._curs.execute('SELECT * FROM `hostservice` WHERE `host_id` = ? AND `service_id` = ?',
                           (host_id, service_id))
        res = self._curs.fetchall()
        try:
            res = res[0]
        except KeyError:
            res = None
        finally:
            return res

    def insert_host_service(self, host_id, service_id):
        try:
            self._curs.execute('INSERT INTO `hostservice` (`id`, `host_id`, `service_id`) VALUES (?, ?, ?)',
                               (None, host_id, service_id))
        except:
            self._conn.rollback()
            raise
        else:
            self._conn.commit()
        return self.fetch_host_service(host_id, service_id)

    def fetch_plot(self, host_service_id, name):
        self._curs.execute('SELECT * FROM `plot` WHERE `hostservice_id` = ? AND `name` = ?',
            (host_service_id, name))
        res = self._curs.fetchall()
        try:
            res = res[0]
        except KeyError:
            res = None
        finally:
            return res

    def insert_plot(self, host_service_id, name):
        try:
            self._curs.execute('INSERT INTO `plot` (`id`, `hostservice_id`, `name`) VALUES (?, ?, ?)',
                (None, host_service_id, name))
        except:
            self._conn.rollback()
            raise
        else:
            self._conn.commit()
        return self.fetch_plot(host_service_id, name)

    def fetch_datapoint_tables(self):
        self._curs.execute('SHOW TABLES LIKE "datapoint%"', plain_query=True)
        res = []
        for table in self._curs:
            res.extend(table.values())
        return res

    def create_datapoint_table(self, tablename, retention_period):
        now = time()
        next = now + retention_period
        try:
            self._curs.execute("""CREATE TABLE `%s` (
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
            )""" % (tablename, now, now, next, next))
        except:
            self._conn.rollback()
            raise
        else:
            self._conn.commit()
        return True

    def insert_datapoint(self, tablename, params):
        # TODO(el): Aggregate in RAM
        try:
            self._curs.execute("""INSERT INTO `%s` (`plot_id`, `timestamp`, `min`, `max`, `avg`, `count`)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE avg = count * (avg / (count + 1)) + VALUES(avg) / (count + 1),
                        count = count + 1,
                        min = IF(min < VALUES(min), min, VALUES(min)),
                        max = IF(max > VALUES(max), max, VALUES(max))""" % tablename, params)
        except:
            self._conn.rollback()
            raise
        else:
            self._conn.commit()
        return True

    def fetch_partitions(self, tablename):
        self._curs.execute('SELECT DISTINCT `partition_name` FROM `information_schema`.`partitions` '
                           'WHERE `table_schema` = ? AND `table_name` = ?', (self._db, tablename))
        return self._curs.fetchall()

    def add_partition(self, tablename, values_less_than, absolute=False):
        if not absolute:
            values_less_than = time() + values_less_than
        try:
            self._curs.execute("""ALTER TABLE `%s` ADD PARTITION (PARTITION `%s` VALUES LESS THAN (%i))""" % (tablename, values_less_than, values_less_than))
        except:
            self._conn.rollback()
            raise
        else:
            self._conn.commit()
        return True

    def drop_partition(self, tablename, partitionname):
        try:
            self._curs.execute("""ALTER TABLE `%s` DROP PARTITION %s""" % (tablename, partitionname))
        except:
            self._conn.rollback()
            raise
        else:
            self._conn.commit()
        return True
