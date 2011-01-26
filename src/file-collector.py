#!/usr/bin/env python
import sys
import re
from time import time
from xmlrpclib import ServerProxy, MultiCall
import pickle
from grapherutils import load_config

print("NETWAYS Grapher V3 (file collector)")

config = load_config('grapher-xmlrpc.conf')

url = "http://%s:%s@%s:%s/" % (config['xmlrpc_username'], config['xmlrpc_password'],
                               config['xmlrpc_address'], config['xmlrpc_port'])

api = ServerProxy(url, allow_none=True)

last_flush = time()
line_count = 0
ts_old = 0

updates = []

# TODO: fix
def sanitizeInteger(value):
    try:
        return int(value)
    except:
        return 0

class GenericPerfdataParser(object):
    _perfRegex = re.compile('([^= ][^=]*)=([^ ]+)')
    
    def parse(self, perfdata):
        matches = GenericPerfdataParser._perfRegex.findall(perfdata)
        
        data = {}
        
        for match in matches:
            key = match[0]
            values = match[1].split(';')
            
            if len(values) >= 1:
                data[key + '_value'] = sanitizeInteger(values[0])
                
            if len(values) >= 2:
                data[key + '_warn'] = sanitizeInteger(values[1])
                
            if len(values) >= 3:
                data[key + '_crit'] = sanitizeInteger(values[2])
                
            if len(values) >= 4:
                data[key + '_min'] = sanitizeInteger(values[3])
                
            if len(values) >= 5:
                data[key + '_max'] = sanitizeInteger(values[4])

        return data

parsers = []
parsers.append(GenericPerfdataParser())

while  True:
    line = sys.stdin.readline()
        
    if not line:
        break;
    
    line_count += 1
    
    data = line.strip().split('\t')
    
    if len(data) < 4:
        continue
    elif len(data) < 5:
        data.append(time())
    
    logdata = {
        'host': data[0],
        'service': data[1],
        'text': data[2],
        'perf': data[3],
        'timestamp': int(data[4])
    }
    
    for parser in parsers:
        perfdata = parser.parse(logdata['perf'])
        
        if perfdata != None:
            break
    
    if perfdata == None:
        continue

    for plotname in perfdata.keys():
        update = (logdata['host'], logdata['service'], plotname, logdata['timestamp'], str(perfdata[plotname]))
        updates.append(update)

    now = time()
    if last_flush + 30 < now or len(updates) > 50000:
        st = time()
        api.insertValueBulk(pickle.dumps(updates))
        et = time()
        print("%d updates (%d lines) took %f seconds (ts-diff: %s seconds)" % (len(updates), line_count, et - st, logdata['timestamp'] - ts_old))
        updates = []
        line_count = 0
        last_flush = time()
        ts_old = logdata['timestamp']

api.insertValueBulk(pickle.dumps(updates))
