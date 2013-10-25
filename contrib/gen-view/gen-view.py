#!/usr/bin/python

import os
import sys
import optparse
import json
from StringIO import StringIO

import MySQLdb


def parse_args():
    usage = "Usage: %prog [options]"
    parser = optparse.OptionParser(usage=usage, version="%prog 1.0")
    parser.add_option('-c', '--config', dest='database_config',
                      help="ingraph-database.conf",
                      default='/etc/ingraph/ingraph-database.conf')
    parser.add_option('-t', '--title', help="view title")
    parser.add_option('-s', '--start', help="data start", default='-1 day')
    parser.add_option('-H', '--host', dest='hosts', help="host pattern(s)",
                      action='append')
    parser.add_option('-S', '--service', dest='services',
                      help="service pattern(s)", action='append')
    parser.add_option('-i', '--interval', help="choose interval", type="int")
    options, args = parser.parse_args()
    return options


def file_config(filename):
    filename = os.path.abspath(filename)
    config = {}
    execfile(filename, config)
    config_no_cruft = dict((k, v) for k, v in config.iteritems() if k not in globals())
    return config_no_cruft


def connect(dsn):
    dialect, rest = dsn.split('://', 1)
    rest, db = rest.rsplit('/', 1)
    user, host = rest.rsplit('@', 1)
    try:
        host, port = host.rsplit(':', 1)
        port = int(port)
    except ValueError:
        port = 3306
    try:
        user, password = user.split(':', 1)
    except ValueError:
        password = None
    return MySQLdb.connect(host=host, port=port, db=db, user=user,
                           passwd=password)


def fetch_hosts(connection, hosts):
    cursor = connection.cursor()
    cursor.executemany('SELECT name FROM host WHERE name LIKE %s', hosts)
    return map(lambda row: row[0], cursor.fetchall())


def print_json(view):
    io = StringIO()
    json.dump(view, io, sort_keys=True, indent=4)
    print io.getvalue()


def main():
    options = parse_args()
    database_config = file_config(options.database_config)
    connection = connect(database_config['dsn'])
    hosts = fetch_hosts(connection, options.hosts)
    view = {
        'title': options.title,
        'panels': []
    }
    convertFnBase = """function(y, x, series, index) {
        var sum = y;
        Ext.each(series, function (plot) {
            if (undefined === plot.data[index]) {
                return true;
            }
            var y = plot.data[index][1];
            if (y !== null) {
                sum += plot.data[index][1];
            }
        });
    """
    for service_plot in options.services:
        service, plot = service_plot.split(':', 1)
        try:
            plot, function = plot.split(':', 1)
        except ValueError:
            function = 'avg'
            label = 'Average'
        try:
            function, label = function.split(':', 1)
            if not function:
                function = 'avg'
            elif function != 'sum' and function != 'avg':
                raise Exception("function {0} not defined".format(function))
        except ValueError:
            label = 'Durchschnitt' if function == 'avg' else 'Summe'
        convertFn = convertFnBase + "return sum / series.length;" \
            if function == 'avg' else "return sum;"
        convertFn += "}"
        panel = {
            'start': options.start,
            'title': "{0}: {1}: {2}".format(service, plot, label),
            'interval': options.interval,
            'series': []
        }
        for host in hosts[:-1]:
            panel['series'].append({
                'host': host,
                'service': service,
                're': '/%s/' % (plot,),
                'type': 'avg',
                'label': '',
                'enabled': False
            })
        panel['series'].append({
            'host': hosts[-1],
            'service': service,
            're': '/%s/' % (plot,),
            'type': 'avg',
            'label': label,
            'convert': convertFn
        })
        view['panels'].append(panel)
    print_json(view)
    return 0


if __name__ == '__main__':
    sys.exit(main())
