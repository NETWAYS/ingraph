import time
import xmlrpclib
import cPickle

import ingraph.model as model

class BackendRPCMethods(object):
    def __init__(self, engine, queryqueue):
        self.hosts = {}
        self.services = {}
        self.hostservices = {}
        self.plots = {}
        self.engine = engine
        self.queryqueue = queryqueue
        
    def setupTimeFrame(self, interval, retention_period=None):
        tfs = model.TimeFrame.getAll(self.engine)
        for tf in tfs:
            if (tf.interval < interval and interval % tf.interval != 0) or \
               (tf.interval > interval and tf.interval % interval != 0):
                raise xmlrpclib.Fault(
                    1, 'Timeframe interval is invalid. Must be multiple of '
                       'existing timeframe or evenly divisible by existing '
                       'larger intervals.')
            
            if tf.interval == interval:
                tf.retention_period = retention_period
                tf.save(self.engine)
                return tf.id
        
        tf = model.TimeFrame(interval, retention_period)
        tf.save(self.engine)
        
        return tf.id
    
    def getTimeFrames(self):
        tfs = model.TimeFrame.getAll(self.engine)
        items = {}
        for tf in tfs:
            items[str(tf.interval)] = {'id': tf.id,
                                       'interval': tf.interval,
                                       'retention-period': tf.retention_period}
        return items
    
    def disableTimeFrame(self, tf_id):
        tf = model.TimeFrame.getByID(self.engine, tf_id)
        tf.active = False;
        tf.save(self.engine)
        
        return True

    def _createHost(self, conn, name):
        if name in self.hosts:
            return self.hosts[name]
        
        obj = model.Host.getByName(conn, name)
        
        if obj == None:
            obj = model.Host(name)
            obj.save(conn)
            
        self.hosts[name] = obj
            
        return obj
    
    def _createService(self, conn, name):
        if name in self.services:
            return self.services[name]

        obj = model.Service.getByName(conn, name)
        
        if obj == None:
            obj = model.Service(name)
            obj.save(conn)
        
        self.services[name] = obj
        
        return obj

    def _createHostService(self, conn, host, service, parent_hostservice):
        hostservice_key = (host, service)
        
        if hostservice_key in self.hostservices:
            return self.hostservices[hostservice_key]
        
        objs = model.HostService.getByHostAndService(conn, host, service,
                                                     parent_hostservice)
        if len(objs) == 0:
            obj = model.HostService(host, service, parent_hostservice)
            obj.save(conn)
        else:
            obj = objs[0]
            
        self.hostservices[hostservice_key] = obj
        
        return obj

    def _createPlot(self, conn, hostservice, name):
        plot_key = (hostservice, name)
        if plot_key in self.plots:
            return self.plots[plot_key]
        
        objs = model.Plot.getByHostServiceAndName(conn, hostservice, name)
        
        if len(objs) == 0:    
            obj = model.Plot(hostservice, name)
            obj.save(conn)
        else:
            obj = objs[0]

        self.plots[plot_key] = obj

        return obj

    def insertValueBulk(self, updates_raw):
        updates = cPickle.loads(updates_raw)
        
        conn = self.engine.connect()
        
        for update in updates:
            (host, parent_service, service, plot, timestamp, unit, value, min,
             max, lower_limit, upper_limit, warn_lower, warn_upper, warn_type,
             crit_lower, crit_upper, crit_type, pluginstatus) = update
            
            host_obj = self._createHost(conn, host)
            if parent_service != None:
                parent_service_obj = self._createService(conn, parent_service)
                parent_hostservice_obj = self._createHostService(
                    conn, host_obj, parent_service_obj, None)
            else:
                parent_hostservice_obj = None
            service_obj = self._createService(conn, service)

            hostservice_obj = self._createHostService(conn, host_obj,
                                                      service_obj,
                                                      parent_hostservice_obj)
            plot_obj = self._createPlot(conn, hostservice_obj, plot)

            queries = plot_obj.buildUpdateQueries(
                conn, timestamp, unit, value, min, max, lower_limit,
                upper_limit, warn_lower, warn_upper, warn_type, crit_lower,
                crit_upper, crit_type)
            
            for query in queries:
                self.queryqueue.put(query)

            if pluginstatus in ['warning', 'critical']:
                status_obj = model.PluginStatus(hostservice_obj, timestamp, pluginstatus)
                status_obj.save(conn)
        
        conn.close()

        return True

    def getHosts(self):
        hosts = model.Host.getAll(self.engine)
        
        items = []
        
        for host in hosts:
            items.append(host.name)
            
        return items
    
    def getHostsFiltered(self, pattern, limit=None, offset=None):
        result = model.Host.getByPattern(self.engine,
                                         pattern.replace('*', '%'),
                                         limit, offset)
        items = []
        
        for host in result['hosts']:
            items.append(host.name)
            
        return {'total': result['total'], 'hosts': items}

    def getServices(self, host_pattern, service_pattern=None, limit=None,
                    offset=None):
        result = model.HostService.getByHostAndServicePattern(
            self.engine, host_pattern.replace('*', '%'),
            service_pattern.replace('*', '%'), limit, offset)

        items = set()

        for hostservice_obj in result['services']:
            items.add(hostservice_obj.service.name)
        
        return {'total': result['total'], 'services': list(items)}
    
    def getPlotValues(self, host_pattern, service_pattern,
                      start_timestamp=None, end_timestamp=None,
                      granularity=None, null_tolerance=0):
        st = time.time()

        charts = []
        comments = []
        statusdata = []
        result = {'comments': comments, 'charts': charts, 'statusdata': statusdata,
                  'min_timestamp': model.dbload_min_timestamp,
                  'max_timestamp': time.time()}
        
        if host_pattern != None:
            host_pattern = host_pattern.replace('*', '%')
        
        if service_pattern != None:
            service_pattern = service_pattern.replace('*', '%')
        
        if start_timestamp == '':
            start_timestamp = None
            
        if end_timestamp == '':
            end_timestamp = None
            
        if granularity == '':
            granularity = None

        result_services = model.HostService.getByHostAndServicePattern(
            self.engine, host_pattern, service_pattern)

        for hostservice_obj in result_services['services']:        
            plot_objs = model.Plot.getByHostServiceAndName(self.engine,
                                                           hostservice_obj,
                                                           None)
            dps = model.DataPoint.getValuesByInterval(
                self.engine, plot_objs, start_timestamp,end_timestamp,
                granularity, null_tolerance)

            comments.extend(dps['comments'])
            statusdata.extend(dps['statusdata'])

            for plot_obj, plot_charts in dps['charts'].iteritems():
                for type, data in plot_charts.iteritems():
                    label = plot_obj.name + '-' + type
                    
                    if hostservice_obj.parent_hostservice != None:
                        label = hostservice_obj.service.name + '-' + label
                    
                    charts.append({'host': hostservice_obj.host.name,
                                   'service': hostservice_obj.service.name,
                                   'plot': plot_obj.name, 'type': type,
                                   'label': label, 'unit': plot_obj.unit,
                                   'data': data})

        et = time.time()
        
        print "Got plot values in %f seconds" % (et - st)
        return result

    def getPlotValues2(self, query,
                      start_timestamp=None, end_timestamp=None,
                      granularity=None, null_tolerance=0):
        st = time.time()

        charts = []
        comments = []
        statusdata = []
        result = {'comments': comments, 'charts': charts, 'statusdata': statusdata,
                  'min_timestamp': model.dbload_min_timestamp,
                  'max_timestamp': time.time()}

        for host, host_specification in query.iteritems():
            for service, service_specification in host_specification.iteritems():
                svc_data = self.getPlotValues(host, service, start_timestamp, end_timestamp, granularity, null_tolerance)

                comments.extend(svc_data['comments'])
                statusdata.extend(svc_data['statusdata'])

                for chart in svc_data['charts']:
                    if not chart['plot'] in plot_specification:
                        continue

                    if not chart['type'] in plot_specification[chart['plot']]:
                        continue

                    charts.append(chart)

        et = time.time()
        
        print "Got filtered plot values in %f seconds" % (et - st)
        return result
 
    def shutdown(self):
        global shutdown_server
        
        shutdown_server = True
        
        return True
    
    def addComment(self, host, parent_service, service, timestamp, author,
                   text):
        host_obj = self._createHost(self.engine, host)
        
        if parent_service != None:
            parent_service_obj = self._createService(self.engine,
                                                     parent_service)
            parent_hostservice_obj = self._createHostService(
                self.engine, host_obj, parent_service_obj, None)
        else:
            parent_hostservice_obj = None
        service_obj = self._createService(self.engine, service)

        hostservice_obj = self._createHostService(self.engine, host_obj,
                                                  service_obj,
                                                  parent_hostservice_obj)
        comment = model.Comment(hostservice_obj, timestamp, author, text)
        comment.save(self.engine)

        return comment.id
    
    def deleteComment(self, comment_id):
        comment = model.Comment.getByID(self.engine, comment_id)
        comment.delete(self.engine)
    
    def updateComment(self, comment_id, text):
        comment = model.Comment.getByID(self.engine, comment_id)
        comment.text = text
        comment.save()
