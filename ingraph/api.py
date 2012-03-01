# inGraph (https://www.netways.org/projects/ingraph)
# Copyright (C) 2011 NETWAYS GmbH
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

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
        self.shutdown_server = False
        
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

        items = []

        for hostservice_obj in result['services']:
            if hostservice_obj.parent_hostservice == None:
                parentservice = None
            else:
                parentservice = hostservice_obj.parent_hostservice.service.name

            item = { 'service': hostservice_obj.service.name,
                     'parent_service': parentservice }
            items.append(item)
        
        return {'total': result['total'], 'services': items}
    
    def _flattenCharts(self, dps):
        charts = []

        for plot_obj, plot_charts in dps['charts'].iteritems():
            for type, data in plot_charts.iteritems():
                label = plot_obj.name + '-' + type

                hostservice_obj = plot_obj.hostservice

                if hostservice_obj.parent_hostservice != None:
                    label = hostservice_obj.service.name + '-' + label     

                charts.append({'host': hostservice_obj.host.name,
                               'service': hostservice_obj.service.name,    
                               'plot': plot_obj.name, 'type': type,
                               'label': label, 'unit': plot_obj.unit,      
                               'start_timestamp': dps['start_timestamp'],  
                               'end_timestamp': dps['end_timestamp'],      
                               'granularity': dps['granularity'],
                               'data': data,
                               'group': hostservice_obj.host.name + ' - ' + hostservice_obj.service.name + ' - ' + plot_obj.name,
                               'plot_id': hostservice_obj.host.name + ' - ' + hostservice_obj.service.name + ' - ' + plot_obj.name + ' - ' + type})

        return charts

    def getPlotValues2(self, query, start_timestamp=None, end_timestamp=None,
                       granularity=None, null_tolerance=0):
        conn = self.engine.connect()

        st = time.time()

        charts = []
        comments = []
        statusdata = []
        result = {'comments': comments, 'charts': charts, 'statusdata': statusdata,
                  'min_timestamp': model.dbload_min_timestamp,
                  'max_timestamp': time.time()}

        if start_timestamp == '':
            start_timestamp = None

        if end_timestamp == '':
            end_timestamp = None

        if granularity == '':
            granularity = None

        if query == []:
            query = {}

        vquery = {}

        for host, host_specification in query.iteritems():
            host_obj = model.Host.getByName(conn, host)

            if host_specification == []:
                host_specification = {}

            for service, service_specification in host_specification.iteritems():
                service_obj = model.Service.getByName(conn, service)
                hostservice_objs = model.HostService.getByHostAndService(conn, host_obj, service_obj, None)

                for hostservice_obj in hostservice_objs:
                    for plot, types in service_specification.iteritems():
                        plot_objs = model.Plot.getByHostServiceAndName(conn, hostservice_obj, plot)

                        for plot_obj in plot_objs:
                            vquery[plot_obj] = types

        dps = model.DataPoint.getValuesByInterval(conn, vquery,
                                                 start_timestamp, end_timestamp,
                                                 granularity, null_tolerance)

        conn.close()

        comments.extend(dps['comments'])
        statusdata.extend(dps['statusdata'])
        charts.extend(self._flattenCharts(dps))

        et = time.time()
        
        print "Got filtered plot values in %f seconds" % (et - st)
        return result

    def _optimizePlot(self, plot):
        prev = None
        same = False
        result = []

        for nvpair in plot:
            if prev != None and prev[1] == nvpair[1]:
                same = True
            elif prev == None or same:
                same = False
                result.append({'x': nvpair[0], 'y': nvpair[1]})
            else:
                result.append({'y': nvpair[1]})

            prev = nvpair

        return result

    def getPlotValues3(self, query, start_timestamp=None, end_timestamp=None,
                       granularity=None, null_tolerance=0):
        data = self.getPlotValues2(query, start_timestamp, end_timestamp,
                                   granularity, null_tolerance)

        for chart in data['charts']:
            chart['data'] = self._optimizePlot(chart['data'])
 
        return data

    def shutdown(self):
        self.shutdown_server = True
        
        return True

    def addOrUpdateComment(self, comment_id, host, parent_service, service,
                           timestamp, author, text):
        host_obj = self._createHost(self.engine, host)

        if comment_id ==  '':
            comment_id = None

        if parent_service == '':
            parent_service = None
        
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

        if comment_id == None:
            comment = model.Comment(hostservice_obj, timestamp, author, text)
        else:
            comment = model.Comment.getByID(self.engine, comment_id)
            comment.hostservice = hostservice_obj
            comment.timestamp = timestamp
            comment.author = author
            comment.text = text

        comment.save(self.engine)

        return comment.id

    def addComment(self, host, parent_service, service, timestamp, author,
                   text):
        return self.addOrUpdateComment(None, host, parent_service, service, timestamp,
            author, text)
    
    def deleteComment(self, comment_id):
        comment = model.Comment.getByID(self.engine, comment_id)
        comment.delete(self.engine)
    
    def updateComment(self, comment_id, host, parent_service, service,
                      timestamp, author, text):
        return self.addOrUpdateComment(comment_id, host, parent_service,
            service, timestamp, author, text)
        
    def getPlots(self, host_name, service_name):
        res = []
        host = model.Host.getByName(self.engine, host_name)
        service = model.Service.getByName(self.engine, service_name)
        if service_name and not service:
            return res
        hose = model.HostService.getByHostAndService(
            self.engine, host, service, None)
        try:
            hose = hose[0]
        except IndexError:
            pass
        else:
            children = model.HostService.getByHostAndService(
                self.engine, hose.host, None, hose)
            if children:
                for child in children:
                    plots = model.Plot.getByHostServiceAndName(
                        self.engine, child, None)
                    for plot in plots:
                        res.append({
                            'service': child.service.name,
                            'plot': plot.name
                        })
            else:
                plots = model.Plot.getByHostServiceAndName(
                    self.engine, hose, None)
                for plot in plots:
                    res.append({
                        'service': hose.service.name,
                        'plot': plot.name
                    })
        return res
