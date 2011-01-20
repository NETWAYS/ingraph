#!/usr/bin/env python
import xmlrpclib
from time import time
from random import randint
from time import time

api = xmlrpclib.ServerProxy('http://localhost:5000/')

plots = []

for i in range(1000):
    plots.append(api.createPlot()) 

now = time()

for a in range(100):
    print "Update %d..." % (a)
    st = time()
    mc = xmlrpclib.MultiCall(api)

    for plot in plots:
        mc.insertValue(plot, now + a * 60, randint(0, 500))
   
    mc.commit()
    mc()
    et = time()
    print "took %f seconds" % (et - st)