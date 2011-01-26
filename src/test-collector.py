#!/usr/bin/env python
from xmlrpclib import ServerProxy, MultiCall
from time import time
from random import randint
from time import time

api = ServerProxy('http://localhost:5000/')

api.createTimeFrame(5*60)
api.createTimeFrame(60*60)
api.createTimeFrame(24*60*60)
api.createTimeFrame(30*24*60*60)
api.createTimeFrame(365*24*60*60)

host = api.createHost('localhost')
service = api.createService('keks')
hs = api.createHostService(host, service)

plots = []

mc = MultiCall(api)
for i in range(10000):
    mc.createPlot(hs, 'plot_' + str(i))

results = mc()

api.commit()

for result in results:
    plots.append(result) 

now = time()

for a in range(1000):
    print "Update %d..." % (a)
    st = time()
    mc = MultiCall(api)

    for plot in plots:
        mc.insertValue(plot, now + a * 10, randint(0, 500))
   
    mc.commit()
    mc()
    et = time()
    print "took %f seconds" % (et - st)