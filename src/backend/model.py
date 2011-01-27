'''
Created on 17.01.2011

@author: gunnar
'''

from sqlalchemy import MetaData, UniqueConstraint, Table, Column, Integer, \
    Boolean, Numeric, String, Sequence, ForeignKey, create_engine, and_
from sqlalchemy.sql.expression import literal, select, between, func
from time import time
from weakref import WeakValueDictionary
from sqlalchemy.exc import ProgrammingError
from random import randint

last_vacuum = 0
dbload_max_timestamp = None

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
    def should_save(self):
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

        obj = Host.get(name)
        
        if obj == None:
            obj = Host(name)
            obj.id = row[host.c.id]
            obj.activate()
            
        return obj

    getByName = staticmethod(getByName)

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

    def getByName(conn, name):
        sel = service.select().where(service.c.name==name)
        result = conn.execute(sel)
        row = result.fetchone()
        
        if row == None:
            return None

        obj = Service.get(name)
        
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
    
    UniqueConstraint('host_id', 'service_id', name='uc_hs_1'),
    
    mysql_engine='InnoDB'
)

class HostService(ModelBase):
    def __init__(self, host, service):
        self.id = None
        self.host = host
        self.service = service

    def save(self, conn):
        if self.id == None:
            if self.host.id == None:
                self.host.save(conn)
                
            assert self.host.id != None
            
            if self.service.id == None:
                self.service.save(conn)
                
            assert self.service.id != None
    
            ins = hostservice.insert().values(host_id=self.host.id, service_id=self.service.id)
            result = conn.execute(ins)
            self.id = result.last_inserted_ids()[0]
            self.activate()
        else:
            # TODO: should probably just throw an exception instead -
            # as changing a service's host/service ids doesn't make any sense
            upd = hostservice.update().where(hostservice.c.id==self.id).values(host_id=self.host.id, service_id=self.service.id)
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

            obj = HostService(host, service)
            obj.id = row[hostservice.c.id]            
            obj.activate()
        
        return obj
    
    getByID = staticmethod(getByID)
    
    def getByHostAndService(conn, host, service):
        sel = hostservice.select().where(and_(hostservice.c.host_id==host.id, hostservice.c.service_id==service.id))
        result = conn.execute(sel)
        row = result.fetchone()
        
        if row == None:
            return None

        obj = HostService.get(row[hostservice.c.id])
        
        if obj == None:
            obj = HostService(host, service)
            obj.id = row[hostservice.c.id]
            obj.activate()

        return obj

    getByHostAndService = staticmethod(getByHostAndService)

plot = Table('plot', metadata,
    Column('id', Integer, Sequence('plot_id_seq'), nullable=False, primary_key=True),
    Column('hostservice_id', Integer, ForeignKey('hostservice.id'), nullable=False),
    Column('name', String(128), nullable=False),
    
    UniqueConstraint('hostservice_id', 'name', name='uc_plot_1'),
    
    mysql_engine='InnoDB'
)

class Plot(ModelBase):
    plots_cache = set()

    def __init__(self, hostservice, name):
        # TODO: cache should automatically expire unused graphs
        Plot.plots_cache.add(self)

        self.id = None
        self.name = name
        self.hostservice = hostservice
        
        self.current_timestamp = None
        self.max_timestamp = None
        self.current_interval = None
        self.cache_tfs = None
        self.cache_dps = None
        
        self.last_update = None

    def fetchDataPoints(self, conn, timestamp):
        if self.current_timestamp != None and self.current_interval != None and \
                timestamp - timestamp % self.current_interval == self.current_timestamp - \
                self.current_timestamp % self.current_interval:
            return (self.cache_tfs, self.cache_dps)

        tfs = TimeFrame.getAllActiveSorted(conn)
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
            self.max_timestamp = timestamp
        
            for dp in DataPoint.getByTimestamp(conn, self, timestamp, active_tfs_only=True):
                dps[dp.timeframe.interval] = dp

            # having no dps or just the one for the smallest timeframe is OK because in that
            # case we can safely create new empty dps for all the missing timeframes
            if not (len(dps) == 0 or (len(dps) == 1 and tfs[0].interval in dps)):
                print("len(dps) == %d; len(tfs) == %d" % (len(dps), len(tfs)))

                # TODO: this should really be a run-time check and just print a warning + skip the update
                assert(len(dps) == len(tfs))

                self.cache_dps = dps
                return (tfs, dps)
            else:
                self.cache_dps = {}
                
        # BUG: we need to make sure that the number of dps returned
        # by getByTimestamp is equal to the number of active tfs and
        # and skip the update when they're not; make sure not to wipe the
        # cache in this case as this might degrade performance

        self.current_timestamp = timestamp
        
        if timestamp > self.max_timestamp:
            self.max_timestamp = timestamp
        
        for tf in tfs:
            if not tf.interval in dps:
                dp = DataPoint(self, tf,
                               timestamp - timestamp % tf.interval)
                dps[tf.interval] = dp

        self.cache_dps = dps
        
        return (tfs, dps)

    def insertValue(self, conn, timestamp, value):        
        (tfs, dps) = self.fetchDataPoints(conn, timestamp)
        
        prev_dp = None
        
        for tf in reversed(tfs):
            dp = dps[tf.interval]
            
            if prev_dp != None:
                if dp.count > 0:
                    prev_dp.removeValue(dp.avg)
            
            prev_dp = dp
        
        prev_avg = value
        
        for tf in tfs:
            dp = dps[tf.interval]
            
            dp.insertValue(prev_avg)

            prev_avg = dp.avg
    
        self.last_update = timestamp
        
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
            obj.activate()

        return obj

    getByID = staticmethod(getByID)
    
    def getByHostServiceAndName(conn, hostservice, name):
        sel = plot.select().where(and_(plot.c.hostservice_id==hostservice.id, plot.c.name==name))
        result = conn.execute(sel)
        row = result.fetchone()
        
        if row == None:
            return None

        obj = Plot.get(row[plot.c.id])
        
        if obj == None:
            obj = Plot(hostservice, name)
            obj.id = row[plot.c.id]
            obj.activate()

        return obj    

    getByHostServiceAndName = staticmethod(getByHostServiceAndName)
    
    def save(self, conn):
        if self.id == None:
            if self.hostservice.id == None:
                self.hostservice.save()
                
            assert self.hostservice.id != None

            ins = plot.insert().values(hostservice_id=self.hostservice.id, name=self.name)
            result = conn.execute(ins)
            self.id = result.last_inserted_ids()[0]
            self.activate()
        else:
            pass # nothing to do here (yet)

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

    def getAllActiveSorted(conn):
        if TimeFrame.cache_tfs == None:
            sel = timeframe.select().where(timeframe.c.active==True).order_by(timeframe.c.interval.asc())
            
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
    
    getAllActiveSorted = staticmethod(getAllActiveSorted)

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
            upd = timeframe.update().where(id=self.id).values(interval=self.interval,
                                                              retention_period=self.retention_period,
                                                              active=self.active)
            result = conn.execute(upd)
        
        self.invalidateCache()

datapoint = Table('datapoint', metadata,
    Column('id', Integer, Sequence('datapoint_id_seq'), nullable=False, primary_key=True),
    Column('plot_id', Integer, ForeignKey('plot.id'), nullable=False),
    Column('timeframe_id', Integer, ForeignKey('timeframe.id'), nullable=False),
    Column('timestamp', Integer, nullable=False),
    Column('min', Numeric(precision=20, scale=5, asdecimal=False), nullable=False),
    Column('max', Numeric(precision=20, scale=5, asdecimal=False), nullable=False),
    Column('avg', Numeric(precision=20, scale=5, asdecimal=False), nullable=False),
    Column('last', Numeric(precision=20, scale=5, asdecimal=False), nullable=False),
    Column('count', Integer, nullable=False),
    
    UniqueConstraint('plot_id', 'timeframe_id', 'timestamp', name='uc_dp_1'),
    
    mysql_engine='InnoDB'
)

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
        self.last = None
        
        self.saved_min = None
        self.saved_max = None
        self.saved_avg = None
        self.saved_count = None
        self.saved_last = None
        
        '''
        Previous min/max values, these are not stored in the DB
        and are only kept so we can "remove" the last value from the
        min/max columns.
        ''' 
        self.prev_min = 0
        self.prev_max = 0

    def insertValue(self, value):
        value = float(value)

        if self.max == None or value > self.max:
            self.prev_max = self.max
            self.max = value
            
        if self.min == None or value < self.min:
            self.prev_min = self.min
            self.min = value

        self.avg = (self.avg * self.count + value) / (self.count + 1)
        self.count = self.count + 1
        
        self.last = value
        
        self.mark_modified()

    def removeValue(self, value):
        value = float(value)

        if self.count <= 0:
            return
        
        self.count = self.count - 1
                
        self.max = self.prev_max
        self.min = self.prev_min
        
        if self.count > 0:
            self.avg = (self.avg * (self.count + 1) - value) / self.count
        else:
            self.avg = 0.0
            self.prev_min = None
            self.prev_max = None
            
        self.mark_modified()

    def mark_modified(self):
        if self.timeframe.retention_period == None or self.timestamp > time() - self.timeframe.retention_period:            
                self._last_modification = time()
                DataPoint.modified_objects.add(self)

    def save(self, conn):
        if not self.modified():
            return
        
        self._last_modification = None
        self._last_saved = time()

        # make sure we're not wasting DB queries for unchanged objects
        if self.min == self.saved_min and self.max == self.saved_max and \
                self.avg == self.saved_avg and self.count == self.saved_count and \
                self.last == self.saved_last:
            return

        if self.id == None:
            if self.plot.id == None:
                self.plot.save(conn)
                assert self.plot.id != None
            
            if self.timeframe.id == None:
                self.timeframe.save(conn)
                assert self.timeframe.id != None

            ins = datapoint.insert().values(plot_id=self.plot.id, timeframe_id=self.timeframe.id,
                                            timestamp=self.timestamp, min=self.min, max=self.max,
                                            avg=self.avg, last=self.last, count=self.count)
            result = conn.execute(ins)
            self.id = result.last_inserted_ids()[0]
            
            self.activate()
        else:
            upd = datapoint.update().where(datapoint.c.id==self.id).values(min=self.min, max=self.max,
                                            avg=self.avg, last=self.last, count=self.count)
            conn.execute(upd)

        self.saved_min = self.min
        self.saved_max = self.max
        self.saved_avg = self.avg
        self.saved_count = self.count
        self.saved_last = self.last
        
    def modified(self):
        return self.id == None or self._last_modification != None
    
    def should_save(self):
        if not self.modified():
            return False
        
        now = time()
        
        assert self.plot.last_update != None
        
        return self.timestamp != self.plot.last_update - self.plot.last_update % self.timeframe.interval or self._last_saved + randint(300, 900) < now

    def getValuesByInterval(conn, plot, start_timestamp, end_timestamp, granularity, with_virtual_values=False):
        assert start_timestamp < end_timestamp
        assert granularity > 0

        sel = select([datapoint, timeframe],
                     and_(datapoint.c.timeframe_id==timeframe.c.id,
                          datapoint.c.plot_id==plot.id,
                          between(datapoint.c.timestamp, literal(start_timestamp) - literal(start_timestamp) % timeframe.c.interval, end_timestamp)))
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
                'last': row[datapoint.c.last]
            }
            
            items[ts] = item
            
        for obj in DataPoint._getCachedValuesByInterval(plot, start_timestamp, end_timestamp):
            ts = obj.timestamp
            
            if ts in items and obj.timeframe.interval > items[ts]['interval']:
                continue
            
            item = {
                'interval': obj.timeframe.interval,
                'min': obj.min,
                'max': obj.max,
                'avg': obj.avg,
                'last': obj.last
            }
            
            items[ts] = item

        vt_start = start_timestamp        
        vt_values = {}
        vt_keys = sorted(items.keys())
        
        # missing values are considered to be 0 when consolidating
        # datapoints, this might not be entirely accurate. 
        while vt_start < end_timestamp:
            vt_end = vt_start + granularity
            
            vt_value = None
            vt_min_interval = None
            
            for ts in vt_keys:
                item = items[ts]
                
                if ts + item['interval'] < vt_start or ts > vt_end:
                    continue
            
                if vt_min_interval == None or vt_min_interval > item['interval']:
                    vt_min_interval = item['interval']
                    vt_value = None
                
                vt_diff = min(ts + item['interval'], vt_end) - max(ts, vt_start)
                
                if vt_value == None:
                    vt_value = {
                        'min': 0,
                        'max': 0,
                        'avg': 0,
                        'last': None,
                        'virtual': True
                    }
                    
                if vt_start <= ts:
                    vt_value['virtual'] = False

                if item['min'] < vt_value['min']:
                    vt_value['min'] = item['min']
                    
                if item['max'] > vt_value['max']:
                    vt_value['max'] = item['max']
                    
                vt_value['avg'] += vt_diff * item['avg']
                
                vt_value['last'] = item['last']
            
            if vt_value != None:
                vt_value['min'] = str(vt_value['min'])
                vt_value['max'] = str(vt_value['max'])
                vt_value['avg'] = str(vt_value['avg'] / granularity)
                vt_value['last'] = str(vt_value['last'])
            
                if vt_value['virtual'] == False or with_virtual_values:
                    vt_values[str(vt_start)] = vt_value

            vt_start += granularity
            
        return vt_values

    getValuesByInterval = staticmethod(getValuesByInterval)

    def _getCachedValuesByInterval(plot, start_timestamp, end_timestamp):
        objs = []
        
        for obj in DataPoint.modified_objects:
            if obj.plot == plot and obj.timestamp > start_timestamp and obj.timestamp < end_timestamp:
                objs.append(obj)
                
        return objs

    _getCachedValuesByInterval = staticmethod(_getCachedValuesByInterval)

    def getByTimestamp(conn, plot, timestamp, active_tfs_only=False):
        timestamp = int(timestamp)

        # TODO: implement active_tfs_only flag (i.e. return dps only for active timeframes)

        sel = datapoint.select().where(and_(datapoint.c.timeframe_id==timeframe.c.id, datapoint.c.plot_id==plot.id,
                                                            datapoint.c.timestamp==literal(timestamp) - literal(timestamp) % timeframe.c.interval
                                                            ))
        objs = set()
        
        for row in conn.execute(sel):
            obj = DataPoint.get(row[datapoint.c.id])
            
            if obj == None:
                '''
                lazy-load timeframe rather than using a join, rationale for this
                is that they're usually cached already anyway
                '''
                tf = TimeFrame.getByID(conn, row[datapoint.c.timeframe_id])

                obj = DataPoint(plot, tf, row[datapoint.c.timestamp])
                obj.min = row[datapoint.c.min]
                obj.max = row[datapoint.c.max]
                obj.avg = row[datapoint.c.avg]
                obj.last = row[datapoint.c.last]
                obj.count = max(0, row[datapoint.c.count])
                                
                obj.id = row[datapoint.c.id]
                obj.activate()

            objs.add(obj)
    
        for obj in DataPoint.modified_objects:
            if obj.plot == plot and obj.timestamp == timestamp - timestamp % obj.timeframe.interval:
                objs.add(obj)
        
        return objs
        
    getByTimestamp = staticmethod(getByTimestamp)
    
    def syncSomeObjects(conn, partial_sync=False):
        count = 0
        
        # the maximum number of objects we are going to save this time (unless partial_sync == False)
        save_quota = max(500, DataPoint.last_sync_remaining_count / 20)
    
        trans = conn.begin()
    
        remaining_objects = set()
        left_over_count = 0
    
        for obj in DataPoint.modified_objects:
            if not obj.modified() and obj.identity() != None:
                continue
            
            if partial_sync:
                if not obj.should_save():
                    remaining_objects.add(obj)  
                    continue
    
                if count >= save_quota:
                    remaining_objects.add(obj)
                    left_over_count += 1
                    continue
    
            obj.save(conn)
            count += 1            
        
        trans.commit()
        
        DataPoint.last_sync_remaining_count = left_over_count
        
        print("modified objects: %d -> %d, saved %d, still need to save: %d" %
              (len(DataPoint.modified_objects), len(remaining_objects), count, left_over_count))

        if not partial_sync:
            assert len(remaining_objects) == 0
    
        DataPoint.modified_objects = remaining_objects
        
    syncSomeObjects = staticmethod(syncSomeObjects)

'''
creates a DB connection
'''
def create_model_conn(dsn):
    global dbload_max_timestamp

    engine = create_engine(dsn)
    
    conn = engine.connect()

    # sqlite3-specific optimization
    try:
        conn.execute('PRAGMA journal_mode=WAL')
    except ProgrammingError:
        pass

    metadata.create_all(engine)

    sel = select([func.max(datapoint.c.timestamp, type_=Integer).label('maxtimestamp')])
    dbload_max_timestamp = conn.execute(sel).scalar()

    return conn

'''
Syncs (parts of) the session.
'''
def sync_model_session(conn, partial_sync=False):
    global last_vacuum

    DataPoint.syncSomeObjects(conn, partial_sync)

    if last_vacuum + 12 * 3600 < time():
        try:
            conn.execute('VACUUM')
        except ProgrammingError:
            pass
        
        last_vacuum = time()
