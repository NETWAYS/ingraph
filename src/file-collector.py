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

class PerfdataParser(object):
    _perfRegex = re.compile('([^= ][^=]*)=([^ ]+)')
    _intRegex = re.compile('^([+-]?[0-9,.]+)[ ]*([KMGTPE]?[Bb]|[um]?s|c|%)?$')
    
    _bytesuffixes = {
        'B': 1024**0,
        'KB': 1024**1,
        'MB': 1024**2,
        'GB': 1024**3,
        'TB': 1024**4,
        'PB': 1024**5,
        'EB': 1024**6
    }
    
    _timesuffixes = {
        's': 10**0,
        'ms': 10**(-3),
        'us': 10**(-6)
    }
    
    # TODO: fix
    def _parsePerfdataInteger(raw_value):
        raw_value = raw_value.strip()
               
        if raw_value == '':
            return None
                
        match = PerfdataParser._intRegex.match(raw_value)
        
        if not match:
            print("Failed to parse perfdata integer: %s" % (raw_value))
            return None
        
        try:
            value = float(match.group(1))
        except ValueError:
            print("Failed to parse perfdata integer: %s" % (raw_value))
            return None
            
        unit = match.group(2)
        
        if unit == None:
            uom = 'raw'
            result_value = value
        elif unit == '%':
            uom = 'percent'
            result_value = value
        elif unit.upper() in PerfdataParser._bytesuffixes:
            uom = 'byte'
            result_value = value * PerfdataParser._bytesuffixes[unit.upper()]
        elif unit in PerfdataParser._timesuffixes:
            uom = 'time'
            result_value = value * PerfdataParser._timesuffixes[unit] 
        elif unit == 'c':
            uom = 'counter'
            result_value = value
        else:
            return None
        
        return {
            'value': result_value,
            'uom': uom
        }
    
    _parsePerfdataInteger = staticmethod(_parsePerfdataInteger)
    
    def parse(perfdata):
        labels = ['value', 'warn', 'crit', 'min', 'max']

        if '.' in perfdata and ',' in perfdata:
            perfdata = perfdata.replace(',', ';')
        else:
            perfdata = perfdata.replace(',', '.')
 
        matches = PerfdataParser._perfRegex.findall(perfdata)
        
        plots = {}
        
        for match in matches:
            key = match[0]
            values = match[1].split(';')
            
            for i in range(0, len(labels)):
                if len(values) > i:
                    result = PerfdataParser._parsePerfdataInteger(values[i])
                    
                    if result != None:
                        plots[key + labels[i]] = result
        
        return plots
        
    parse = staticmethod(parse)

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
    
    perfresults = PerfdataParser.parse(logdata['perf'])
    
    for plotname in perfresults:
        perfresult = perfresults[plotname]

        update = (logdata['host'], logdata['service'], plotname, logdata['timestamp'], str(perfresult['value']))
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
