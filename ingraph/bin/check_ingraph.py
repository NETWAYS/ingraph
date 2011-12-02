#!/usr/bin/env python
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

import os
import sys
import xmlrpclib
import optparse
import time
import math

import ingraph
import ingraph.utils

def calculate_stddev(values):
    average = calculate_average(values)

    sum = 0
    count = 0
 
    for value in values:
        if value[1] == None:
            continue

        sum += math.pow(value[1] - average, 2)
        count += 1

    return math.sqrt(sum / count)

def calculate_trend(values):
    average = calculate_average(values)

    if len(values) < 2:
        return None

    first = values[0]
    last = values[len(values) - 1]

    return (last[1] - first[1]) / average

def calculate_average(values):
    sum = 0
    count = 0

    for value in values:
        if value[1] == None:
            continue

        sum += value[1]
        count += 1

    if count == 0:
        return None
    else:
        return float(sum) / count

def plugin_result(status, message, perfdata=[]):
    perfdata_str = ''.join(["%s=%s;" % (k, str(v)) for k, v in perfdata.items()])
    print status, '-', message + '|' + perfdata_str

    exitstatus = { 'ok': 0, 'warning': 1, 'critical': 2 }
    sys.exit(exitstatus[status])

def main():
    usage = "Usage: %prog [options]"
    parser = optparse.OptionParser(usage=usage,
                                   version='%%prog %s' % ingraph.__version__)
    parser.add_option('-d', '--chdir', dest='chdir', metavar='DIR',
                      default='/etc/ingraph',
                      help='change to directory DIR [default: %default]')
    parser.add_option('-H', '--host', dest='host', metavar='HOST',
                      help='hostname for the check')
    parser.add_option('-S', '--service', dest='service', metavar='SERVICE',
                      help='service for the check')
    parser.add_option('-P', '--perfkey', dest='perfkey', metavar='PERFKEY',
                      help='perfdata key')
    parser.add_option('-F', '--function', dest='function', metavar='FUNCTION',
                     help='comparison function ("trend", "stddev" or "average")')
    parser.add_option('-f', '--first-start', dest='first_start',
                      metavar='FIRST_START', help='start of the first ' +
                      'interval (relative to the current time, in hours)')
    parser.add_option('-g', '--first-end', dest='first_end',
                      metavar='FIRST_END', help='end of the first interval ' +
                      '(relative to the current time, in hours)')
    parser.add_option('-s', '--second-start', dest='second_start',
                      metavar='SECOND_START', help='start of the second ' +
                      'interval (relative to the current time, in hours)')
    parser.add_option('-t', '--second-end', dest='second_end',
                      metavar='SECOND_END', help='end of the second interval ' +
                      '(relative to the current time, in hours)')
    parser.add_option('-w', '--warning', dest='warning', default=10,
                      metavar='WARNING', help='warning threshold, in % (default: 10)')
    parser.add_option('-c', '--critical', dest='critical', default=20,
                      metavar='CRITICAL', help='critical threshold, in % (default: 20)')
    (options, args) = parser.parse_args()

    if options.chdir:
        os.chdir(options.chdir)

    if not options.host:
        print("Error: host must be specified.")
        sys.exit(1)

    if not options.service:
        print("Error: service must be specified.")
        sys.exit(1)

    if not options.perfkey:
        print("Error: perfdata key must be specified.")
        sys.exit(1)

    if not options.function:
        print("Error: comparison function must be specified.")
        sys.exit(1)

    if options.function not in ['trend', 'stddev', 'average']:
        print("Error: invalid comparison function.")
        sys.exit(1)

    if not options.first_start or not options.first_end:
        print("Error: first interval must be specified.")
        sys.exit(1)

    if not options.second_start or not options.second_end:
        print("Error: second interval must be specified.")
        sys.exit(1)

    config = ingraph.utils.load_config('ingraph-xmlrpc.conf')

    if 'xmlrpc_address' not in config or 'xmlrpc_port' not in config:
        print("Error: You need to set a bind address/port for the XML-RPC"
        " interface ('xmlrpc_address' and 'xmlrpc_port' settings).")
        sys.exit(1)

    if 'xmlrpc_username' not in config or 'xmlrpc_password' not in config:
        print("Error: You need to set an XML-RPC username and password "
        "('xmlrpc_username' and 'xmlrpc_password' settings) in your "
        "configuration file.")
        sys.exit(1)

    url = ingraph.utils.get_xmlrpc_url(config)
    api = xmlrpclib.ServerProxy(url, allow_none=True)

    now = time.time()

    first_start = now + int(options.first_start) * 3600
    first_end = now + int(options.first_end) * 3600
    second_start = now + int(options.second_start) * 3600
    second_end = now + int(options.second_end) * 3600

    query = { options.host: { options.service: { options.perfkey: ['avg'] } } }

    result_first = api.getPlotValues2(query, first_start, first_end, 300)
    data_first = result_first['charts'][0]['data']

    result_second = api.getPlotValues2(query, second_start, second_end, 300)
    data_second = result_second['charts'][0]['data']

#    print data_first
#    print data_second

    if options.function == 'trend':
        metric_first = calculate_trend(data_first)
        metric_second = calculate_trend(data_second)
        total = metric_first
    elif options.function == 'stddev':
        metric_first = calculate_stddev(data_first)
        metric_second = calculate_stddev(data_second)
        total = (calculate_average(data_first) +
            calculate_average(data_second)) / 2
    else:
        metric_first = calculate_average(data_first)
        metric_second = calculate_average(data_second)
        total = (calculate_average(data_first) +
            calculate_average(data_second)) / 2

    if metric_first == None or metric_second == None:
        plugin_result('warning', 'Metric could not be calculated.')

    difference = (metric_second - metric_first) * 100 / total

    perfdata = {
        'metric_first': metric_first,
        'metric_second': metric_second,
        'difference': str(round(difference, 2)) + '%'
    }

    if math.fabs(difference) > float(options.critical):
        status = 'critical'
    elif math.fabs(difference) > float(options.warning):
        status = 'warning'
    else:
        status = 'ok'
       
    plugin_result(status, '', perfdata)

if __name__ == '__main__':
    sys.exit(main())
