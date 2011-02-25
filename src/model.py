'''
Created on 17.01.2011

@author: gunnar
'''

from sqlalchemy import MetaData, UniqueConstraint, Table, Column, Integer, \
    Boolean, Numeric, String, Sequence, ForeignKey, Index, create_engine, and_
from sqlalchemy.sql import literal, select, between, func
from time import time
from weakref import WeakValueDictionary
from random import randint

last_vacuum = time()
last_cleanup = time()
last_autocheckpoint = time()
last_commit = time()
dbload_max_timestamp = None
transactions = {}

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
    Column('name', String(512), nullable=False, unique=True),
    
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
            self.id = result.last_inserted_ids()[0]
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
    
    def getByPattern(conn, sql_filter, limit, offset):
        sel = select([func.count()]).select_from(host).where(host.c.name.like(sql_filter))
        total = conn.execute(sel).scalar()
        
        sel = host.select(limit=limit, offset=offset).where(host.c.name.like(sql_filter)).order_by(host.c.name)
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
    Column('name', String(512), nullable=False, unique=True),
    
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
            self.id = result.last_inserted_ids()[0]
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

hostservice = Table('hostservice', metadata,
    Column('id', Integer, Sequence('hostservice_id_seq'), nullable=False, primary_key=True),
    Column('host_id', Integer, ForeignKey('host.id'), nullable=False),
    Column('service_id', Integer, ForeignKey('service.id'), nullable=False),
    Column('parent_hostservice_id', Integer, ForeignKey('hostservice.id')),
    
    UniqueConstraint('host_id', 'service_id', name='uc_hs_1'),
    
    mysql_engine='InnoDB'
)

class HostService(ModelBase):
    def __init__(self, host, service, parent_hostservice):
        self.id = None
        self.host = host
        self.service = service
        self.parent_hostservice = parent_hostservice

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
            self.id = result.last_inserted_ids()[0]
            self.activate()
        else:
            # TODO: should probably just throw an exception instead -
            # as changing a service's host/service ids doesn't make any sense
            upd = hostservice.update().where(hostservice.c.id==self.id).values(host_id=self.host.id, \
                                                                               service_id=self.service.id, \
                                                                               parent_hostservice_id=self.parent_hostservice.id)
            conn.execute(upd)

    def getByID(conn, id):
        obj = HostService.get(id)
    
        if obj == None:
            sel = hostservice.select().where(hostservice.c.id==id)
            res = conn.execute(sel)
            row = res.fetchone()
            
            assert row != None

            host = Host.getByID(conn, row[hostservice.c.host_id])
            service = Service.getByID(conn, row[hostservice.c.service_id])

            if row[hostservice.c.parent_hostservice_id] != None:
                parent_hostservice = HostService.getByID(conn, row[hostservice.c.parent_hostservice_id])
            else:
                parent_hostservice = None

            obj = HostService(host, service, parent_hostservice)
            obj.id = row[hostservice.c.id]            
            obj.activate()
        
        return obj
    
    getByID = staticmethod(getByID)
    
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
    Column('name', String(512), nullable=False),
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
        self.max_timestamp = None
        self.current_interval = None
        self.cache_tfs = None
        self.cache_dps = None
        
        self.last_value = 0
        
        self.last_update = None
        
        self.has_ignored_missing_tf = False

    def fetchDataPoints(self, conn, timestamp, ignore_missing_tf=False, require_tf=None):
        if self.has_ignored_missing_tf == ignore_missing_tf and self.current_timestamp != None and \
                self.current_interval != None and timestamp - timestamp % self.current_interval == self.current_timestamp - \
                self.current_timestamp % self.current_interval:
            return (self.cache_tfs, self.cache_dps)

        debug_ts = self.current_timestamp

        tfs = TimeFrame.getAllSorted(conn, active_only=True)
        self.cache_tfs = tfs                
        self.current_interval = tfs[0].interval

        dps = dict()

        if self.cache_dps != None:
            for dp in self.cache_dps.values():
                if dp.timestamp == timestamp - timestamp % dp.timeframe.interval:
                    dps[dp.timeframe.interval] = dp

        # if 'timestamp' is older than the newest timestamp when we first accessed the db
        # or it's older than the newest timestamo for this plot.. we need to query the DB
        if (dbload_max_timestamp != None and timestamp < dbload_max_timestamp) or \
                self.max_timestamp == None or timestamp < self.max_timestamp:
            self.current_timestamp = timestamp
            
            old_max_timestamp = self.max_timestamp
            self.max_timestamp = timestamp
        
            for dp in DataPoint.getByTimestamp(conn, self, timestamp, active_tfs_only=True):
                dps[dp.timeframe.interval] = dp

            # having no dps or just the one for the smallest timeframe is OK because in that
            # case we can safely create new empty dps for all the missing timeframes
            if not ignore_missing_tf and not (len(dps) == 0 or (len(dps) == 1 and tfs[0].interval in dps)):
                print("len(dps) == %d; len(tfs) == %d" % (len(dps), len(tfs)))
                print("old current_timestamp:", debug_ts, "timestamp:", timestamp)

                if len(dps) != len(tfs):
                    print("Can't process update due to missing intermediary DPs which were already " \
                          "cleaned up.")
                    
                    # revert change to max_timestamp as we weren't able to load all datapoints
                    # for the specified timeframe
                    self.max_timestamp = old_max_timestamp
                    
                    return None

                self.cache_dps = dps
                return (tfs, dps)
                
        # BUG: we need to make sure that the number of dps returned
        # by getByTimestamp is equal to the number of active tfs and
        # and skip the update when they're not; make sure not to wipe the
        # cache in this case as this might degrade performance

        self.current_timestamp = timestamp
        
        if timestamp > self.max_timestamp:
            self.max_timestamp = timestamp
        
        for tf in tfs:
            if not tf.interval in dps and (not ignore_missing_tf or require_tf == tf.interval):
                dp = DataPoint(self, tf,
                               timestamp - timestamp % tf.interval)
                dps[tf.interval] = dp

        self.cache_dps = dps
        
        return (tfs, dps)

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

    def insertValue(self, conn, timestamp, unit, value, min, max, lower_limit, upper_limit):        
        result = self.fetchDataPoints(conn, timestamp)
        
        if result == None:
            return
        
        (tfs, dps) = result
        
        # no timeframes -> nothing to do here
        if len(tfs) == 0:
            return

        value = float(value)
        
        if lower_limit != None:
            lower_limit = float(lower_limit)

            if value < lower_limit:
                value = lower_limit

        if upper_limit != None:
            upper_limit = float(upper_limit)
            
            # some plugins return lower_limit==upper_limit,
            # lets just ignore that non-sense...
            if value > upper_limit and lower_limit != upper_limit:
                value = upper_limit
    
        value_raw = value

        if unit == 'counter':
            value = Plot._calculateRateHelper(self.last_update, timestamp, self.last_value, value)
            min = None
            max = None

        self.last_value = value_raw
        self.last_update = timestamp
        
        # _calculateRateHelper returns None if it can't figure out the rate (yet)
        if value == None:
            return

        prev_dp = None
        
        for tf in reversed(tfs):
            dp = dps[tf.interval]
            
            if prev_dp != None:
                if dp.count > 0:
                    prev_dp.removeValue(dp.avg)
            
            prev_dp = dp

        if min == None or min > value:
            min = value
            
        if max == None or max < value:
            max = value

        prev_min = min
        prev_max = max
        prev_avg = value

        for tf in tfs:
            dp = dps[tf.interval]
            
            dp.insertValue(prev_avg, prev_min, prev_max, lower_limit, upper_limit)

            prev_min = dp.min
            prev_max = dp.max
            prev_avg = dp.avg
            
        if self.unit != unit:
            self.unit = unit
            self.save(conn)

    def insertValueRaw(self, conn, tf_interval, timestamp, unit, value, min, max, lower_limit, upper_limit):
        result = self.fetchDataPoints(conn, timestamp, ignore_missing_tf=True, require_tf=tf_interval)
                
        if result == None:
            return
        
        (_, dps) = result

        assert tf_interval in dps
        assert dbload_max_timestamp == None, 'insertValueRaw may only be used to import data into an empty DB'
                
        value_raw = value

        if unit == 'counter':
            # TODO: We don't support calculating min/max values for counters yet. Not while importing
            # data anyway.
            if value == None:
                return

            min = None
            max = None

            value = Plot._calculateRateHelper(self.last_update, timestamp, self.last_value, value)
            
        if value_raw != None:
            self.last_value = value_raw
            self.last_update = timestamp
            
        dps[tf_interval].insertValue(value, min, max, lower_limit, upper_limit)
        self.last_update = timestamp
        
        if self.unit != unit:
            self.unit = unit
            self.save(conn)

    def getByID(conn, id):
        obj = Plot.get(id)
        
        if obj == None:
            sel = plot.select().where(plot.c.id==id)
            res = conn.execute(sel)
            row = res.fetchone()
            
            assert row != None

            obj = Plot()
            obj.id = row[plot.c.id]
            obj.hostservice = HostService.getByID(conn, row[plot.c.hostservice_id])
            obj.unit = row[plot.c.unit]
            obj.activate()

        return obj

    getByID = staticmethod(getByID)
    
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
                self.hostservice.save()
                
            assert self.hostservice.id != None

            ins = plot.insert().values(hostservice_id=self.hostservice.id, name=self.name, unit=self.unit)
            result = conn.execute(ins)
            self.id = result.last_inserted_ids()[0]
            self.activate()
        else:
            upd = plot.update().where(plot.c.id==self.id).values(hostservice_id=self.hostservice.id, unit=self.unit)
            conn.execute(upd)

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

    def getAllSorted(conn, active_only=False):
        if TimeFrame.cache_tfs == None:
            sel = timeframe.select()
            
            if active_only:
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
                
            TimeFrame.cache_tfs = objs
            
        return TimeFrame.cache_tfs
    
    getAllSorted = staticmethod(getAllSorted)

    def getByID(conn, id):
        obj = TimeFrame.get(id)
        
        if obj == None:
            
            sel = timeframe.select().where(timeframe.c.id==id)
            res = conn.execute(sel)
            row = res.fetchone()
            
            obj = TimeFrame()
            obj.id = row[timeframe.c.id]
            obj.interval = row[timeframe.c.interval]
            obj.retention_period = row[timeframe.c.retention_period]
            obj.active = row[timeframe.c.active]
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
            self.id = result.last_inserted_ids()[0]
            self.activate()
        else:
            upd = timeframe.update().where(timeframe.c.id==self.id).values(interval=self.interval,
                                                              retention_period=self.retention_period,
                                                              active=self.active)
            result = conn.execute(upd)
        
        self.invalidateCache()

datapoint = Table('datapoint', metadata,
    Column('plot_id', Integer, ForeignKey('plot.id'), nullable=False, primary_key=True),
    Column('timeframe_id', Integer, ForeignKey('timeframe.id'), nullable=False, primary_key=True),
    Column('timestamp', Integer, nullable=False, primary_key=True),
    Column('min', Numeric(precision=20, scale=5, asdecimal=False), nullable=False),
    Column('max', Numeric(precision=20, scale=5, asdecimal=False), nullable=False),
    Column('avg', Numeric(precision=20, scale=5, asdecimal=False), nullable=False),
    Column('lower_limit', Numeric(precision=20, scale=5, asdecimal=False)),
    Column('upper_limit', Numeric(precision=20, scale=5, asdecimal=False)),
    Column('count', Integer, nullable=False),
    
    mysql_engine='InnoDB'
)

Index('idx_dp_1', datapoint.c.timeframe_id, datapoint.c.timestamp)
Index('idx_dp_2', datapoint.c.timestamp)

class DataPoint(ModelBase):
    '''
    A set containing all modified datapoint objects. Some of these objects
    may not even have an id yet.
    '''
    modified_objects = set()
    
    '''
    Contains the number of objects that were left over from the last
    sync. This is used as a starting point to figure out how many
    objects the next syncSomeObjects() call is going to sync - rather
    than wasting CPU time by traversing the whole list.
    '''
    last_sync_remaining_count = 0
    
    def __init__(self, plot, timeframe, timestamp):
        self._last_modification = time()
        self._last_saved = time()

        self.id = None

        self.plot = plot
        self.timeframe = timeframe
        self.timestamp = int(timestamp)
        
        self.min = None
        self.max = None
        self.avg = 0.0
        self.count = 0
        self.lower_limit = None
        self.upper_limit = None
        
        self.saved_min = None
        self.saved_max = None
        self.saved_avg = None
        self.saved_count = None
        self.saved_lower_limit = None
        self.saved_upper_limit = None
                
        self._inserted = False
        
        '''
        Previous min/max/avg values, these are not stored in the DB
        and are only kept so we can "remove" the last value from the
        min/max columns.
        ''' 
        self.prev_min = 0
        self.prev_max = 0
        self.prev_avg = None

    def identity(self):
        if self.plot.id == None or self.timeframe.id == None or not self._inserted:
            return None
        else:
            return (self.plot.id, self.timeframe.id, self.timestamp)

    '''
    value = current value (or avg from a smaller tf)
    min = minimum value we encountered in smaller tfs)
    max = maximum value we encountered in smaller tfs)
    lower_limit = lower limit for the value, as specified in the perfdata
    upper_limit = upper limit for the value, as specified in the perfdata
    '''
    def insertValue(self, value, min, max, lower_limit=None, upper_limit=None):
        value = float(value)
        
        if min == None:
            min = value
        else:
            min = float(min)

        if max == None:
            max = value
        else:
            max = float(max)
            
        if lower_limit != None:
            lower_limit = float(lower_limit)
            
        if upper_limit != None:
            upper_limit = float(upper_limit)
        
        if self.max == None or max > self.max:
            self.max = max
            
        if self.min == None or min < self.min:
            self.min = min
            
        if self.lower_limit == None:
            self.lower_limit = lower_limit
            
        if self.upper_limit == None:
            self.upper_limit = upper_limit

        if value != None:
            self.prev_min = self.min
            self.prev_max = self.max
            self.prev_avg = self.avg

            self.avg = (self.avg * self.count + value) / (self.count + 1)
            self.count = self.count + 1
        
        self.markAsModified()

    def removeValue(self, value):
        value = float(value)
        
        if self.count <= 0:
            return
        
        self.count = self.count - 1

        if self.prev_max != None:        
            self.max = self.prev_max
            self.prev_max = None

        if self.prev_min != None:
            self.min = self.prev_min
            self.prev_min = None
        
        if self.prev_avg != None:
            self.avg = self.prev_avg
            self.prev_avg = None
        else:        
            if self.count > 0:
                self.avg = (self.avg * (self.count + 1) - value) / self.count
            else:
                self.avg = 0.0

        self.markAsModified()

    def markAsModified(self):
        if self.modified():
                DataPoint.modified_objects.add(self)

    def _getDbValues(self, conn):
        if not self.modified():
            return
        
        self._last_modification = None
        self._last_saved = time()

        # make sure we're not wasting DB queries for unchanged objects
        if not self.modified():
            return

        if self.identity() == None:
            if self.plot.id == None:
                self.plot.save(conn)
                assert self.plot.id != None
            
            if self.timeframe.id == None:
                self.timeframe.save(conn)
                assert self.timeframe.id != None

            type = 'insert'
            values = {
                'plot_id': self.plot.id,
                'timeframe_id': self.timeframe.id,
                'timestamp': self.timestamp,
                'min': self.min,
                'max': self.max,
                'avg': self.avg,
                'count': self.count,
                'lower_limit': self.lower_limit,
                'upper_limit': self.upper_limit
            }
            
            self._inserted = True
            self.activate()
        else:
            type = 'update'
            values = {
                'min': self.min,
                'max': self.max,
                'avg': self.avg,
                'count': self.count,
                'lower_limit': self.lower_limit,
                'upper_limit': self.upper_limit
            }
        
        self.saved_min = self.min
        self.saved_max = self.max
        self.saved_avg = self.avg
        self.saved_count = self.count
        self.saved_lower_limit = self.lower_limit
        self.saved_upper_limit = self.upper_limit
        
        return {
            'type': type,
            'values': values
        }

    def save(self, conn):
        DataPoint.saveMany(conn, [self])

    def saveMany(conn, objs):
        insert_items = []

        for obj in objs:
            update = obj._getDbValues(conn)
            
            if update == None:
                continue

            type = update['type']
            values = update['values']

            if type == 'update':
                upd = datapoint.update().where(and_(datapoint.c.plot_id==obj.plot.id, \
                                           datapoint.c.timeframe_id==obj.timeframe.id,
                                           datapoint.c.timestamp==obj.timestamp)) \
                                           .values(values)
                conn.execute(upd)
                
                continue
            
            insert_items.append(values)
            
        if len(insert_items) > 0:
            conn.execute(datapoint.insert(), insert_items)
    
    saveMany = staticmethod(saveMany)

    def modified(self):
        # past retention period, don't save
        if self.timeframe.retention_period != None and \
                     self.timestamp < time() - self.timeframe.retention_period:
            return False
        
        # not (yet) a fully populated datapoint
        if self.min == None or self.max == None or self.avg == None:
            return False
        
        # new object or changed data
        return not self._inserted or not (self.min == self.saved_min and self.max == self.saved_max and \
                self.avg == self.saved_avg and self.count == self.saved_count and \
                self.lower_limit == self.saved_lower_limit and self.upper_limit == self.saved_upper_limit)
    
    def shouldSave(self):
        if not self.modified():
            return False
        
        now = time()
        
        assert self.plot.last_update != None
        
        return self.timestamp != self.plot.last_update - self.plot.last_update % self.timeframe.interval or self._last_saved + randint(300, 900) < now

    def getValuesByInterval(conn, plot, start_timestamp, end_timestamp, granularity=None):
        if end_timestamp < start_timestamp:
            tmp = end_timestamp
            end_timestamp = start_timestamp
            start_timestamp = tmp

        tfs = TimeFrame.getAllSorted(conn, active_only=True)

        if granularity == None:
            now = time()
            
            for tf in tfs:
                if tf.retention_period != None and now - tf.retention_period > start_timestamp:
                    continue
                
                if granularity == None or tf.interval < granularity:
                    granularity = tf.interval
                
            if granularity == None:
                # fallback, this should only happen when there are no timeframes which
                # don't have a retention_period
                granularity = (end_timestamp - start_timestamp) / 250 

        assert granularity > 0
        
        max_tf_interval = 0
        min_tf_interval = None
        for tf in tfs:
            if tf.interval > max_tf_interval:
                max_tf_interval = tf.interval
            
            if min_tf_interval == None or min_tf_interval > tf.interval:
                min_tf_interval = tf.interval
        
        # properly align interval with the smallest timeframe
        start_timestamp = start_timestamp - start_timestamp % max(granularity, min_tf_interval)
        
        # constrain granularity to the largest tf interval, so we
        # can at least display one datapoint
        if granularity > max_tf_interval:
            granularity = max_tf_interval
            
        # also constrain granularity to the time interval
        if granularity > end_timestamp - start_timestamp:
            granularity = end_timestamp - start_timestamp
        
        sel = select([datapoint, timeframe],
                     and_(datapoint.c.timeframe_id==timeframe.c.id,
                          datapoint.c.plot_id==plot.id,
                          between(datapoint.c.timestamp, literal(start_timestamp) - literal(start_timestamp) % timeframe.c.interval, end_timestamp),
                          timeframe.c.interval >= granularity))
        result = conn.execute(sel)

        items = dict()
        
        for row in result:
            ts = row[datapoint.c.timestamp]

            if ts in items and row[timeframe.c.interval] > items[ts]['interval']:
                continue

            item = {
                'interval': row[timeframe.c.interval],
                'min': row[datapoint.c.min],
                'max': row[datapoint.c.max],
                'avg': row[datapoint.c.avg],
                'lower_limit': row[datapoint.c.lower_limit],
                'upper_limit': row[datapoint.c.upper_limit],
            }
            
            items[ts] = item
            
        for obj in DataPoint._getCachedValuesByInterval(plot, start_timestamp, end_timestamp):
            ts = obj.timestamp
            
            if obj.timeframe.interval < granularity:
                continue
            
            if ts in items and obj.timeframe.interval > items[ts]['interval']:
                continue
            
            item = {
                'interval': obj.timeframe.interval,
                'min': obj.min,
                'max': obj.max,
                'avg': obj.avg,
                'lower_limit': obj.lower_limit,
                'upper_limit': obj.upper_limit
            }
            
            items[ts] = item

        vt_start = start_timestamp        
        vt_values = {}
        vt_keys = sorted(items.keys())
        vt_min_interval = None
        vt_start_nan = vt_start
        
        while vt_start < end_timestamp:
            vt_end = min(vt_start + granularity, end_timestamp)
            
            vt_value = None
            vt_covered_time = 0
            
            for ts in vt_keys:
                item = items[ts]

                # Ignore dps whose timestamp doesn't fall within
                # the current vt interval unless this is the first or
                # last interval
                if (ts < vt_start and vt_start != start_timestamp) \
                        or (ts + item['interval'] < vt_start and vt_start != start_timestamp) \
                        or (ts > vt_end and vt_end <= end_timestamp):
                    continue
            
                # Ignore larger timeframes when we've already seen a dp with a
                # smaller timeframe
                if vt_min_interval != None and vt_min_interval < item['interval']:
                    continue
                
                vt_min_interval = item['interval']
                
                vt_diff = min(ts + item['interval'], vt_end) - max(ts, vt_start)
                
                if vt_diff == 0:
                    continue

                if vt_value == None:
                    vt_value = {
                        'min': None,
                        'max': None,
                        'avg': 0,
                    }
                    
                if vt_value['min'] == None or item['min'] < vt_value['min']:
                    vt_value['min'] = item['min']
                    
                if vt_value['max'] == None or item['max'] > vt_value['max']:
                    vt_value['max'] = item['max']
                
                if item['lower_limit'] != None:
                    vt_value['lower_limit'] = item['lower_limit']
                    
                if item['upper_limit'] != None:
                    vt_value['upper_limit'] = item['upper_limit']
                    
                vt_value['avg'] += vt_diff * item['avg']
                
                vt_covered_time += vt_diff

            if vt_value != None:
                vt_value['min'] = str(vt_value['min'])
                vt_value['max'] = str(vt_value['max'])
                vt_value['avg'] = str(vt_value['avg'] / vt_covered_time)
                
                if 'lower_limit' in vt_value:
                    vt_value['lower_limit'] = str(vt_value['lower_limit'])
                    
                if 'upper_limit' in vt_value:
                    vt_value['upper_limit'] = str(vt_value['upper_limit'])
            
                vt_values[str((vt_end + vt_start) / 2)] = vt_value
                
                vt_start_nan = None
            else:
                if vt_start_nan == None:
                    vt_start_nan = vt_start
                elif vt_min_interval != None and vt_start - vt_start_nan > vt_min_interval:
                    # NaN value if there's a gap larger than vt_min_interval seconds,
                    # which would indicate that we're missing datapoints (possibly due
                    # to service downtime).
                    vt_values[str(vt_start)] = {}
                    vt_values[str(vt_end - 1)] = {}
                                        
            vt_start = vt_end

        return vt_values

    getValuesByInterval = staticmethod(getValuesByInterval)

    def _getCachedValuesByInterval(plot, start_timestamp, end_timestamp):
        objs = []
        
        for obj in DataPoint.modified_objects:
            if obj.plot == plot and obj.timestamp >= start_timestamp - start_timestamp % obj.timeframe.interval and \
                    obj.timestamp <= end_timestamp:
                objs.append(obj)
        
        return objs

    _getCachedValuesByInterval = staticmethod(_getCachedValuesByInterval)

    def getByTimestamp(conn, plot, timestamp, active_tfs_only=False):
        timestamp = int(timestamp)

        cond = and_(datapoint.c.timeframe_id==timeframe.c.id, datapoint.c.plot_id==plot.id,
                    datapoint.c.timestamp==literal(timestamp) - literal(timestamp) % timeframe.c.interval)

        if active_tfs_only:
            cond = and_(cond, timeframe.c.active==True)

        sel = datapoint.select().where(cond)
        objs = set()
        
        for row in conn.execute(sel):
            id = (row[datapoint.c.plot_id], row[datapoint.c.timeframe_id], row[datapoint.c.timestamp])
            obj = DataPoint.get(id)
            
            if obj == None:
                '''
                lazy-load timeframe rather than using a join, rationale for this
                is that they're usually cached already anyway
                '''
                tf = TimeFrame.getByID(conn, row[datapoint.c.timeframe_id])

                obj = DataPoint(plot, tf, row[datapoint.c.timestamp])
                obj.saved_min = obj.min = row[datapoint.c.min]
                obj.saved_max = obj.max = row[datapoint.c.max]
                obj.saved_avg = obj.avg = row[datapoint.c.avg]
                obj.saved_count = obj.count = max(0, row[datapoint.c.count])
                obj.saved_lower_limit = obj.lower_limit = row[datapoint.c.lower_limit]
                obj.saved_upper_limit = obj.upper_limit = row[datapoint.c.upper_limit]

                obj._inserted = True                                
                obj.activate()

            objs.add(obj)
    
        for obj in DataPoint.modified_objects:
            if obj.plot == plot and obj.timestamp == timestamp - timestamp % obj.timeframe.interval \
                    and (not active_tfs_only or obj.timeframe.active):
                objs.add(obj)
        
        return objs
        
    getByTimestamp = staticmethod(getByTimestamp)
    
    def syncSomeObjects(conn, partial_sync=False):
        count = 0
        
        # the maximum number of objects we are going to save this time (unless partial_sync == False)
        save_quota = max(500, DataPoint.last_sync_remaining_count / 10)

        remaining_objects = set()
        left_over_count = 0
        
        objs_to_save = []
    
        for obj in DataPoint.modified_objects:
            if not obj.modified() and obj.identity() != None:
                continue
            
            if partial_sync:
                if not obj.shouldSave():
                    remaining_objects.add(obj)  
                    continue
    
                if count >= save_quota:
                    remaining_objects.add(obj)
                    left_over_count += 1
                    continue
    
            objs_to_save.append(obj)
            count += 1
            
            if len(objs_to_save) > 20000:
                DataPoint.saveMany(conn, objs_to_save)
                objs_to_save = []

        if len(objs_to_save) > 0:
            DataPoint.saveMany(conn, objs_to_save)
        
        DataPoint.last_sync_remaining_count = left_over_count
        
        print("modified objects: %d -> %d, saved %d, still need to save: %d" %
              (len(DataPoint.modified_objects), len(remaining_objects), count, left_over_count))

        if not partial_sync:
            assert len(remaining_objects) == 0
    
        DataPoint.modified_objects = remaining_objects
        
    syncSomeObjects = staticmethod(syncSomeObjects)
    
    def cleanupOldData(conn):
        tfs = TimeFrame.getAllSorted(conn)

        for tf in tfs:
            if tf.retention_period == None:
                continue
        
            delsql = datapoint.delete(and_(datapoint.c.timeframe_id==tf.id, datapoint.c.timestamp < time() - tf.retention_period))
            
            conn.execute(delsql)
    
    cleanupOldData = staticmethod(cleanupOldData)

'''
creates a DB connection
'''
def createModelConnection(dsn):
    global dbload_max_timestamp

    engine = create_engine(dsn)

    engine.echo = True

    conn = engine.connect()

    # sqlite3-specific optimization
    try:
        conn.execute('PRAGMA locking_mode=exclusive')
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('PRAGMA wal_autocheckpoint=0')
        conn.execute('PRAGMA cache_size=1000000')
    except:
        pass

    metadata.create_all(engine)

    sel = select([func.max(datapoint.c.timestamp, type_=Integer).label('maxtimestamp')])
    dbload_max_timestamp = conn.execute(sel).scalar()

    transactions[conn] = conn.begin()

    return conn

'''
Syncs (parts of) the session.
'''
def syncModelSession(conn, partial_sync=False):
    DataPoint.syncSomeObjects(conn, partial_sync)
    
    if not partial_sync:
        transactions[conn].commit()
        transactions[conn] = conn.begin()

'''
Runs regular maintenance tasks:

* Running VACUUM on the database
* Cleaning up old datapoints
'''
def runMaintenanceTasks(conn):
    global last_vacuum, last_cleanup, last_autocheckpoint, last_commit

    if last_vacuum + 7 * 24 * 60 * 60 < time():
        try:
            conn.execute('VACUUM')
        except:
            pass
        
        last_vacuum = time()

    if last_cleanup + 30 * 60 < time():
        DataPoint.cleanupOldData(conn)
        
        last_cleanup = time()

    if last_autocheckpoint + 5 * 60 < time():
        try:
            conn.execute('PRAGMA wal_checkpoint')
        except:
            pass
        
        last_autocheckpoint = time()
        
    if last_commit + 60 < time():
        transactions[conn].commit()
        transactions[conn] = conn.begin()
        
        last_commit = time()
