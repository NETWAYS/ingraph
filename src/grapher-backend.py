#!/usr/bin/env python
from backend import model
from time import time
from random import randint
from SimpleXMLRPCServer import SimpleXMLRPCServer, SimpleXMLRPCRequestHandler
import cPickle
from base64 import b64decode
import os
import sys
from grapherutils import load_config

print("NETWAYS Grapher V3 (backend daemon)")

class BackendRPCMethods:
    def __init__(self):
        self.hosts = {}
        self.services = {}
        self.hostservices = {}
        self.plots = {}
        
    def createTimeFrame(self, interval, retention_period=None):
        tf = model.TimeFrame(interval, retention_period)
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
            if len(update) > 5:
                (host, service, plot, timestamp, value, tf) = update
            else:
                (host, service, plot, timestamp, value) = update
                tf = None
            
            host_obj = self._createHost(host)
            service_obj = self._createService(service)
            hostservice_obj = self._createHostService(host_obj, service_obj)
            plot_obj = self._createPlot(hostservice_obj, plot)
    
            if tf == None:
                plot_obj.insertValue(conn, timestamp, value)
            else:
                plot_obj.insertValueRaw(conn, tf, timestamp, value)
    
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

# http://www.acooke.org/cute/BasicHTTPA0.html
class AuthenticatedXMLRPCServer(SimpleXMLRPCServer):
    def __init__(self, *args, **kargs):
        class AuthenticatedRequestHandler(SimpleXMLRPCRequestHandler):
            def parse_request(myself):
                if SimpleXMLRPCRequestHandler.parse_request(myself):
                    header = myself.headers.get('Authorization')
                    
                    if header == None:
                        username = None
                        password = None
                    else:                    
                        (basic, _, encoded) = \
                            header.partition(' ')
    
                        assert basic == 'Basic', 'Only basic authentication supported'
                        
                        (username, _, password) = b64decode(encoded).partition(':')
                    
                    if self.authenticate(username, password):
                        return True
                    else:
                        myself.send_response(401, 'Authentication failed')
                        myself.send_header('WWW-Authenticate', 'Basic realm="XML-RPC"')
                        myself.end_headers()
                        
                        myself.wfile.write('Authentication failed.')
                
                return False
        
        SimpleXMLRPCServer.__init__(self, requestHandler=AuthenticatedRequestHandler, *args, **kargs)

        self.required_username = None
        self.required_password = None

    def authenticate(self, username, password):
        if self.required_username == None and self.required_password == None:
            return True
        
        return self.required_username == username and self.required_password == password

config = load_config('grapher-backend.conf')
config = load_config('grapher-xmlrpc.conf', config)

if config['dsn'] == None:
    print("Error: You need to set a database connection string ('dsn' setting)" + \
          " in your configuration file.")
    sys.exit(1)

print('Connecting to the database...')
conn = model.create_model_conn(config['dsn'])

# TODO:
# methods for setting up timeframes
# rename methods
#tfs = model.TimeFrame.getAllActiveSorted(conn)
#
#if len(tfs) == 0:
#    f1 = model.TimeFrame(5*60, 24*60*60)
#    f1.save(conn)
#    
#    f2 = model.TimeFrame(60*60, 7*24*60*60)
#    f2.save(conn)
#    
#    f3 = model.TimeFrame(24*60*60, 6*30*24*60*60)
#    f3.save(conn)
#    
#    f4 = model.TimeFrame(30*24*60*60, 2*365*24*60*60)
#    f4.save(conn)
#    
#    f5 = model.TimeFrame(365*24*60*60)
#    f5.save(conn)

if 'xmlrpc_address' not in config or 'xmlrpc_port' not in config:
    print("Error: You need to set a bind address/port for the XML-RPC" + \
          " interface ('xmlrpc_address' and 'xmlrpc_port' settings).")
    sys.exit(1)
    
print('Starting XML-RPC interface on %s:%d...' % (config['xmlrpc_address'], config['xmlrpc_port']))
server = AuthenticatedXMLRPCServer((config['xmlrpc_address'], config['xmlrpc_port']), allow_none=True)
server.timeout = 5

if 'xmlrpc_username' not in config or 'xmlrpc_password' not in config:
    print("Error: You need to set an XML-RPC username and password ('xmlrpc_username'" + \
          " and 'xmlrpc_password' settings) in your configuration file.")
    sys.exit(1)

server.required_username = config['xmlrpc_username']
server.required_password = config['xmlrpc_password']

server.register_introspection_functions()
server.register_multicall_functions()
server.register_instance(BackendRPCMethods())

last_maintenance = time()

try:
    shutdown_server = False

    print("Waiting for XML-RPC requests...")

    while not shutdown_server:
        server.handle_request()
        
        st = time()
        model.sync_model_session(conn, partial_sync=True)
        et = time()
        print("partial sync took %f seconds" % (et - st))
        
        model.run_maintenance_tasks(conn)
        
except KeyboardInterrupt:
    print('Syncing all remaining objects - Please wait...')
    model.sync_model_session(conn)

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