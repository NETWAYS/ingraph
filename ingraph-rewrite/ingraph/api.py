# Copyright (C) 2012 NETWAYS GmbH, http://netways.de
#
# This file is part of inGraph (https://www.netways.org/projects/ingraph).
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

import logging
from itertools import chain

__all__ = ['IngraphAPI']

log = logging.getLogger(__name__)


class IngraphAPI(object):

    def __init__(self, connection):
        self.connection = connection

    def getHostsFiltered(self, host_pattern=None, limit=None, offset=None):
        rs, total = self.connection.fetch_hosts(host_pattern, limit, offset)
        return {
            'total': total,
            'hosts': [host['host_name'] for host in rs]
        }

    def getServices(self, host_pattern=None, service_pattern=None, limit=None, offset=None):
        rs, total = self.connection.fetch_services(host_pattern, service_pattern, limit, offset)
        return {
            'total': total,
            'services': [{'service': hostservice['service_name'],
                          'parent_service': hostservice['parent_service_name']} for hostservice in rs]
        }

    def getPlots(self, host_pattern=None, service_pattern=None, parent_service_pattern=None, plot_pattern=None,
                 offset=None, limit=None):
        rs, total = self.connection.fetch_plots(host_pattern, service_pattern, parent_service_pattern, plot_pattern,
                                                limit, offset)
        return {
            'total': total,
            'plots': [{'plot': plot['plot_name'],
                       'host': plot['host_name'],
                       'service': plot['service_name'],
                       'parent_service': plot['parent_service_name']} for plot in rs]
        }

    def getPlotValues2(self, query, start=None, end=None, interval=None, null_tolerance=0):
        # TODO(el): Respect null_tolerance, improve
        start, end, interval = self.connection.align_interval(start, end, interval)
        fetch_plots = {}
        for spec in query:
            try:
                host_service = self.connection.get_host_service(
                    host_name=spec['host'], service_name=spec['service'], parent_service_name=spec['parent_service'])
                plot = self.connection.get_plot(host_service_id=host_service['id'], plot_name=spec['plot'])
            except KeyError:
                # Not found
                continue
            try:
                fetch_plot = fetch_plots[plot['id']]
            except KeyError:
                fetch_plot = fetch_plots[plot['id']] = {
                    'types': {},
                    'host': spec['host'],
                    'service': spec['service'],
                    'parent_service': spec['parent_service'],
                    'plot': plot['name'],
                    'unit': plot['unit'],
                    'start_timestamp': start,
                    'end_timestamp': end,
                    'granularity': interval
                }
            if spec['type'] not in fetch_plot['types']:
                fetch_plot['types'][spec['type']] = []
        for datapoint in self.connection.fetch_datapoints(plot_ids=fetch_plots.keys(),start=start, end=end,
                                                          interval=interval):
            fetch_plot = fetch_plots[datapoint['plot_id']]
            for type_, data in fetch_plot['types'].iteritems():
                try:
                    data.append([datapoint['timestamp'], datapoint[type_]])
                except KeyError:
                    continue
        for performance_data in self.connection.fetch_performance_data(plot_ids=fetch_plots.keys(),start=start, end=end):
            fetch_plot = fetch_plots[performance_data['plot_id']]
            for type_, data in fetch_plot['types'].iteritems():
                try:
                    data.append([performance_data['timestamp'], performance_data[type_]])
                except KeyError:
                    continue
        charts = []
        for _, fetch_plot in fetch_plots.iteritems():
            for type_, data in fetch_plot['types'].iteritems():
                chart = fetch_plot.copy()
                label = '%s - %s' % (chart['plot'], type_)
                plot_id = chart['host']
                if chart['parent_service']:
                    label = '%s - %s' % (chart['parent_service'], label)
                    plot_id = '%s - %s' % (plot_id, chart['parent_service'])
                if chart['service']:
                    plot_id = '%s - %s' % (plot_id, chart['service'])
                plot_id = '%s - %s - %s' % (plot_id, chart['plot'], type_)
                chart.pop('types')
                chart['type'] = type_
                chart['data'] = data
                chart['label'] = label
                chart['plot_id'] = plot_id
                charts.append(chart)
        return {
            'comments': [],
            'charts': charts,
            'statusdata': [],
            'min_timestamp': start,
            'max_timestamp': end
        }

    def createComment(self):
        pass

    def updateComment(self):
        pass

    def deleteComment(self):
        pass

    def deleteHostService(self, host_pattern, service_pattern):
        def generate_plots():
            rs1, _ = self.connection.fetch_plots(host_pattern, service_pattern)
            rs2, _ = self.connection.fetch_plots(host_pattern, None, service_pattern)
            for plot in chain(rs1, rs2):
                yield (plot['id'],)
        # We would consume all items of the generator multiple times, so it's better to cache the list
        plots = list(generate_plots())
        rows_affected, time_ = self.connection.delete_datapoints(plots)
        log.info("Deleted %d datapoints in %3fs" % (rows_affected, time_))
        rows_affected, time_ = self.connection.delete_plots(plots)
        log.info("Deleted %d plots in %3fs" % (rows_affected, time_))
        rows_affected, time_ = self.connection.delete_performance_data(plots)
        log.info("Deleted %d rows from performance data in %3fs" % (rows_affected, time_))
        rows_affected, time_ = self.connection.delete_host_services_unconstrained()
        log.info("Deleted %d host service combinations in %3fs" % (rows_affected, time_))
        rows_affected, time_ = self.connection.delete_services_unconstrained()
        log.info("Deleted %d services in %3fs" % (rows_affected, time_))
        rows_affected, time_ = self.connection.delete_hosts_unconstrained()
        log.info("Deleted %d hosts in %3fs" % (rows_affected, time_))
