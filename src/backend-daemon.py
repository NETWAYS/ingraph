#!/usr/bin/env python
from backend import model
from time import time
from random import randint
from SimpleXMLRPCServer import SimpleXMLRPCServer

print("Grapher V3")

engine = model.create_model_engine('mysql://grapher:Pl9PXfKq@127.0.0.1/grapher')
#engine = model.create_model_engine('sqlite:///grapher.db')
model.register_model(engine)
conn = engine.connect()
trans = conn.begin()

f1 = model.TimeFrame(5*60)
f1.save(conn)

f2 = model.TimeFrame(60*60)
f2.save(conn)

f3 = model.TimeFrame(24*60*60)
f3.save(conn)

f4 = model.TimeFrame(30*24*60*60)
f4.save(conn)

f5 = model.TimeFrame(365*24*60*60)
f5.save(conn)

class BackendRPCMethods:
    def createPlot(self):
        plot = model.Plot()
        plot.save(conn)

        return plot.id
    
    def insertValue(self, plot_id, timestamp, value):
        plot = model.Plot.getByID(conn, plot_id)
        plot.insertValue(conn, timestamp, value)
        
    def commit(self):
        global trans

        model.flush_some_objects(conn)
        trans.commit()
        trans = conn.begin()

# TODO:
# methods for setting up timeframes
# rename methods

server = SimpleXMLRPCServer(("localhost", 5000), allow_none=True)

server.register_introspection_functions()
server.register_multicall_functions()
server.register_instance(BackendRPCMethods())

try:
    server.serve_forever()
except KeyboardInterrupt:
    print "Saving objects..."
    model.flush_some_objects(conn, flush_all=True)
    trans.commit()

#f1 = model.TimeFrame(5*60)
#f1.save(conn)
#
#f2 = model.TimeFrame(60*60)
#f2.save(conn)
#
#f3 = model.TimeFrame(24*60*60)
#f3.save(conn)
#
#f4 = model.TimeFrame(30*24*60*60)
#f4.save(conn)
#
#f5 = model.TimeFrame(365*24*60*60)
#f5.save(conn)
#
#plots = []
#
#num_plots = 20000
#
#trans = conn.begin()
#for i in range(num_plots):
#    p = model.Plot()
#    p.save(conn)
#    plots.append(p)
#trans.commit()
#
#def benchmark():
#    now = time()
#    
#    for a in range(100):
#        print("Update %d" % (a))
#        st = time()
#        trans = conn.begin()
#        for b in range(6):
#            for plot in plots:
#                plot.insertValue(conn, now + 10 * (a + b), randint(0, 500))
#    
#        model.flush_some_objects(conn, max_fraction=15)
#        trans.commit()
#
#        et = time()
#    
#        print("took %f seconds" % (et - st))
#    
#    trans = conn.begin()
#    model.flush_some_objects(conn, flush_all=True)
#    trans.commit()
#
#benchmark()

#import os
#from cProfile import Profile
#from lsprofcalltree import KCacheGrind
#
#p = Profile()
#p.run('benchmark()')
#k = KCacheGrind(p)
#f = open('profile.kgrind', 'w+')
#k.output(f)
#f.close()