#!/usr/bin/env python
'''
Created on 28.01.2011

@author: gunnar
'''

from xmlrpclib import ServerProxy, MultiCall
import pickle
from grapherutils import load_config
import getpass
from sqlalchemy.schema import MetaData, Table
from sqlalchemy.engine import create_engine
from sqlalchemy.sql.expression import select, join, func, and_
import time
import MySQLdb.cursors
import datetime
import math

print("NETWAYS Grapher V3 (V2 import)")

config = load_config('grapher-xmlrpc.conf')

url = "http://%s:%s@%s:%s/" % (config['xmlrpc_username'], config['xmlrpc_password'],
                               config['xmlrpc_address'], config['xmlrpc_port'])

api = ServerProxy(url, allow_none=True)

default_hostname = '127.0.0.1'
default_port = '3306'
default_database = 'grapherv2'
default_username = 'root'

hostname = raw_input('MySQL hostname [%s]: ' % (default_hostname))

if hostname.strip() == '':
    hostname = default_hostname

valid = False

while not valid:
    port = raw_input('MySQL port [%s]: ' % (default_port))
    
    if port == '':
        port = default_port
    
    try:
        port = int(port)
        
        valid = True
    except ValueError:
        print("Port must be a number. Please try again.")

database = raw_input('MySQL database [%s]: ' % (default_database))

if database.strip() == '':
    database = default_database

username = raw_input('MySQL username [%s]: ' % (default_username))

if username.strip() == '':
    username = default_username

password = getpass.getpass('MySQL password [<empty>]: ')

dsn = 'mysql://%s:%s@%s:%d/%s' % (username, password, hostname, port, database)

engine = create_engine(dsn, connect_args={'cursorclass': MySQLdb.cursors.SSCursor})

metadata = MetaData()
metadata.bind = engine
metadata.reflect()

agts = [
    ('none', 300),
    ('hour', 60*60),
    ('day', 60*60*24),
    ('week', 60*60*24*7),
    ('month', 60*60*24*31),
    ('year', 60*60*24*365)
]

ng_data = metadata.tables['ng_data']
ng_perf = metadata.tables['ng_perf']
ng_host = metadata.tables['ng_host']
ng_service = metadata.tables['ng_service']
ng_host_service = metadata.tables['ng_host_service']
ng_aggregate_type = metadata.tables['ng_aggregate_type']
ng_perf_type = metadata.tables['ng_perf_type']

sel = select([ng_aggregate_type.c.aggretype_name, func.min(ng_perf.c.perf_created).label('min_ts')], \
             from_obj=[ng_perf.join(ng_aggregate_type)]) \
             .group_by(ng_aggregate_type.c.aggretype_name)

min_info = dict()
for row in sel.execute():
    min_info[row[ng_aggregate_type.c.aggretype_name]] = row['min_ts']

processed = []

for (name, interval) in reversed(agts):
    processed.append(name)

    api.createTimeFrame(interval, None)
    
    data_join = ng_data.join(ng_perf).join(ng_host_service).join(ng_host).join(ng_service) \
                .join(ng_aggregate_type).join(ng_perf_type)
    cond = and_(ng_aggregate_type.c.aggretype_name==name, ng_perf_type.c.perftype_name=='RAW')
    sel = select([ng_host.c.host_name, ng_service.c.service_name, ng_data.c.data_key, \
            ng_data.c.data_value, ng_perf.c.perf_created], from_obj=[data_join])
    
    ts_limit = None
    
    for key in min_info:
        ts = min_info[key]

        if key not in processed and (ts_limit == None or ts_limit > ts):
            ts_limit = ts

    if ts_limit != None:
        cond = and_(cond, ng_perf.c.perf_created < ts_limit)

    
    sel = sel.where(cond).order_by(ng_perf.c.perf_created.asc())
    
    result = sel.execution_options(stream_results=True).execute()
    
    updates = []
    ts_old = 0
    
    row_num = 0
    
    for row in result:
        row_num += 1
        
        ts = int(time.mktime(row[ng_perf.c.perf_created].timetuple()))
        
        update = (row[ng_host.c.host_name], row[ng_service.c.service_name], \
                  row[ng_data.c.data_key], ts, float(row[ng_data.c.data_value]), interval)
        
        updates.append(update)
        
        if len(updates) >= 25000:
            st = time.time()
            api.insertValueBulk(pickle.dumps(updates))
            et = time.time()
            print("%d updates took %f seconds; %d rows (ts-diff: %s seconds)" % (len(updates), et - st, row_num, ts - ts_old))
            updates = []
            ts_old = ts
            row_num = 0

    api.insertValueBulk(pickle.dumps(updates))
