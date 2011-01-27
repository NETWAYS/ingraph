#!/usr/bin/env python
from xmlrpclib import ServerProxy
from grapherutils import load_config

config = load_config('grapher-xmlrpc.conf')

url = "http://%s:%s@%s:%s/" % (config['xmlrpc_username'], config['xmlrpc_password'],
                               config['xmlrpc_address'], config['xmlrpc_port'])

api = ServerProxy(url, allow_none=True)

vals = api.getPlotValues('tradoria-lb', 'lx-ipvs images.tradoria.de:80',
                  'active connections_value', 1294068949, 1296113597, (1296113597 - 1294068949) / 20, True)

print 'var data = [ null, null,'

i = 0
for key in sorted(vals.keys()):
    print '[ %d, %f ],' % (int(key) * 1000, float(vals[key]['avg']))
    
    i += 1

print ']'