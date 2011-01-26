'''
Created on 17.01.2011

@author: gunnar
'''

from sqlalchemy import MetaData, UniqueConstraint, Table, Column, Integer, \
    Boolean, Numeric, String, Sequence, ForeignKey, create_engine, and_
from sqlalchemy.sql.expression import literal, select, between
from time import time
from weakref import WeakValueDictionary
from sqlalchemy.exc import ProgrammingError

last_update = None
last_vacuum = 0
max_update = None

class ModelBase(object):
    '''
    a dictionary containing weak references to all active
    objects (grouped by class) which have an identity
    (i.e. id column is not NULL) - this is used by get() to
    retrieve existing instances
    '''
    active_objects = dict()

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
    Column('id', Integer, Sequence('host_id_seq'), primary_key=True),
    Column('name', String(128), unique=True),
    
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
            # TODO: should probably just throw an exception instead
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
    Column('id', Integer, Sequence('service_id_seq'), primary_key=True),
    Column('name', String(128), unique=True),
    
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
            # TODO: should probably just throw an exception instead
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
    Column('id', Integer, Sequence('hostservice_id_seq'), primary_key=True),
    Column('host_id', Integer, ForeignKey('host.id')),
    Column('service_id', Integer, ForeignKey('service.id')),
    
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
            # TODO: should probably just throw an exception instead
            # as changing a service's name doesn't make any sense
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
    Column('id', Integer, Sequence('plot_id_seq'), primary_key=True),
    Column('hostservice_id', Integer, ForeignKey('hostservice.id')),
    Column('name', String(128)),
    
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
        self.current_interval = None
        self.cache_tfs = None
        self.cache_dps = None

    def fetchDataPoints(self, conn, timestamp):
        if self.current_timestamp != None and self.current_interval != None and \
                timestamp - timestamp % self.current_interval == self.current_timestamp - \
                self.current_timestamp % self.current_interval:
            return (self.cache_tfs, self.cache_dps)

        tfs = TimeFrame.getAllActiveSorted(conn)
        dps = dict()

        # if timestamp > current_timestamp
        #    re-use dps from cache_dps
        # else
        #    clear current_timestamp
        #    query database (ugh, slow)
        #
        # create dps for missing intervals
        
        # BUG: must re-load datapoints from DB when switching to a later
        # time interval unless the new timestamp is past "MAX(timestamp) FROM datapoint"

        if self.current_timestamp != None and timestamp > self.current_timestamp:
            for dp in self.cache_dps.values():
                if dp.timestamp == timestamp - timestamp % dp.timeframe.interval:
                    dps[dp.timeframe.interval] = dp
        else:
            self.current_timestamp = None
        
            for dp in DataPoint.getByTimestamp(conn, self, timestamp):
                dps[dp.timeframe.interval] = dp

        self.current_timestamp = timestamp
        self.current_interval = None
        
        for tf in tfs:
            if self.current_interval == None:
                self.current_interval = tf.interval
                
            if not tf.interval in dps:
                dp = DataPoint(self, tf,
                               timestamp - timestamp % tf.interval)
                dps[tf.interval] = dp

        self.cache_tfs = tfs
        self.cache_dps = dps
        
        return (tfs, dps)

    def insertValue(self, conn, timestamp, value):
        global last_update
        
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
    
            last_update = timestamp
    
    def getByID(conn, id):
        obj = Plot.get(id)
        
        if obj == None:
            sel = plot.select().where(plot.c.id==id)
            res = conn.execute(sel)
            row = res.fetchone()
            
            assert row != None

            obj = Plot()
            obj.id = row[plot.c.id]
            obj.hostservice= HostService.getByID(conn, row[plot.c.hostservice_id])
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
    Column('id', Integer, Sequence('timeframe_id_seq'), primary_key=True),
    Column('interval', Integer),
    Column('active', Boolean),
    
    mysql_engine='InnoDB'
)

class TimeFrame(ModelBase):    
    cache_tfs = None
    
    def __init__(self, interval, active=True):
        self.id = None
        self.interval = interval
        self.active = active

    def getAllActiveSorted(conn):
        if TimeFrame.cache_tfs == None:
            sel = timeframe.select().where(timeframe.c.active==True).order_by(timeframe.c.interval.asc())
            
            objs = []
            
            for row in conn.execute(sel):
                id = row[timeframe.c.id]
                obj = TimeFrame.get(id)
                
                if obj == None:
                    obj = TimeFrame(row[timeframe.c.interval], row[timeframe.c.active])
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
            obj.active = row[timeframe.c.active]
            obj.activate()
            
        return obj
        
    getByID = staticmethod(getByID)

    def invalidateCache():
        TimeFrame.cache_tfs = None
        
    invalidateCache = staticmethod(invalidateCache)
    
    def save(self, conn):
        if self.id == None:
            ins = timeframe.insert().values(interval=self.interval, active=self.active)
            result = conn.execute(ins)
            self.id = result.last_inserted_ids()[0]
            self.activate()
        else:
            upd = timeframe.update().where(id=self.id).values(interval=self.interval, active=self.active)
            result = conn.execute(upd)
        
        self.invalidateCache()

datapoint = Table('datapoint', metadata,
    Column('id', Integer, Sequence('datapoint_id_seq'), primary_key=True),
    Column('plot_id', Integer, ForeignKey('plot.id')),
    Column('timeframe_id', Integer, ForeignKey('timeframe.id')),
    Column('timestamp', Integer),
    Column('min', Numeric(precision=20, scale=5, asdecimal=False)),
    Column('max', Numeric(precision=20, scale=5, asdecimal=False)),
    Column('avg', Numeric(precision=20, scale=5, asdecimal=False)),
    Column('current', Numeric(precision=20, scale=5, asdecimal=False)),
    Column('count', Integer),
    
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
        self.current = None
        
        '''
        Previous min/max values, these are not stored in the DB
        and are only kept so we can "remove" the last value from the
        min/max columns.
        ''' 
        self.prev_min = 0
        self.prev_max = 0

    def __del__(self):
        if self.modified():
            DataPoint.modified_objects.add(self)

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
        
        self.current = value
        
        self._last_modification = time()
        DataPoint.modified_objects.add(self)

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
            
        self._last_modification = time()
        DataPoint.modified_objects.add(self)

    def save(self, conn):
        if not self.modified():
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
                                            avg=self.avg, current=self.current, count=self.count)
            result = conn.execute(ins)
            self.id = result.last_inserted_ids()[0]
            
            self.activate()
        else:
            upd = datapoint.update().where(datapoint.c.id==self.id).values(min=self.min, max=self.max,
                                            avg=self.avg, current=self.current, count=self.count)
            conn.execute(upd)
        
        self._last_modification = None
        self._last_saved = time()

    def modified(self):
        return self.id == None or self._last_modification != None
    
    def should_save(self):
        if not self.modified():
            return False
        
        now = time()
        
        return self.timestamp != last_update - last_update % self.timeframe.interval or self._last_saved + 900 < now

    def getValuesByInterval(conn, plot, start_timestamp, end_timestamp, granularity, with_virtual_values=False):
        assert start_timestamp < end_timestamp
        assert granularity > 0

        sel = select([datapoint, timeframe],
                     and_(datapoint.c.timeframe_id==timeframe.c.id,
                          datapoint.c.plot_id==plot.id,
                          between(datapoint.c.timestamp, start_timestamp, end_timestamp)))
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
                'current': row[datapoint.c.current]
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
                'current': obj.current
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
                        'current': None,
                        'virtual': True
                    }
                    
                if vt_start <= ts:
                    vt_value['virtual'] = False

                if item['min'] < vt_value['min']:
                    vt_value['min'] = item['min']
                    
                if item['max'] > vt_value['max']:
                    vt_value['max'] = item['max']
                    
                vt_value['avg'] += vt_diff * item['avg']
                
                vt_value['current'] = item['current']
            
            if vt_value != None:
                vt_value['min'] = str(vt_value['min'])
                vt_value['max'] = str(vt_value['max'])
                vt_value['avg'] = str(vt_value['avg'] / granularity)
                vt_value['current'] = str(vt_value['current'])
            
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

    def getByTimestamp(conn, plot, timestamp):
        timestamp = int(timestamp)

        sel = datapoint.select().where(and_(datapoint.c.timeframe_id==timeframe.c.id, datapoint.c.plot_id==plot.id,
                                                            datapoint.c.timestamp==literal(timestamp) - literal(timestamp) % timeframe.c.interval
                                                            ))
        objs = []
        
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
                obj.current = row[datapoint.c.current]
                obj.count = max(0, row[datapoint.c.count])
                                
                obj.id = row[datapoint.c.id]
                obj.activate()

            objs.append(obj)
            
        return objs
        
    getByTimestamp = staticmethod(getByTimestamp)
    
    def syncSomeObjects(conn, partial_sync=False):
        count = 0
        
        save_quota = max(1500, DataPoint.last_sync_remaining_count / 20)
    
        trans = conn.begin()
    
        remaining_objects = set()
        left_over_count = 0
    
        for obj in DataPoint.modified_objects:
            # make sure we don't have any unmodified objects in the set, this would be a bug
            assert obj.modified() or obj.identity() == None
            
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
    engine = create_engine(dsn)
    
    conn = engine.connect()

    # sqlite3-specific optimization
    try:
        conn.execute('PRAGMA journal_mode=WAL')
    except ProgrammingError:
        pass

    metadata.create_all(engine)

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
