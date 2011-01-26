#!/usr/bin/env python
from xmlrpclib import ServerProxy

api = ServerProxy('http://localhost:5000/', allow_none=True)

vals = api.getPlotValues('tradoria-lb', 'lx-ipvs images.tradoria.de:80',
                  'active connections_value', 1294066800, 1294071600, (1294071600 - 1294066800) / 20, True)

print 'var data = [ null, null,'

i = 0
for key in sorted(vals.keys()):
    print '[ %d, %f ],' % (int(key) * 1000, float(vals[key]['avg']))
    
    i += 1

print ']'