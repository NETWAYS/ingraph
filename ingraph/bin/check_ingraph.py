#!/usr/bin/env python
# inGraph (https://www.netways.org/projects/ingraph)
# Copyright (C) 2011-2012 NETWAYS GmbH
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

def holtwinters(y, alpha, beta, gamma, c, debug=False):
    """
    y - time series data.
    alpha , beta, gamma - exponential smoothing coefficients 
			      for level, trend, seasonal components.
    c -  extrapolated future data points.
	  4 quarterly
	  7 weekly.
	  12 monthly
 
 
    The length of y must be a an integer multiple  (> 2) of c.
    """
    #Compute initial b and intercept using the first two complete c periods.
    ylen =len(y)
    if ylen % c !=0:
        return None
    fc =float(c)
    ybar2 =sum([y[i] for i in range(c, 2 * c)])/ fc
    ybar1 =sum([y[i] for i in range(c)]) / fc
    b0 =(ybar2 - ybar1) / fc
    if debug: print "b0 = ", b0

    #Compute for the level estimate a0 using b0 above.
    tbar  =sum(i for i in range(1, c+1)) / fc
    if debug: print tbar
    a0 =ybar1  - b0 * tbar
    if debug: print "a0 = ", a0

    #Compute for initial indices
    I = []
    for i in range(0, ylen):
        div = a0 + (i+1) * b0

        if div != 0:
            I.append(y[i] / div)
        else:
            I.append(0)
    if debug: print "Initial indices = ", I

    S=[0] * (ylen+ c)
    for i in range(c):
        S[i] =(I[i] + I[i+c]) / 2.0
 
    #Normalize so S[i] for i in [0, c)  will add to c.
    Ssum = sum([S[i] for i in range(c)])
    if Ssum != 0:
        tS =c / Ssum

        for i in range(c):
            S[i] *=tS
            if debug: print "S[",i,"]=", S[i]
 
    # Holt - winters proper ...
    if debug: print "Use Holt Winters formulae"
    F =[0] * (ylen+ c)
 
    At =a0
    Bt =b0
    for i in range(ylen):
        Atm1 =At
        Btm1 =Bt
        if S[i] == 0:
            Sy = 0
        else:
            Sy = y[i] / S[i]
        At =alpha * Sy + (1.0-alpha) * (Atm1 + Btm1)
        Bt =beta * (At - Atm1) + (1- beta) * Btm1
        if At != 0:
            S[i+c] =gamma * y[i] / At + (1.0 - gamma) * S[i]
        else:
            S[i+c] =0
        F[i]=(a0 + b0 * (i+1)) * S[i]
        if debug: print "i=", i+1, "y=", y[i], "S=", S[i], "Atm1=", Atm1, "Btm1=",Btm1, "At=", At, "Bt=", Bt, "S[i+c]=", S[i+c], "F=", F[i]
        if debug: print i,y[i],  F[i]
    #Forecast for next c periods:
    forecast = []
    for m in range(c):
        forecast.append((At + Bt* (m+1))* S[ylen + m])
    return forecast

def hwpredict(chart, season_len, granularity, alpha, beta, gamma):
    # only apply hw to 'avg' plots
    data = chart['data']

    if len(data) == 0:
        return None

    count_predict = season_len
    count_init = (len(data) / count_predict - 1) * count_predict

    if count_init <= 0:
        return None

    #print "data:", len(data), "init:", count_init, "predict:", count_predict

    values = []
    for value in data[-(count_init + count_predict):-count_predict]:
        if value[1] != None:
            values.append(value[1])
        else:
            values.append(0)

    # Not enough values
    if len(values) < 2 * count_predict:
        return None

    #print "XXX: ", len(values)

    #print values
    forecast = holtwinters(values, alpha, beta, gamma, count_predict)
    #print forecast

    if forecast == None:
        return None

    ts = data[-count_predict][0]
    forecast_data = []
    for value in forecast:
        ts += granularity
        forecast_data.append((ts, value))

    return forecast_data

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
                     help='comparison function ("trend", "stddev", "average", "hw")')
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
    parser.add_option('-w', '--warning', dest='warning', default=20,
                      metavar='WARNING', help='warning threshold, in % (default: 20)')
    parser.add_option('-c', '--critical', dest='critical', default=10,
                      metavar='CRITICAL', help='critical threshold, in % (default: 10)')
    parser.add_option('-E', '--season', dest='season', default=24,
                      metavar='SEASON', help='Season, in hours (for HW, default: 24)')
    parser.add_option('-A', '--alpha', dest='alpha', default=0.5,
                      metavar='ALPHA', help='Alpha (for HW, default: 0.5)')
    parser.add_option('-B', '--beta', dest='beta', default=0.5,
                      metavar='BETA', help='Beta (for HW, default: 0.5)')
    parser.add_option('-G', '--gamma', dest='gamma', default=0.5,
                      metavar='GAMMA', help='Gamma (for HW, default: 0.5)')
    parser.add_option('-T', '--failures', dest='failures', default=5,
                      metavar='FAILURES', help='Failures, in % of total number of values in one season (for HW, default: 5%')

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

    if options.function not in ['trend', 'stddev', 'average', 'hw']:
        print("Error: invalid comparison function.")
        sys.exit(1)

    if not options.first_start or not options.first_end:
        print("Error: first interval must be specified.")
        sys.exit(1)

    if options.function != 'hw':
        if not options.second_start or not options.second_end:
            print("Error: second interval must be specified.")
            sys.exit(1)
    else:
        if options.second_start or options.second_end:
            print("Error: second interval must not be specified when using Holt-Winters.")
            sys.exit(1)

    if options.season:
        options.season = int(options.season)

    if options.failures:
        options.failures = float(options.failures)

    if options.critical:
        options.critical = float(options.critical)

    if options.warning:
        options.warning = float(options.warning)

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

    if options.function != 'hw':
        second_start = now + int(options.second_start) * 3600
        second_end = now + int(options.second_end) * 3600

    query = { options.host: { options.service: { options.perfkey: ['avg'] } } }

    result_first = api.getPlotValues2(query, first_start, first_end, 300)

    if len(result_first['charts']) == 0:
        print("No data returned for first time interval.")
        sys.exit(1)

    data_first = result_first['charts'][0]['data']

    if options.function != 'hw':
        result_second = api.getPlotValues2(query, second_start, second_end, 300)

        if len(result_second['charts']) == 0:
            print("No data returned for second time interval.")
            sys.exit(1)

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
    elif options.function == 'hw':
        chart = result_first['charts'][0]
        data_season_len = options.season * 3600 / chart['granularity']
        data_season_first = data_first[-data_season_len:]
        data_hw_first = hwpredict(chart, data_season_len, chart['granularity'], options.alpha, options.beta, options.gamma)

        if data_hw_first == None:
            print("Not enough data to run Holt-Winters analysis.")
            sys.exit(1)

        failures_critical = 0
        failures_warning = 0

        for i in range(data_season_len):
            if data_season_first[i][1] == None or data_hw_first[i][1] == 0:
                continue

            difference = (data_season_first[i][1] / data_hw_first[i][1]) * 100

            if math.fabs(difference) > options.critical:
                failures_critical += 1
            elif math.fabs(difference) > options.warning:
                failures_warning += 1

        if failures_critical > options.failures / 100 * data_season_len:
            status = 'critical'
        elif failures_warning > options.failures / 100 * data_season_len:
            status = 'warning'
        else:
            status = 'ok'

        perfdata = {
            'failures_critical': failures_critical,
            'failures_warning': failures_warning,
            'available_datapoints': len(data_first),
            'season_datapoints': data_season_len
        }

        plugin_result(status, '', perfdata)
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

    if math.fabs(difference) > options.critical:
        status = 'critical'
    elif math.fabs(difference) > options.warning:
        status = 'warning'
    else:
        status = 'ok'

    plugin_result(status, '', perfdata)

if __name__ == '__main__':
    sys.exit(main())
