#!/usr/bin/env python
from backend import model
from time import time
from random import randint
from SimpleXMLRPCServer import SimpleXMLRPCServer
import cPickle
from sqlalchemy.exc import ProgrammingError

print("Grapher V3")

conn = model.create_model_conn('mysql://grapher:Pl9PXfKq@127.0.0.1/grapher')
#conn = model.create_model_conn('sqlite:///grapher.db')

class BackendRPCMethods:
    def __init__(self):
        self.hosts = {}
        self.services = {}
        self.hostservices = {}
        self.plots = {}
        
    def createTimeFrame(self, interval):
        tf = model.TimeFrame(interval)
        tf.save(conn)
        
        return tf.id

    # TODO: methods for enabling/disabling/listing timeframes

    def _createHost(self, name):
        if name in self.hosts:
            return self.hosts[name]
        
        obj = model.Host.getByName(conn, name)
        
        if obj == None:
            obj = model.Host(name)
            obj.save(conn)
            
        self.hosts[name] = obj
            
        return obj
    
    def _createService(self, name):
        if name in self.services:
            return self.services[name]

        obj = model.Service.getByName(conn, name)
        
        if obj == None:
            obj = model.Service(name)
            obj.save(conn)
        
        self.services[name] = obj
        
        return obj

    def _createHostService(self, host, service):
        hostservice_key = (host, service)
        
        if hostservice_key in self.hostservices:
            return self.hostservices[hostservice_key]
        
        obj = model.HostService.getByHostAndService(conn, host, service)
                
        if obj == None:
            obj = model.HostService(host, service)
            obj.save(conn)
        
        self.hostservices[hostservice_key] = obj
        
        return obj

    def _createPlot(self, hostservice, name):
        plot_key = (hostservice, name)
        
        if plot_key in self.plots:
            return self.plots[plot_key]
        
        obj = model.Plot.getByHostServiceAndName(conn, hostservice, name)
        
        if obj == None:        
            obj = model.Plot(hostservice, name)
            obj.save(conn)

        self.plots[plot_key] = obj

        return obj
    
#    def insertValue(self, plot_id, timestamp, value):
#        global update_count
#
#        plot = model.Plot.getByID(conn, plot_id)
#        plot.insertValue(conn, timestamp, value)
#        
#        update_count += 1
#        if update_count % 10000 == 0:
#            model.flush_some_objects(conn)
#            update_count = 0

    def insertValueBulk(self, updates_raw):
#        global update_count
        
        updates = cPickle.loads(updates_raw)
        
        for update in updates:
            (host, service, plot, timestamp, value) = update
            
            host_obj = self._createHost(host)
            service_obj = self._createService(service)
            hostservice_obj = self._createHostService(host_obj, service_obj)
            plot_obj = self._createPlot(hostservice_obj, plot)
    
            plot_obj.insertValue(conn, timestamp, value)
    
    def getPlotValues(self, host, service, plot, start_timestamp, end_timestamp,
                      granularity, with_virtual_values):
        host_obj = self._createHost(host)
        service_obj = self._createService(service)
        hostservice_obj = self._createHostService(host_obj, service_obj)
        plot_obj = self._createPlot(hostservice_obj, plot)

        return model.DataPoint.getValuesByInterval(conn, plot_obj, start_timestamp,
                                                   end_timestamp, granularity, with_virtual_values)
    
    def shutdown(self):
        global shutdown_server
        shutdown_server = True

# TODO:
# methods for setting up timeframes
# rename methods
tfs = model.TimeFrame.getAllActiveSorted(conn)

if len(tfs) == 0:
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

server = SimpleXMLRPCServer(("localhost", 5000), allow_none=True)
server.timeout = 5

server.register_introspection_functions()
server.register_multicall_functions()
server.register_instance(BackendRPCMethods())

def rprofile():
    global shutdown_server

    try:
        shutdown_server = False

        while not shutdown_server:
            server.handle_request()
            
            st = time()
            model.sync_model_session(conn, partial_sync=True)
            et = time()
            print("partial sync took %f seconds" % (et - st))
    except KeyboardInterrupt:
        print('Shutting down. Please wait...')
    finally:
        print('Syncing all remaining objects...')
        model.sync_model_session(conn)

rprofile()

#import os
#from cProfile import Profile
#from lsprofcalltree import KCacheGrind
#
#p = Profile()
#p.run('rprofile()')
#k = KCacheGrind(p)
#f = open('profile.kgrind', 'w+')
#k.output(f)
#f.close()