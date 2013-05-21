# inGraph (https://www.netways.org/projects/ingraph)
# Copyright (C) 2011-2012 NETWAYS GmbH
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

try:
    import pkg_resources
    pkg_resources.require('SQLAlchemy >= 0.6.3')
except ImportError:
    pass

from sqlalchemy import MetaData, UniqueConstraint, Table, Column, Integer, \
    Boolean, Numeric, String, Enum, Sequence, ForeignKey, Index, create_engine, \
    and_, or_, tuple_, DDL
try:
    from sqlalchemy import event
except ImportError:
    event = None
from sqlalchemy.sql import literal, select, between, func
from sqlalchemy.interfaces import PoolListener
from time import time
from weakref import WeakValueDictionary
from OrderedDict import OrderedDict
from decimal import Decimal
from itertools import chain, imap
from cStringIO import StringIO

dbload_min_timestamp = None
dbload_max_timestamp = None
MAX_DECIMAL = Decimal('9'*15 + '.' + '9'*5)
TO_DECIMAL = lambda f: Decimal('%.5f' % (f,))

'''
Base class for all DB model classes.
'''
class ModelBase(object):
    '''
    a dictionary containing weak references to all active
    objects (grouped by class) which have an identity
    (i.e. id column is not NULL) - this is used by get() to
    retrieve existing instances
    '''
    active_objects = dict()

    def __del__(self):
        # not saving a modified object is a bug :)
        assert not self.modified()

    '''
    "activates" an object for use in the caching system; this should be
    called once the identity for an object is known ('id' column)
    '''
    def activate(self):
        assert self.identity() != None

        cls = self.__class__

        if not cls in ModelBase.active_objects:
            ModelBase.active_objects[cls] = WeakValueDictionary()

        ModelBase.active_objects[cls][self.identity()] = self

    '''
    retrieve an instance from the active_objects dictionary, returns None
    if no matching instance was found
    '''
    def get(cls, id, **kwargs):
        if not cls in ModelBase.active_objects or not id in ModelBase.active_objects[cls]:
            return None
        else:
            return ModelBase.active_objects[cls][id]

    get = classmethod(get)

    '''
    returns an object's identity (typically the value of the 'id' column)
    '''
    def identity(self):
        return self.id

    '''
    returns whether the object was modified since the last call to save()
    '''
    def modified(self):
        return self.identity() == None

    '''
    returns whether the object was saved; this may return False even when modified()
    is True due to delayed saving
    '''
    def shouldSave(self):
        return True

    '''
    persists the object in the DB
    '''
    def save(self, conn):
        pass

metadata = MetaData()

host = Table('host', metadata,
    Column('id', Integer, Sequence('host_id_seq'), nullable=False, primary_key=True),
    Column('name', String(128), nullable=False, unique=True),

    mysql_engine='InnoDB'
)

class Host(ModelBase):
    def __init__(self, name):
        self.id = None
        self.name = name

    def save(self, conn):
        if self.id == None:
            ins = host.insert().values(name=self.name)
            result = conn.execute(ins)
            self.id = result.inserted_primary_key[0]
            self.activate()
        else:
            # TODO: should probably just throw an exception instead -
            # as changing a host's name doesn't make any sense
            upd = host.update().where(host.c.id==self.id).values(name=self.name)
            conn.execute(upd)

    def getByID(conn, id):
        obj = Host.get(id)

        if obj == None:
            sel = host.select().where(host.c.id==id)
            res = conn.execute(sel)
            row = res.fetchone()

            assert row != None

            obj = Host(row[host.c.name])
            obj.id = row[host.c.id]
            obj.activate()

        return obj

    getByID = staticmethod(getByID)

    def getByName(conn, name):
        sel = host.select().where(host.c.name==name)
        result = conn.execute(sel)
        row = result.fetchone()

        if row == None:
            return None

        obj = Host.get(row[host.c.id])

        if obj == None:
            obj = Host(name)
            obj.id = row[host.c.id]
            obj.activate()

        return obj

    getByName = staticmethod(getByName)

    def getByPattern(conn, sql_filter, limit=None, offset=None):
        sel = select([func.count()]).select_from(host).where(host.c.name.like(sql_filter))
        total = conn.execute(sel).scalar()

        if limit == None and offset == None:
            sel = host.select()
        else:
            sel = host.select(limit=limit, offset=offset)

        sel = sel.where(host.c.name.like(sql_filter)).order_by(host.c.name)
        result = conn.execute(sel)

        objs = []

        for row in result:
            obj = Host.get(row[host.c.id])

            if obj == None:
                obj = Host(row[host.c.name])
                obj.id = row[host.c.id]
                obj.activate()

            objs.append(obj)

        return {'hosts': objs, 'total': total}

    getByPattern = staticmethod(getByPattern)

    def getAll(conn):
        sel = host.select()
        result = conn.execute(sel)

        objs = []

        for row in result:
            obj = Host.get(row[host.c.id])

            if obj == None:
                obj = Host(row[host.c.name])
                obj.id = row[host.c.id]
                obj.activate()

            objs.append(obj)

        return objs

    getAll = staticmethod(getAll)

service = Table('service', metadata,
    Column('id', Integer, Sequence('service_id_seq'), nullable=False, primary_key=True),
    Column('name', String(128), nullable=False, unique=True),

    mysql_engine='InnoDB'
)

class Service(ModelBase):
    def __init__(self, name):
        self.id = None
        self.name = name

    def save(self, conn):
        if self.id == None:
            ins = service.insert().values(name=self.name)
            result = conn.execute(ins)
            self.id = result.inserted_primary_key[0]
            self.activate()
        else:
            # TODO: should probably just throw an exception instead -
            # as changing a service's name doesn't make any sense
            upd = service.update().where(service.c.id==self.id).values(name=self.name)
            conn.execute(upd)

    def getByID(conn, id):
        obj = Service.get(id)

        if obj == None:
            sel = service.select().where(service.c.id==id)
            res = conn.execute(sel)
            row = res.fetchone()

            assert row != None

            obj = Service(row[service.c.name])
            obj.id = row[service.c.id]
            obj.activate()

        return obj

    getByID = staticmethod(getByID)

    def getByName(conn, name, parent_service=None):
        sel = service.select().where(service.c.name==name)
        result = conn.execute(sel)
        row = result.fetchone()

        if row == None:
            return None

        obj = Service.get(row[service.c.id])

        if obj == None:
            obj = Service(name)
            obj.id = row[service.c.id]
            obj.activate()

        return obj

    getByName = staticmethod(getByName)

    def getByPattern(conn, pattern):
        sel = service.select().where(service.c.name.like(pattern))
        result = conn.execute(sel)

        objs = []

        for row in result:
            obj = Service.get(row[service.c.id])

            if obj == None:
                obj = Service(row[service.c.name])
                obj.id = row[service.c.id]
                obj.activate()

            objs.append(obj)

        return objs

    getByPattern = staticmethod(getByPattern)

hostservice = Table('hostservice', metadata,
    Column('id', Integer, Sequence('hostservice_id_seq'), nullable=False, primary_key=True),
    Column('host_id', Integer, ForeignKey('host.id'), nullable=False),
    Column('service_id', Integer, ForeignKey('service.id'), nullable=False),
    Column('parent_hostservice_id', Integer, ForeignKey('hostservice.id')),
    Column('check_command', String(128), nullable=True),

    UniqueConstraint('host_id', 'service_id', 'parent_hostservice_id', name='uc_hs_1'),

    mysql_engine='InnoDB'
)

class HostService(ModelBase):
    def __init__(self, host, service, parent_hostservice, check_command=None):
        self.id = None
        self.host = host
        self.service = service
        self.parent_hostservice = parent_hostservice
        self.check_command = check_command

    def save(self, conn):
        if self.id == None:
            if self.host.id == None:
                self.host.save(conn)
                assert self.host.id != None

            if self.service.id == None:
                self.service.save(conn)
                assert self.service.id != None

            if self.parent_hostservice != None:
                parent_hostservice_id = self.parent_hostservice.id
            else:
                parent_hostservice_id = None

            ins = hostservice.insert().values(host_id=self.host.id, service_id=self.service.id, \
                                              parent_hostservice_id=parent_hostservice_id)
            result = conn.execute(ins)
            self.id = result.inserted_primary_key[0]
            self.activate()
        else:
            # TODO: should probably just throw an exception instead -
            # as changing a service's host/service ids doesn't make any sense
            upd = hostservice.update().where(hostservice.c.id==self.id).values(host_id=self.host.id, \
                                                                               service_id=self.service.id, \
                                                                               parent_hostservice_id=self.parent_hostservice.id)
            conn.execute(upd)

    @staticmethod
    def getByID(conn, id, row=None):
        hostservice_ = HostService.get(id)
        if not hostservice_:
            if not row:
                row = conn.execute(
                    hostservice.select().where(hostservice.c.id == id)).fetchone()
            host = Host.getByID(conn, row[hostservice.c.host_id])
            service = Service.getByID(conn, row[hostservice.c.service_id])
            if row[hostservice.c.parent_hostservice_id] :
                parent_hostservice = HostService.getByID(
                    conn, row[hostservice.c.parent_hostservice_id])
            else:
                parent_hostservice = None
            hostservice_ = HostService(host, service, parent_hostservice)
            hostservice_.id = row[hostservice.c.id]
            hostservice_.activate()
        return hostservice_

    def getByHostAndService(conn, host, service, parent_hostservice):
        cond = hostservice.c.host_id==host.id

        if service != None:
            cond = and_(cond, hostservice.c.service_id==service.id)

        if parent_hostservice != None:
            cond = and_(cond, hostservice.c.parent_hostservice_id==parent_hostservice.id)

        sel = hostservice.select().where(cond)
        result = conn.execute(sel)

        objs = []

        for row in result:
            obj = HostService.get(row[hostservice.c.id])

            if obj == None:
                if service == None:
                    svc = Service.getByID(conn, row[hostservice.c.service_id])
                else:
                    svc = service

                if parent_hostservice == None and row[hostservice.c.parent_hostservice_id] != None:
                    phs = HostService.getByID(conn, row[hostservice.c.parent_hostservice_id])
                else:
                    phs = parent_hostservice

                obj = HostService(host, svc, phs)
                obj.id = row[hostservice.c.id]
                obj.activate()

            objs.append(obj)

        return objs

    getByHostAndService = staticmethod(getByHostAndService)

    def getByHostAndServicePattern(conn, host_name_pattern=None,
                                   service_name_pattern=None,
                                   parent_hostservice_name_pattern=None,
                                   limit=None, offset=None):
        if not host_name_pattern:
            host_name_pattern = '%'
            if not service_name_pattern:
                service_name_pattern = '%'
        elif not service_name_pattern:
            service_name_pattern = '' 
        if not parent_hostservice_name_pattern:
            countQuery = select(
                [func.count()],
                from_obj=[hostservice.join(service).join(host)]).where(
                    and_(host.c.name.like(host_name_pattern),
                         service.c.name.like(service_name_pattern)))
            selectQuery = hostservice.select(
                from_obj=[hostservice.join(service).join(host)],
                limit=limit, offset=offset).where(
                    and_(host.c.name.like(host_name_pattern),
                         service.c.name.like(service_name_pattern)))
        else:
            parent_hostservice_ids = [row[hostservice.c.id] for row in
                                      conn.execute(select(
                                          [hostservice.c.id],
                                          from_obj=[hostservice.join(service).join(host)]).where(
                                              and_(host.c.name.like(host_name_pattern),
                                                   service.c.name.like(parent_hostservice_name_pattern))))]
            countQuery = select(
                [func.count()],
                from_obj=[hostservice.join(service)]).where(
                    and_(service.c.name.like(service_name_pattern),
                         hostservice.c.parent_hostservice_id.in_(parent_hostservice_ids)))
            selectQuery = hostservice.select(
                from_obj=[hostservice.join(service)],
                limit=limit, offset=offset).where(
                    and_(service.c.name.like(service_name_pattern),
                         hostservice.c.parent_hostservice_id.in_(parent_hostservice_ids)))
        return {
                'services': [HostService.getByID(conn,
                                                 row[hostservice.c.id], row) for
                             row in conn.execute(selectQuery)],
                'total': conn.execute(countQuery).scalar()
        }

    getByHostAndServicePattern = staticmethod(getByHostAndServicePattern)

    def getByHost(conn, host):
        sel = hostservice.select().where(hostservice.c.host_id==host.id)
        result = conn.execute(sel)

        objs = []

        for row in result:
            obj = HostService.get(row[hostservice.c.id])

            if obj == None:
                service_obj = Service.getByID(conn, row[hostservice.c.service_id])

                parent_hostservice_id = row[hostservice.c.parent_hostservice_id]

                if parent_hostservice_id != None:
                    parent_hostservice = HostService.getByID(conn, parent_hostservice_id)
                else:
                    parent_hostservice = None
                obj = HostService(host, service_obj, parent_hostservice)
                obj.id = row[hostservice.c.id]
                obj.activate()

            objs.append(obj)

        return objs

    getByHost = staticmethod(getByHost)

plot = Table('plot', metadata,
    Column('id', Integer, Sequence('plot_id_seq'), nullable=False, primary_key=True),
    Column('hostservice_id', Integer, ForeignKey('hostservice.id'), nullable=False),
    Column('name', String(128), nullable=False),
    Column('unit', String(16)),

    UniqueConstraint('hostservice_id', 'name', name='uc_plot_1'),

    mysql_engine='InnoDB'
)

class Plot(ModelBase):
    def __init__(self, hostservice, name):
        self.id = None
        self.name = name
        self.hostservice = hostservice
        self.unit = None

        self.current_timestamp = None
        self.current_interval = None
        self.cache_tfs = None
        self.cache_dps = None

        self.last_value = 0
        self.last_update = None

    '''
    Calculates the per-second rate for a counter. Rather than storing the raw
    values inGraph stores rates for counter values.
    '''
    def _calculateRateHelper(last_timestamp, timestamp, last_value, value):
        if last_timestamp == None or last_timestamp >= timestamp:
            return None

        if last_value > value:
            # We're checking for possible overflows by comparing the last raw value with the current
            # raw value. If the last value is greater than 80% of the 32 or 64 bit boundary and the
            # current value is below 20% of the matching boundary chances are it was an overflow
            # rather than a counter reset. However, if the new value is 0 we assume it's a counter
            # reset anyway.
            if (value != 0 and last_value > 0.8 * 2**32 and value < 0.2 * 2**32):
                # 32bit counter overflow
                print("32-bit Counter overflow detected: last_value: %d, value: %d" % (last_value, value))
                last_value = -(2**32 - last_value)
            elif (value != 0 and last_value > 0.8 * 2**64 and value < 0.2 * 2**64):
                # 64bit counter overflow
                print("64-bit Counter overflow detected: last_value: %d, value: %d" % (last_value, value))
                last_value = -(2**64 - last_value)
            else:
                # ordinary counter reset
                print("Counter reset detected: last_value: %d, value: %d" % (last_value, value))
                last_value = 0

        return (value - last_value) / (timestamp - last_timestamp)

    _calculateRateHelper = staticmethod(_calculateRateHelper)

    def buildUpdateQueries(self, conn, timestamp, unit, value, min_, max_, lower_limit, upper_limit,
                           warn_lower, warn_upper, warn_type, crit_lower, crit_upper, crit_type):

        tfs = TimeFrame.getAll(conn)

        # no timeframes -> nothing to do here
        if len(tfs) == 0:
            return []

        value = float(value)

        if lower_limit != None:
            lower_limit = float(lower_limit)
            if value < lower_limit:
                value = lower_limit
            lower_limit = min(TO_DECIMAL(lower_limit), MAX_DECIMAL)

        if upper_limit != None:
            upper_limit = float(upper_limit)
            # some plugins return lower_limit==upper_limit,
            # lets just ignore that non-sense...
            if value > upper_limit and lower_limit != upper_limit:
                value = upper_limit
            upper_limit = min(TO_DECIMAL(upper_limit), MAX_DECIMAL)
        value_raw = value

        if unit == 'counter':
            value = Plot._calculateRateHelper(self.last_update, timestamp, self.last_value, value)
            min_ = None
            max_ = None

        self.last_value = value_raw
        self.last_update = timestamp

        # _calculateRateHelper returns None if it can't figure out the rate (yet)
        if value == None:
            return []

        value = min(TO_DECIMAL(value), MAX_DECIMAL)

        if min_ == None or min_ > value:
            min_ = value
        if max_ == None or max_ < value:
            max_ = value

        if warn_lower != None:
            warn_lower = min(TO_DECIMAL(warn_lower), MAX_DECIMAL)
        if warn_upper != None:
            warn_upper = min(TO_DECIMAL(warn_upper), MAX_DECIMAL)
        if crit_lower != None:
            crit_lower = min(TO_DECIMAL(crit_lower), MAX_DECIMAL)
        if crit_upper != None:
            crit_upper = min(TO_DECIMAL(crit_upper), MAX_DECIMAL)

        now = time()

        queries = []
        for tf in tfs:
            if tf.retention_period != None and now - timestamp > tf.retention_period:
                continue

            values = {
                'plot_id': self.id,
                'timeframe_id': tf.id,
                'timestamp': int(timestamp - timestamp % tf.interval),
                'min': min_,
                'max': max_,
                'avg': value,
                'count': 1,
                'unit': unit,
                'lower_limit': lower_limit,
                'upper_limit': upper_limit,
                'warn_lower': warn_lower,
                'warn_upper': warn_upper,
                'warn_type': warn_type,
                'crit_lower': crit_lower,
                'crit_upper': crit_upper,
                'crit_type': crit_type
            }

            queries.append(values)

        if self.unit == None:
            self.unit = unit
            self.save(conn)

        return queries

    @staticmethod
    def executeUpdateQueries(conn, queries):
        if not queries:
            return
        # queries[:] = aggregate_queries(queries)
        if conn.dialect.name == 'mysql':
            values = ('(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s),' * len(queries))[:-1]
            trans = conn.begin()
            try:
                conn.execute("""INSERT INTO datapoint VALUES %s
                             ON DUPLICATE KEY UPDATE
                             avg = (count * avg + VALUES(avg)) / (count + 1),
                             count = count + 1,
                             min = IF(min < VALUES(min), min, VALUES(min)),
                             max = IF(max > VALUES(max), max, VALUES(max))""" % (values,),
                             tuple(chain(*imap(lambda q: (q[c.name] for c in datapoint.c), queries))))
                trans.commit()
            except:
                trans.rollback()
                raise
        elif conn.dialect.name == 'postgresql':
            buff = StringIO()
            for query in queries:
                print >>buff, "\t".join(imap(str, tuple(query[c.name] for c in datapoint.c)))
            buff.seek(0)
            trans = conn.begin()
            cursor = conn.connection.cursor()
            try:
                # Psycopg DB API extension
                cursor.copy_from(buff, datapoint.name, null='None')
                trans.commit()
            except:
                trans.rollback()
                raise
            del buff # Del and recreate - faster than reset and truncate
        else:
            raise Exception("Database dialect %s not supported." % (conn.dialect.name,))

    @staticmethod
    def getByID(conn, id, row=None):
        plot_ = Plot.get(id)
        if not plot_:
            if not row:
                row = conn.execute(
                    plot_.select().where(plot.c.id == id)).fetchone()
            plot_ = Plot(HostService.getByID(conn, row[plot.c.hostservice_id]),
                         row[plot.c.name])
            plot_.id = row[plot.c.id]
            plot_.unit = row[plot.c.unit]
            plot_.activate()
        return plot_

    def getByHostServiceAndName(conn, hostservice, name):
        cond = plot.c.hostservice_id==hostservice.id

        if name != None and name != '':
            cond = and_(cond, plot.c.name==name)

        sel = plot.select().where(cond)
        result = conn.execute(sel)

        objs = []

        for row in result:
            obj = Plot.get(row[plot.c.id])

            if obj == None:
                obj = Plot(hostservice, row[plot.c.name])
                obj.id = row[plot.c.id]
                obj.unit = row[plot.c.unit]
                obj.activate()

            objs.append(obj)

        return objs

    getByHostServiceAndName = staticmethod(getByHostServiceAndName)

    @staticmethod
    def getByHostServiceIdsAndName(conn, ids, name=None, limit=None,
                                   offset=None):
        whereCondition = plot.c.hostservice_id.in_(ids)
        if name:
            whereCondition = and_(whereCondition, plot.c.name.like(name))
        selectQuery = plot.select(offset=offset, limit=limit).where(whereCondition)
        countQuery = select([func.count()], from_obj=[plot]).where(whereCondition)
        return {
            'total': conn.execute(countQuery).scalar(),
            'plots': [Plot.getByID(conn, row[plot.c.id], row) for
                      row in
                      conn.execute(selectQuery)]
        }

    def getByHost(conn, hostname):
        sel = select([plot.c.id, plot.c.name, plot.c.unit, plot.c.hostservice_id], from_obj=[plot.join(hostservice).join(host)]) \
        .where(host.c.name==hostname)

        result = conn.execute(sel)

        objs = []

        for row in result:
            obj = Plot.get(row[plot.c.id])

            if obj == None:
                hs = HostService.getByID(conn, row[plot.c.hostservice_id])
                obj = Plot(hs, row[plot.c.name])
                obj.id = row[plot.c.id]
                obj.unit = row[plot.c.unit]
                obj.activate()

            objs.append(obj)

        return objs

    getByHost = staticmethod(getByHost)

    def save(self, conn):
        if self.id == None:
            if self.hostservice.id == None:
                self.hostservice.save(conn)

            assert self.hostservice.id != None

            ins = plot.insert().values(hostservice_id=self.hostservice.id, name=self.name, unit=self.unit)
            result = conn.execute(ins)
            self.id = result.inserted_primary_key[0]
            self.activate()
        else:
            upd = plot.update().where(plot.c.id==self.id).values(hostservice_id=self.hostservice.id, unit=self.unit)
            conn.execute(upd)

    def activate(self):
        ModelBase.activate(self)

timeframe = Table('timeframe', metadata,
    Column('id', Integer, Sequence('timeframe_id_seq'), nullable=False, primary_key=True),
    Column('interval', Integer, nullable=False),
    Column('retention_period', Integer),
    Column('active', Boolean, nullable=False),

    mysql_engine='InnoDB'
)

class TimeFrame(ModelBase):
    cache_tfs = None

    def __init__(self, interval, retention_period=None, active=True):
        self.id = None
        self.interval = interval
        self.retention_period = retention_period
        self.active = active

    def getAll(conn, include_inactive=False):
        if TimeFrame.cache_tfs == None or include_inactive:
            sel = timeframe.select()

            if not include_inactive:
                sel = sel.where(timeframe.c.active==True)

            sel = sel.order_by(timeframe.c.interval.asc())

            objs = []

            for row in conn.execute(sel):
                id = row[timeframe.c.id]
                obj = TimeFrame.get(id)

                if obj == None:
                    obj = TimeFrame(row[timeframe.c.interval], row[timeframe.c.retention_period], row[timeframe.c.active])
                    obj.id = id
                    obj.activate()

                objs.append(obj)

            if include_inactive:
                return objs

            TimeFrame.cache_tfs = objs

        return TimeFrame.cache_tfs

    getAll = staticmethod(getAll)

    def getByID(conn, id):
        obj = TimeFrame.get(id)

        if obj == None:

            sel = timeframe.select().where(timeframe.c.id==id)
            res = conn.execute(sel)
            row = res.fetchone()

            obj = TimeFrame(row[timeframe.c.interval], row[timeframe.c.retention_period], row[timeframe.c.active])
            obj.id = row[timeframe.c.id]
            obj.activate()

        return obj

    getByID = staticmethod(getByID)

    def invalidateCache():
        TimeFrame.cache_tfs = None

    invalidateCache = staticmethod(invalidateCache)

    def save(self, conn):
        if self.id == None:
            ins = timeframe.insert().values(interval=self.interval,
                                            retention_period=self.retention_period,
                                            active=self.active)
            result = conn.execute(ins)
            self.id = result.inserted_primary_key[0]
            self.activate()
        else:
            upd = timeframe.update().where(timeframe.c.id==self.id).values(interval=self.interval,
                                                              retention_period=self.retention_period,
                                                              active=self.active)
            result = conn.execute(upd)

        self.invalidateCache()

datapoint = Table('datapoint', metadata,
    Column('plot_id', Integer, ForeignKey('plot.id'), nullable=False, primary_key=True, autoincrement=False),
    Column('timeframe_id', Integer, ForeignKey('timeframe.id'), nullable=False, primary_key=True, autoincrement=False),
    Column('timestamp', Integer, nullable=False, primary_key=True, autoincrement=False),
    Column('min', Numeric(precision=20, scale=5, asdecimal=False), nullable=False),
    Column('max', Numeric(precision=20, scale=5, asdecimal=False), nullable=False),
    Column('avg', Numeric(precision=20, scale=5, asdecimal=False), nullable=False),
    Column('lower_limit', Numeric(precision=20, scale=5, asdecimal=False)),
    Column('upper_limit', Numeric(precision=20, scale=5, asdecimal=False)),
    Column('warn_lower', Numeric(precision=20, scale=5, asdecimal=False), nullable=True),
    Column('warn_upper', Numeric(precision=20, scale=5, asdecimal=False), nullable=True),
    Column('warn_type', Enum('inside', 'outside', name='warn_type_enum'), nullable=True),
    Column('crit_lower', Numeric(precision=20, scale=5, asdecimal=False), nullable=True),
    Column('crit_upper', Numeric(precision=20, scale=5, asdecimal=False), nullable=True),
    Column('crit_type', Enum('inside', 'outside', name='crit_type_enum'), nullable=True),
    Column('count', Integer, nullable=False),

    mysql_engine='InnoDB'
)

Index('idx_dp_1', datapoint.c.timeframe_id, datapoint.c.timestamp)
Index('idx_dp_2', datapoint.c.timestamp)

class DataPoint(object):
    def getValuesByInterval(conn, query, start_timestamp=None, end_timestamp=None, granularity=None, null_tolerance=0):
        global dbload_min_timestamp

        plots = query.keys()

        types_map = {
            'min': datapoint.c.min,
            'max': datapoint.c.max,
            'avg': datapoint.c.avg,
            'lower_limit': datapoint.c.lower_limit,
            'upper_limit': datapoint.c.upper_limit,
            'warn_lower': datapoint.c.warn_lower,
            'warn_upper': datapoint.c.warn_upper,
            'warn_type': datapoint.c.warn_type,
            'crit_lower': datapoint.c.crit_lower,
            'crit_upper': datapoint.c.crit_upper,
            'crit_type': datapoint.c.crit_type
        }

        types = set()
        for plot_types in query.values():
            types = types.union(plot_types)

        if len(plots) == 0:
            return {}

        if start_timestamp == None:
            start_timestamp = 0

        if end_timestamp == None:
            end_timestamp = time()

        if end_timestamp < start_timestamp:
            tmp = end_timestamp
            end_timestamp = start_timestamp
            start_timestamp = tmp

        start_timestamp = max(start_timestamp, dbload_min_timestamp)

        tfs = TimeFrame.getAll(conn)

        if granularity == None:
            now = time()

            for tf in tfs:
                if tf.retention_period != None and now - tf.retention_period > start_timestamp:
                    continue

                if granularity == None or tf.interval < granularity:
                    granularity = tf.interval

            granularity = max(granularity, (end_timestamp - start_timestamp) / 125)

        data_tf = None

        for tf in sorted(tfs, cmp=lambda x,y: cmp(x.interval, y.interval), reverse=True):
            if tf.interval < granularity and data_tf != None:
                break

            data_tf = tf

        granularity = data_tf.interval

        start_timestamp -= 1.5 * granularity
        end_timestamp += 1.5 * granularity

        if data_tf.retention_period != None:
            start_timestamp = max(start_timestamp, data_tf.retention_period - 2 * granularity)

        assert granularity > 0

        # properly align interval with the timeframe
        start_timestamp = start_timestamp - start_timestamp % granularity

        hostservices = set([plot.hostservice for plot in plots])
        comment_objs = Comment.getByHostServicesAndInterval(conn, hostservices, start_timestamp, end_timestamp)

        comments = []

        for comment_obj in comment_objs:
            if comment_obj.hostservice.parent_hostservice != None:
                parent_service = comment_obj.hostservice.parent_hostservice.service.name
            else:
                parent_service = None

            comments.append({ 'id': comment_obj.id, 'host': comment_obj.hostservice.host.name,
                     'parent_service': parent_service,
                     'service': comment_obj.hostservice.service.name,
                     'timestamp': comment_obj.timestamp, 'comment_timestamp': comment_obj.comment_timestamp,
                     'author': comment_obj.author, 'text': comment_obj.text })

        # status_objs = PluginStatus.getByHostServicesAndInterval(conn, hostservices, start_timestamp, end_timestamp)

        statusdata = []

        # for status_obj in status_objs:
        #     if status_obj.hostservice.parent_hostservice != None:
        #         parent_service = status_obj.hostservice.parent_hostservice.service.name,
        #
        #     else:
        #         parent_service = None
        #
        #     statusdata.append({ 'id': status_obj.id, 'host': status_obj.hostservice.host.name,
        #              'parent_service': parent_service,
        #              'service': status_obj.hostservice.service.name,
        #              'timestamp': status_obj.timestamp, 'status': status_obj.status })
        st = time()

        sql_types = [datapoint.c.plot_id, datapoint.c.timestamp]
        for type in types_map.keys():
            if type in types:
                sql_types.append(types_map[type])


        plot_conds = tuple_(datapoint.c.plot_id).in_([(plot.id,) for plot in plots])
        sel = select(sql_types,
                     and_(datapoint.c.timeframe_id==data_tf.id,
                          plot_conds,
                          between(datapoint.c.timestamp, literal(start_timestamp) - literal(start_timestamp) % data_tf.interval, end_timestamp))) \
                .order_by(datapoint.c.timestamp.asc())
        et = time()
        print "Building SQL query took %f seconds" % (et - st)

        st = time()
        result = conn.execute(sel)
        et = time()

        print "SQL query took %f seconds" % (et - st)

        charts = OrderedDict()
        prev_rows = {}

        for plot in plots:
            chart = {}

            for type in query[plot]:
                chart[type] = []

            charts[plot] = chart
            prev_rows[plot] = None

        print "Result rows: %d" % (result.rowcount)

        st = time()

        for row in result:
            plot = Plot.get(row[datapoint.c.plot_id])
            assert plot != None

            chart = charts[plot]
            prev_row = prev_rows[plot]

            ts = row[datapoint.c.timestamp]

            plot_types = query[plot]

            if prev_row != None and \
                    row[datapoint.c.timestamp] - prev_row[datapoint.c.timestamp] > (null_tolerance + 1) * granularity:
                ts_null = prev_row[datapoint.c.timestamp] + (row[datapoint.c.timestamp] - prev_row[datapoint.c.timestamp]) / 2

                for type in query[plot]:
                    chart[type].append((ts_null, None))

            for type in query[plot]:
                chart[type].append((ts, row[types_map[type]]))

            prev_rows[plot] = row

        et = time()
        print "Processing results took %f seconds" % (et - st)

        return { 'comments': comments, 'charts': charts, 'statusdata': statusdata,
                 'start_timestamp': start_timestamp, 'end_timestamp': end_timestamp,
                 'granularity': granularity }

    getValuesByInterval = staticmethod(getValuesByInterval)

    def cleanupOldData(conn):
        for tf in TimeFrame.getAll(conn, True):
            if tf.retention_period == None:
                continue
            if conn.dialect.name == 'mysql':
                delsql = "DELETE FROM datapoint WHERE timeframe_id=%d AND timestamp < %d LIMIT 25000" % (tf.id, time() - tf.retention_period)
            elif conn.dialect.name == 'postgresql':
                delsql = ('DELETE FROM datapoint WHERE ctid = ANY(ARRAY(SELECT ctid FROM datapoint WHERE '
                          'timeframe_id = %d AND timestamp < %d ORDER BY timestamp LIMIT 25000))') % (tf.id,
                                                                                                      time() - tf.retention_period)
            else:
                delsql = datapoint.delete(and_(datapoint.c.timeframe_id==tf.id,
                                               datapoint.c.timestamp < time() - tf.retention_period))
            conn.execute(delsql)

    cleanupOldData = staticmethod(cleanupOldData)

comment = Table('comment', metadata,
    Column('id', Integer, Sequence('comment_id_seq'), nullable=False, primary_key=True),
    Column('hostservice_id', Integer, ForeignKey('hostservice.id'), nullable=False, primary_key=True),
    Column('timestamp', Integer, nullable=False, primary_key=True),
    Column('comment_timestamp', Integer, nullable=False),
    Column('author', String(128), nullable=False),
    Column('text', String(512), nullable=False),

    mysql_engine='InnoDB'
)

class Comment(ModelBase):
    def __init__(self, hostservice, timestamp, author, text):
        self.id = None
        self.hostservice = hostservice
        self.timestamp = timestamp
        self.comment_timestamp = time()
        self.author = author
        self.text = text

    def getByID(conn, id):
        obj = Comment.get(id)

        if obj == None:
            sel = comment.select().where(comment.c.id==id)
            res = conn.execute(sel)
            row = res.fetchone()

            assert row != None

            hostservice = HostService.getByID(conn, row[comment.c.hostservice_id])

            obj = Comment(hostservice, row[comment.c.timestamp], row[comment.c.author], row[comment.c.text])
            obj.id = row[comment.c.id]
            obj.comment_timestamp = row[comment.c.comment_timestamp]
            obj.activate()

        return obj

    getByID = staticmethod(getByID)

    def getByHostServicesAndInterval(conn, hostservices, start_timestamp, end_timestamp):
        conds = or_(*[comment.c.hostservice_id == hostservice.id for hostservice in hostservices])

        sel = comment.select().where(and_(conds, comment.c.timestamp.between(start_timestamp, end_timestamp)))
        result = conn.execute(sel)

        objs = []

        for row in result:
            obj = Comment.get(row[comment.c.id])

            if obj == None:
                hostservice = HostService.getByID(conn, row[comment.c.hostservice_id])

                obj = Comment(hostservice, row[comment.c.timestamp], row[comment.c.author], row[comment.c.text])
                obj.id = row[comment.c.id]
                obj.comment_timestamp = row[comment.c.comment_timestamp]
                obj.activate()

            objs.append(obj)

        return objs

    getByHostServicesAndInterval = staticmethod(getByHostServicesAndInterval)

    def save(self, conn):
        self.comment_timestamp = time()

        if self.id == None:
            if self.hostservice.id == None:
                self.hostservice.save(conn)

            assert self.hostservice.id != None

            ins = comment.insert().values(hostservice_id=self.hostservice.id, timestamp=self.timestamp,
                                          comment_timestamp=self.comment_timestamp, author=self.author,
                                          text=self.text)

            result = conn.execute(ins)
            self.id = result.inserted_primary_key[0]
            self.activate()
        else:
            upd = comment.update().where(comment.c.id==self.id).values(hostservice_id=self.hostservice.id, timestamp=self.timestamp,
                                                                       comment_timestamp=self.comment_timestamp, author=self.author,
                                                                       text=self.text)
            conn.execute(upd)

    def delete(self, conn):
        if self.id == None:
            return

        conn.execute(comment.delete().where(comment.c.id==self.id))

pluginstatus = Table('pluginstatus', metadata,
    Column('id', Integer, Sequence('pluginstatus_id_seq'), nullable=False, primary_key=True),
    Column('hostservice_id', Integer, ForeignKey('hostservice.id'), nullable=False, primary_key=True),
    Column('timestamp', Integer, nullable=False, primary_key=True),
    Column('status', Enum('warning', 'critical', name='status_enum'), nullable=False),

    mysql_engine='InnoDB'
)

Index('idx_ps_1', pluginstatus.c.timestamp)

class PluginStatus(ModelBase):
    def __init__(self, hostservice, timestamp, status):
        self.id = None
        self.hostservice = hostservice
        self.timestamp = timestamp
        self.status = status

    def getByID(conn, id):
        obj = PluginStatus.get(id)

        if obj == None:
            sel = pluginstatus.select().where(pluginstatus.c.id==id)
            res = conn.execute(sel)
            row = res.fetchone()

            assert row != None

            hostservice = HostService.getByID(conn, row[pluginstatus.c.hostservice_id])

            obj = PluginStatus(hostservice, row[pluginstatus.c.timestamp], row[pluginstatus.c.status])
            obj.id = row[pluginstatus.c.id]
            obj.activate()

        return obj

    getByID = staticmethod(getByID)

    def getByHostServicesAndInterval(conn, hostservices, start_timestamp, end_timestamp):
        conds = or_(*[pluginstatus.c.hostservice_id == hostservice.id for hostservice in hostservices])

        sel = pluginstatus.select().where(and_(conds, pluginstatus.c.timestamp.between(start_timestamp, end_timestamp)))
        result = conn.execute(sel)

        objs = []

        for row in result:
            obj = PluginStatus.get(row[pluginstatus.c.id])

            if obj == None:
                hostservice = HostService.getByID(conn, row[pluginstatus.c.hostservice_id])

                obj = PluginStatus(hostservice, row[pluginstatus.c.timestamp], row[pluginstatus.c.status])
                obj.id = row[pluginstatus.c.id]
                obj.activate()

            objs.append(obj)

        return objs

    getByHostServicesAndInterval = staticmethod(getByHostServicesAndInterval)

    def save(self, conn):
        if self.id == None:
            if self.hostservice.id == None:
                self.hostservice.save(conn)

            assert self.hostservice.id != None

            ins = pluginstatus.insert().values(hostservice_id=self.hostservice.id, timestamp=self.timestamp,
                                          status=self.status)

            result = conn.execute(ins)
            self.id = result.inserted_primary_key[0]
            self.activate()
        else:
            upd = pluginstatus.update().where(pluginstatus.c.id==self.id).values(status=self.status)
            conn.execute(upd)

    def delete(self, conn):
        if self.id == None:
            return

        conn.execute(pluginstatus.delete().where(pluginstatus.c.id==self.id))

    def cleanupOldData(conn):
        retention_period = None

        tfs = TimeFrame.getAll(conn, True)

        for tf in tfs:
            if tf.retention_period == None:
                continue

            if retention_period == None or tf.retention_period > retention_period:
                retention_period = tf.retention_period

        if retention_period != None:
            delsql = pluginstatus.delete(pluginstatus.c.timestamp < time() - retention_period)

            conn.execute(delsql)

    cleanupOldData = staticmethod(cleanupOldData)

class SetTextFactory(PoolListener):
    def connect(self, dbapi_con, con_record):
        try:
            dbapi_con.text_factory = str
        except Exception:
            pass

'''
creates a DB connection
'''
def createModelEngine(dsn):
    global dbload_min_timestamp, dbload_max_timestamp
    fn = """CREATE FUNCTION update_existing() RETURNS TRIGGER AS $update_existing$
         DECLARE
             existing RECORD;
         BEGIN
             SELECT INTO existing * FROM datapoint
                 WHERE (plot_id, timeframe_id, timestamp) = (NEW.plot_id, NEW.timeframe_id, NEW.timestamp);
             IF NOT FOUND THEN -- INSERT
                 RETURN NEW;
             ELSE
                 UPDATE datapoint SET
                     avg = (existing.avg * existing.count + NEW.avg) / (existing.count + 1),
                     min = LEAST(existing.min, NEW.min),
                     max = GREATEST(existing.max, NEW.max),
                     count = existing.count + 1
                 WHERE
                     plot_id = existing.plot_id
                     AND timeframe_id = existing.timeframe_id
                     AND timestamp = existing.timestamp;
                 RETURN NULL; -- DON'T INSERT
             END IF;
         END;
         $update_existing$ LANGUAGE plpgsql;"""
    trigg = """CREATE TRIGGER update_existing
            BEFORE INSERT ON datapoint
            FOR EACH ROW EXECUTE PROCEDURE update_existing();"""
    triggd = 'DROP TRIGGER update_existing();'
    fnd = 'DROP FUNCTION update_existing();'
    event_obj = SetTextFactory()
    if hasattr(event, 'listen'):
        engine = create_engine(dsn)
        event.listen(engine, 'connect', event_obj.connect)
        event.listen(datapoint, 'before_create', DDL(fn).execute_if(dialect='postgresql'))
        event.listen(datapoint, 'after_create', DDL(trigg).execute_if(dialect='postgresql'))
        event.listen(datapoint, 'before_drop', DDL(triggd).execute_if(dialect='postgresql'))
        event.listen(datapoint, 'before_drop', DDL(fnd).execute_if(dialect='postgresql'))
    else:
        # < 0.7 compat
        engine = create_engine(dsn, listeners=[event_obj])
        DDL(fn, on='postgresql').execute_at('after-create', datapoint)
        DDL(trigg, on='postgresql').execute_at('after-create', datapoint)
        DDL(triggd, on='postgresql').execute_at('before-drop', datapoint)
        DDL(fnd, on='postgresql').execute_at('before-drop', datapoint)

    #engine.echo = True

    conn = engine.connect()

    metadata.create_all(engine)

    sel = select([func.min(datapoint.c.timestamp, type_=Integer).label('mintimestamp')])
    dbload_min_timestamp = conn.execute(sel).scalar()

    if dbload_min_timestamp == None:
        dbload_min_timestamp = time()

    sel = select([func.max(datapoint.c.timestamp, type_=Integer).label('maxtimestamp')])
    dbload_max_timestamp = conn.execute(sel).scalar()

    if dbload_max_timestamp == None:
        dbload_max_timestamp = 0

    conn.close()

    return engine


def cleanup(conn):
    try:
        DataPoint.cleanupOldData(conn)
        PluginStatus.cleanupOldData(conn)
    except Exception, e:
        print e


def aggregate_queries(queries):
    mem = {}
    for query in queries:
        key = '%s%s%s' % (query['plot_id'], query['timeframe_id'], query['timestamp'])
        if key not in mem:
            mem[key] = query
        else:
            i = mem[key]
            i['avg'] = (i['count'] * i['avg'] + query['avg']) / (i['count'] + 1)
            i['min'] = min(i['min'], query['min'])
            i['max'] = max(i['max'], query['max'])
            i['count'] += 1
    return mem.values()
