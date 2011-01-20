'''
Created on 17.01.2011

@author: gunnar
'''

from sqlalchemy import MetaData, Table, Column, Integer, Boolean, Numeric, Sequence, ForeignKey
from sqlalchemy import create_engine, and_
from time import time
from weakref import WeakValueDictionary

modified_objects = set()

last_update = None
max_update = None

def flush_some_objects(conn, max_fraction=15, flush_all=False):
    global modified_objects

    remaining_objects = set()
    
    count = 0

    len_before = len(modified_objects)

    while True:
        try:
            obj = modified_objects.pop()
        except KeyError:
            break

        if obj.modified() or obj.identity() == None:
            if flush_all or obj.should_save() and (max_fraction == None or len_before / max_fraction > count):
                obj.save(conn)
                count = count + 1
            else:
                remaining_objects.add(obj)
        else:
            print "Unmodified object in modified_objects - odd: {%s, %s}" % (obj.__class__, str(obj.identity()))
    
    print("objects: %d -> %d (saved %d)" % (len_before, len(remaining_objects), count))

    modified_objects = remaining_objects

    if flush_all:
        assert len(modified_objects) == 0

class ModelBase:
    '''
    a dictionary containing weak references to all active
    objects (grouped by class) which have an identity
    (i.e. id column is not NULL)
    '''
    active_objects = dict()

    def __del__(self):
        global modified_objects

        if self.modified():
            modified_objects.add(self)

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
    def get(cls, id):
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

plot = Table('plot', metadata,
    Column('id', Integer, Sequence('plot_id_seq'), primary_key=True)
)

class Plot(ModelBase):
    plots_cache = set()

    def __init__(self):
        # TODO: cache should automatically expire unused graphs
        Plot.plots_cache.add(self)

        self.id = None
        self.current_timestamp = None
        self.current_interval = None
        self.cache_tfs = None
        self.cache_dps = None

        def __del__(self):
            ModelBase.__del__(self)

            if self.cache_dps != None:
                for dp in self.cache_dps:
                    if dp.modified():
                        modified_objects.add(dp)

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
        
        if self.cache_dps != None:
            for dp in self.cache_dps.values():
                if dp.modified():
                    modified_objects.add(dp)

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
                
            if not dps.has_key(tf.interval):
                dp = DataPoint(self, tf,
                               timestamp - timestamp % tf.interval)
                modified_objects.add(dp)
                dps[tf.interval] = dp

        self.cache_tfs = tfs
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
            modified_objects.add(dp)

            prev_avg = dp.avg
    
    def getByID(conn, id):
        obj = Plot.get(id)
        
        if obj == None:
            sel = plot.select().where(plot.c.id==id)
            res = conn.execute(sel)
            row = res.fetchone()

            obj = Plot()
            obj.id = row[plot.c.id]
            obj.activate()

        return obj

    getByID = staticmethod(getByID)
    
    def save(self, conn):
        if self.id == None:
            ins = plot.insert()
            result = conn.execute(ins)
            self.id = result.last_inserted_ids()[0]
            self.activate()
        else:
            pass # nothing to do here (yet)

timeframe = Table('timeframe', metadata,
    Column('id', Integer, Sequence('timeframe_id_seq'), primary_key=True),
    Column('interval', Integer),
    Column('active', Boolean)
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

datapoint = Table('datapoint', metadata,
    Column('id', Integer, Sequence('datapoint_id_seq'), primary_key=True),
    Column('plot_id', Integer, ForeignKey('plot.id')),
    Column('timeframe_id', Integer, ForeignKey('timeframe.id')),
    Column('timestamp', Integer),
    Column('min', Numeric(precision=20, scale=5, asdecimal=False)),
    Column('max', Numeric(precision=20, scale=5, asdecimal=False)),
    Column('avg', Numeric(precision=20, scale=5, asdecimal=False)),
    Column('current', Numeric(precision=20, scale=5, asdecimal=False)),
    Column('count', Integer)
)

class DataPoint(ModelBase):
    def __init__(self, plot, timeframe, timestamp):
        self._last_modification = time()
        self._last_saved = 0

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

    def removeValue(self, value):
        value = float(value)

        if self.avg == None:
            return
        
        self.count = self.count - 1
        
        self.max = self.prev_max
        self.min = self.prev_min
        
        if self.count > 0:
            self.avg = (self.avg * (self.count + 1) - value) / self.count
        else:
            self.avg = 0
            self.prev_min = None
            self.prev_max = None
            
        self._last_modification = time()

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
        
        return self._last_modification + 60 < now or self._last_saved + 900 < now

    def getByTimestamp(conn, plot, timestamp):
        sel = datapoint.select().where(and_(datapoint.c.timeframe_id==timeframe.c.id, datapoint.c.plot_id==plot.id,
                                                            "datapoint.timestamp = %d - %d %% timeframe.interval" % \
                                                            (timestamp, timestamp)))
        objs = []
        
        for row in conn.execute(sel):
            id = row[datapoint.c.id]
            obj = DataPoint.get(id)
            
            if obj == None:
                # lazy-load timeframe rather than using a join, rationale for this
                # is that they're usually cached already anyway
                tf = TimeFrame.get(row[datapoint.c.timeframe_id])
                
                tf = None
                if tf == None:
                    sel_tf = timeframe.select().where(timeframe.c.id==row[datapoint.c.timeframe_id])
                    row_tf = conn.execute(sel_tf).fetchone()
                    tf = TimeFrame(row_tf[timeframe.c.interval], row_tf[timeframe.c.active])
                
                obj = DataPoint(plot, tf, row[datapoint.c.timestamp])
                obj.min = row[datapoint.c.min]
                obj.max = row[datapoint.c.max]
                obj.avg = row[datapoint.c.avg]
                obj.current = row[datapoint.c.current]
                obj.count = row[datapoint.c.count]
                
                obj.id = id
                obj.activate()
                
            objs.append(obj)
            
        return objs
        

    getByTimestamp = staticmethod(getByTimestamp) 

def register_model(engine):
    metadata.create_all(engine)

def create_model_engine(dsn):
    return create_engine(dsn)
