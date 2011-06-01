'''
Created on 17.01.2011

@author: gunnar
'''

from sqlalchemy import MetaData, UniqueConstraint, Table, Column, Integer, \
    Boolean, Numeric, String, Enum, Sequence, ForeignKey, Index, create_engine, \
    and_, or_
from sqlalchemy.sql import literal, select, between, func
from sqlalchemy.interfaces import PoolListener
from time import time
from weakref import WeakValueDictionary
from OrderedDict import OrderedDict

last_vacuum = time()
last_cleanup = time()
last_autocheckpoint = time()
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
    
    UniqueConstraint('host_id', 'service_id', 'parent_hostservice_id', name='uc_hs_1'),
    
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

    def getByHostAndServicePattern(conn, host_pattern, service_pattern, limit=None, offset=None):
        if host_pattern == None or host_pattern == '':
            host_pattern = '%'

        if service_pattern == None or service_pattern == '':
            service_pattern = '%'
            
        cond = and_(host.c.name.like(host_pattern), \
                    service.c.name.like(service_pattern))

        from_obj = hostservice.join(service).join(host)

        sel = select([func.count()], from_obj=[from_obj]).where(cond)
        total = conn.execute(sel).scalar()
        
        if limit == None and offset == None:
            sel = hostservice.select(from_obj=[from_obj])
        else:
            sel = hostservice.select(from_obj=[from_obj], limit=limit, offset=offset)
            
        # TODO: find matching sub-services with matching parent_service
                    
        sel = sel.where(cond)
        result = conn.execute(sel)
        
        objs = []
        
        for row in result:
            obj = HostService.get(row[hostservice.c.id])
            
            if obj == None:
                hst = Host.getByID(conn, row[hostservice.c.host_id])
                svc = Service.getByID(conn, row[hostservice.c.service_id])
                    
                if row[hostservice.c.parent_hostservice_id] != None:
                    phs = HostService.getByID(conn, row[hostservice.c.parent_hostservice_id])
                else:
                    phs = None

                obj = HostService(hst, svc, phs)
                obj.id = row[hostservice.c.id]
                obj.activate()
                
            objs.append(obj)

        return {
                'services': objs,
                'total': total
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

    def buildUpdateQueries(self, conn, timestamp, unit, value, min, max, lower_limit, upper_limit,
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
            return []

        if min == None or min > value:
            min = value
            
        if max == None or max < value:
            max = value

        now = time()

        queries = []
        for tf in tfs:
            if tf.retention_period != None and now - timestamp > tf.retention_period:
                continue

            values = {
                'plot_id': self.id,
                'timeframe_id': tf.id,
                'timestamp': timestamp - timestamp % tf.interval,
                'min': min,
                'max': max,
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

    def _quoteNumber(value):
        if value == None:
            return 'NULL'
        else:
            return "'%s'" % (value)
        
    _quoteNumber = staticmethod(_quoteNumber)

    def executeUpdateQueries(conn, queries):
        print "executeUpdateQueries"

        if conn.dialect.name == 'mysql':
            sql_values = ', '.join(["""
(%s, %s, %s,
 %s, %s, %s, %s,
 %s, %s,
 %s, %s, %s,
 %s, %s, %s)
""" % (Plot._quoteNumber(query['plot_id']), Plot._quoteNumber(query['timeframe_id']), Plot._quoteNumber(query['timestamp']),
       Plot._quoteNumber(query['min']), Plot._quoteNumber(query['max']), Plot._quoteNumber(query['avg']), Plot._quoteNumber(query['count']),
       Plot._quoteNumber(query['lower_limit']), Plot._quoteNumber(query['upper_limit']),
       Plot._quoteNumber(query['warn_lower']), Plot._quoteNumber(query['warn_upper']), Plot._quoteNumber(query['warn_type']),
       Plot._quoteNumber(query['crit_lower']), Plot._quoteNumber(query['crit_upper']), Plot._quoteNumber(query['crit_type']))
                              for query in queries])

            sql_query = """
INSERT DELAYED INTO datapoint (plot_id, timeframe_id, timestamp,
                       min, max, avg, count,
                       lower_limit, upper_limit,
                       warn_lower, warn_upper, warn_type,
                       crit_lower, crit_upper, crit_type)
VALUES
%s
ON DUPLICATE KEY UPDATE avg = count * (avg / (count + 1)) + VALUES(avg) / (count + 1),
                        count = count + 1,
                        min = IF(min < VALUES(min), min, VALUES(min)),
                        max = IF(max > VALUES(max), max, VALUES(max))
""" % (sql_values)

            conn.execute(sql_query)
        else:
            # TODO: fix this mess, need to consider each plot's max_timestamp, rather than just dbload_max_timestamp
            dps = {}
            conds = []
            for query in queries:
                dps[(query['plot_id'], query['timeframe_id'], query['timestamp'])] = query
                
                if query['timestamp'] > dbload_max_timestamp:
                    continue
                
                cond = and_(datapoint.c.plot_id==query['plot_id'],
                            datapoint.c.timeframe_id==query['timeframe_id'],
                            datapoint.c.timestamp==query['timestamp'])
                conds.append(cond)

            dpsdb = {}
            
            if len(conds) > 0:
                result = conn.execute(select(columns=[datapoint.c.plot_id, datapoint.c.timeframe_id,
                                                        datapoint.c.timestamp, datapoint.c.min,
                                                        datapoint.c.max], from_obj=[datapoint]).where(or_(*conds)))
    
                for row in result:
                    dp = (row[datapoint.c.plot_id], row[datapoint.c.timeframe_id], row[datapoint.c.timestamp])
                    dpsdb[dp]= row

            inserts = []
            updates = []

            for dp, query in dps.items():
                row = {}

                if dp in dpsdb:
                    row = dpsdb[dp]
                    # update
                    print "UPDATE"
                    pass
                else:
                    print "INSERT"

                    row = {
                        datapoint.c.min: query['min'],
                        datapoint.c.max: query['max']
                    }

                    inserts.append(query)
                    pass
                
                dpsdb[dp] = row

            conn.execute(datapoint.insert(), inserts)
            
            for update in updates:
                pass

#            for dp, query in dps:
#                # TODO: support for min/max values
#                values = {
#                    'avg': datapoint.c.count * (datapoint.c.avg / (datapoint.c.count + 1)) + query['avg'] / (datapoint.c.count + 1),
#                    'count': datapoint.c.count + 1
#                }
#
#                result = conn.execute(datapoint.update().where(and_(datapoint.c.plot_id==query['plot_id'],
#                                                                    datapoint.c.timeframe_id==query['timeframe_id'],
#                                                                    datapoint.c.timestamp==query['timestamp'])),
#                                      [values])
#                
#                if result.rowcount == 0:
#                    conn.execute(datapoint.insert(), [query])
    
    executeUpdateQueries = staticmethod(executeUpdateQueries)

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
                self.hostservice.save(conn)
                
            assert self.hostservice.id != None

            ins = plot.insert().values(hostservice_id=self.hostservice.id, name=self.name, unit=self.unit)
            result = conn.execute(ins)
            self.id = result.last_inserted_ids()[0]
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

    def getAll(conn):
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
    
    getAll = staticmethod(getAll)

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
    Column('warn_lower', Numeric(precision=20, scale=5, asdecimal=False), nullable=True),
    Column('warn_upper', Numeric(precision=20, scale=5, asdecimal=False), nullable=True),
    Column('warn_type', Enum('inside', 'outside'), nullable=True),
    Column('crit_lower', Numeric(precision=20, scale=5, asdecimal=False), nullable=True),
    Column('crit_upper', Numeric(precision=20, scale=5, asdecimal=False), nullable=True),
    Column('crit_type', Enum('inside', 'outside'), nullable=True),
    Column('count', Integer, nullable=False),
)

Index('idx_dp_1', datapoint.c.timeframe_id, datapoint.c.timestamp)
Index('idx_dp_2', datapoint.c.timestamp)

class DataPoint(object):
    def getValuesByInterval(conn, plots, start_timestamp=None, end_timestamp=None, granularity=None):
        if len(plots) == 0:
            return {}

        if end_timestamp < start_timestamp:
            tmp = end_timestamp
            end_timestamp = start_timestamp
            start_timestamp = tmp

        tfs = TimeFrame.getAll(conn)

        if start_timestamp == None:
            start_timestamp = 0
            
        if end_timestamp == None:
            end_timestamp = time()

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

        assert granularity > 0
        
        # properly align interval with the timeframe
        start_timestamp = start_timestamp - start_timestamp % granularity
        
        plot_conds = or_(*[datapoint.c.plot_id==plot.id for plot in plots])
        sel = select([datapoint],
                     and_(datapoint.c.timeframe_id==data_tf.id,
                          plot_conds,
                          between(datapoint.c.timestamp, literal(start_timestamp) - literal(start_timestamp) % data_tf.interval, end_timestamp))) \
                .order_by(datapoint.c.timestamp.asc())
        result = conn.execute(sel)
        
        rows = list(result)
        
        charts = OrderedDict()

        for plot in plots:
            chart = {}
            
            for type in ['upper_limit', 'max', 'avg', 'min', 'lower_limit',
                             'warn_lower', 'warn_upper', 'warn_type', 'crit_lower',
                             'crit_upper', 'crit_type']:
                chart[type] = []

            prev_row = None
            
            for row in rows:
                if row[datapoint.c.plot_id] != plot.id:
                    continue
                
                ts = row[datapoint.c.timestamp]
                
                if prev_row != None and \
                        row[datapoint.c.timestamp] - prev_row[datapoint.c.timestamp] > 2 * granularity:
                    ts_null = prev_row[datapoint.c.timestamp] + (row[datapoint.c.timestamp] - prev_row[datapoint.c.timestamp]) / 2
                    chart['min'].append({'x': ts_null, 'y': None})
                    chart['max'].append({'x': ts_null, 'y': None})
                    chart['avg'].append({'x': ts_null, 'y': None})
    
                    chart['lower_limit'].append({'x': ts_null, 'y': None})
                    chart['upper_limit'].append({'x': ts_null, 'y': None})
    
                    chart['warn_lower'].append({'x': ts_null, 'y': None})
                    chart['warn_upper'].append({'x': ts_null, 'y': None})
                    chart['warn_type'].append({'x': ts_null, 'y': None})
    
                    chart['crit_lower'].append({'x': ts_null, 'y': None})
                    chart['crit_upper'].append({'x': ts_null, 'y': None})
                    chart['crit_type'].append({'x': ts_null, 'y': None})

                chart['min'].append({'x': ts, 'y': row[datapoint.c.min]})
                chart['max'].append({'x': ts, 'y': row[datapoint.c.max]})
                chart['avg'].append({'x': ts, 'y': row[datapoint.c.avg]})

                chart['lower_limit'].append({'x': ts, 'y': row[datapoint.c.lower_limit]})
                chart['upper_limit'].append({'x': ts, 'y': row[datapoint.c.upper_limit]})

                chart['warn_lower'].append({'x': ts, 'y': row[datapoint.c.warn_lower]})
                chart['warn_upper'].append({'x': ts, 'y': row[datapoint.c.warn_upper]})
                chart['warn_type'].append({'x': ts, 'y': row[datapoint.c.warn_type]})

                chart['crit_lower'].append({'x': ts, 'y': row[datapoint.c.crit_lower]})
                chart['crit_upper'].append({'x': ts, 'y': row[datapoint.c.crit_upper]})
                chart['crit_type'].append({'x': ts, 'y': row[datapoint.c.crit_type]})
                
                prev_row = row
                
            charts[plot] = chart
            
        return charts

    getValuesByInterval = staticmethod(getValuesByInterval)

    def cleanupOldData(conn):
        tfs = TimeFrame.getAll(conn)

        for tf in tfs:
            if tf.retention_period == None:
                continue
        
            delsql = datapoint.delete(and_(datapoint.c.timeframe_id==tf.id, datapoint.c.timestamp < time() - tf.retention_period))
            
            conn.execute(delsql)
    
    cleanupOldData = staticmethod(cleanupOldData)

class SetTextFactory(PoolListener):
    def connect(self, dbapi_con, con_record):
        dbapi_con.text_factory = str

'''
creates a DB connection
'''
def createModelEngine(dsn):
    global dbload_max_timestamp

    engine = create_engine(dsn, listeners=[SetTextFactory()], pool_size=50, max_overflow=0)

    #engine.echo = True

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
    
#    Plot.compile_query(conn)

    sel = select([func.max(datapoint.c.timestamp, type_=Integer).label('maxtimestamp')])
    dbload_max_timestamp = conn.execute(sel).scalar()
    
    if dbload_max_timestamp == None:
        dbload_max_timestamp = 0

    conn.close()

    return engine

'''
Runs regular maintenance tasks:

* Running VACUUM on the database
* Cleaning up old datapoints
'''
def runMaintenanceTasks(conn):
    global last_vacuum, last_cleanup, last_autocheckpoint

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
