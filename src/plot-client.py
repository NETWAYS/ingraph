#!/usr/bin/env python
from xmlrpclib import ServerProxy
from grapherutils import load_config
from time import time

config = load_config('grapher-xmlrpc.conf')

url = "http://%s:%s@%s:%s/" % (config['xmlrpc_username'], config['xmlrpc_password'],
                               config['xmlrpc_address'], config['xmlrpc_port'])

api = ServerProxy(url, allow_none=True)

et = 1296124500
st = 1296081300 # et - 12*3600
dt = 300

vals = api.getPlotValues('f1-db1', 'MySQL',
                  'time', st, et, dt, False)

print 'var data = [ null, null,'

i = 0
for key in sorted(vals.keys()):
    print '[ %d, %f ],' % (int(key) * 1000, float(vals[key]['avg']))
    
    i += 1

print ']'