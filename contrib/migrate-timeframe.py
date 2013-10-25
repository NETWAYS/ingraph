#!/usr/bin/python

import logging
import sys
import optparse
import os
import itertools
import time

import MySQLdb
import MySQLdb.cursors

MAX_INSERTS_PER_STATEMENT = 1000


class LogFormatter(logging.Formatter):

    def __init__(self, *args, **kwargs):
        logging.Formatter.__init__(self, *args, **kwargs)
        self._color = sys.stderr.isatty()
        if self._color:
            self._colors = {
                logging.DEBUG: ('\x1b[34m',), # Blue
                logging.INFO: ('\x1b[32m',), # Green
                logging.WARNING: ('\x1b[33m',), # Yellow
                logging.ERROR: ('\x1b[31m',), # Red
                logging.CRITICAL: ('\x1b[1m', '\x1b[31m'), # Bold, Red
            }
            self._footer = '\x1b[0m'

    def format(self, record):
        formatted_message = logging.Formatter.format(self, record)
        if self._color:
            formatted_message = (''.join(self._colors.get(record.levelno)) +
                                 formatted_message +
                                 len(self._colors.get(record.levelno)) * self._footer)
        return formatted_message


def add_optparse_logging_options(parser, default_loglevel='INFO'):
    LOGLEVELS = ('INFO', 'WARNING', 'ERROR', 'CRITICAL', 'DEBUG')
    parser.add_option('-v', '--verbose', dest='logging_level',
                      default=default_loglevel, choices=LOGLEVELS,
                      help="Print verbose informational messages. One of %s. [default: %%default]" % ', '.join(LOGLEVELS))

channel = logging.StreamHandler()
channel.setFormatter(LogFormatter(fmt='%(asctime)-15s: %(message)s',
                                  datefmt='%Y-%m-%d %H:%M:%S'))
logging.getLogger().addHandler(channel)
log = logging.getLogger(__name__)


def parse_args():
    usage = "Usage: %%prog [options]"
    parser = optparse.OptionParser(usage=usage, version="%%prog 1.0")
    add_optparse_logging_options(parser)
    parser.add_option('-c', '--config', dest='database_config',
                      help="ingraph-database.conf",
                      default='/etc/ingraph/ingraph-database.conf')
    parser.add_option('-f', '--from', dest='from_', help="from", type='int')
    parser.add_option('-t', '--to', dest='to', help="to", type='int')
    options, args = parser.parse_args()
    if options.from_ > options.to:
        raise Exception("to has to be greater than from")
    log.setLevel(getattr(logging, options.logging_level))
    return options


def file_config(filename):
    filename = os.path.abspath(filename)
    log.debug("Parsing configuration file %s.." % (filename,))
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
    if port:
        log.debug("Conneting to database: %s@%s:%d/%s.." % (user, host, port,
                                                            db))
    else:
        log.debug("Conneting to database: %s@%s/%s.." % (user, host, db))
    return MySQLdb.connect(host=host, port=port, db=db, user=user,
                           passwd=password)


def fetch_timeframe(connection, interval):
    cursor = connection.cursor(cursorclass=MySQLdb.cursors.DictCursor)
    log.debug("Fetching interval %d..", interval)
    cursor.execute('SELECT * FROM `timeframe` WHERE `interval` = %s', interval)
    timeframe = cursor.fetchone()
    if not timeframe:
        log.fatal("Can't find interval %d.", interval)
        sys.exit(1)
    return timeframe


def fetch_plots(connection):
    cursor = connection.cursor(cursorclass=MySQLdb.cursors.DictCursor)
    log.debug("Fetching plots..")
    cursor.execute("SELECT id FROM plot")
    return cursor, cursor.rowcount


def fetch_datapoints(connection, plot_id, timeframe_id):
    cursor = connection.cursor(cursorclass=MySQLdb.cursors.DictCursor)
    log.debug("Fetching datapoints for plot %d and timeframe %d..",
              plot_id, timeframe_id)
    cursor.execute('SELECT * FROM `datapoint` WHERE `plot_id` = %s AND `timeframe_id` = %s ORDER BY `timestamp` ASC',
                   (plot_id, timeframe_id))
    return cursor, cursor.rowcount


def grouper(iterable, n):
    iterable = iter(iterable)
    while True:
        chunk = tuple(itertools.islice(iterable, n))
        if not chunk:
            return
        yield chunk


def aggregate_datapoints(datapoints):
    mem = {}
    datapoint = datapoints[0]
    datapoint['count'] = 1
    for next_datapoint in datapoints[1:]:
            datapoint['avg'] = (datapoint['count'] * datapoint['avg'] +
                                next_datapoint['avg']) / (datapoint['count'] +
                                                          1)
            datapoint['min'] = min(datapoint['min'], next_datapoint['min'])
            datapoint['max'] = max(datapoint['max'], next_datapoint['max'])
            datapoint['count'] += 1
    return datapoint


def transmorfer(datapoints, timeframe):
    values = []
    for datapoint in datapoints:
        values.extend([datapoint['plot_id'], timeframe['id'],
                       datapoint['timestamp'] - datapoint['timestamp'] % timeframe['interval'],
                       datapoint['min'], datapoint['max'], datapoint['avg'],
                       datapoint['lower_limit'], datapoint['upper_limit'],
                       datapoint['warn_lower'], datapoint['warn_upper'],
                       datapoint['warn_type'], datapoint['crit_lower'],
                       datapoint['crit_upper'], datapoint['crit_type'], datapoint['count']])
    return values


def main():
    options = parse_args()
    database_config = file_config(options.database_config)
    connection = connect(database_config['dsn'])
    from_ = fetch_timeframe(connection, options.from_)
    to = fetch_timeframe(connection, options.to)
    tbd = options.to // options.from_
    plots, plots_total = fetch_plots(connection)
    start = time.time()
    runtime = 0
    log.info("%d", tbd)
    log.info("Migrating..")
    for i, plot in enumerate(plots, start=1):
        datapoints, datapoints_total = fetch_datapoints(
            connection, plot['id'], from_['id'])
        inserts = []
        for datapoints_chunk in grouper(datapoints, tbd):
            inserts.append(aggregate_datapoints(datapoints_chunk))
        for inserts_chunk in grouper(inserts, MAX_INSERTS_PER_STATEMENT):
            insert_start = time.time()
            values = ('(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,'
                      '%s,%s),' * len(inserts_chunk))[:-1]
            cursor = connection.cursor()
            try:
                cursor.execute("""INSERT INTO datapoint VALUES %s
                ON DUPLICATE KEY UPDATE
                avg = (count * avg + VALUES(avg)) / (count + 1),
                count = count + VALUES(count),
                min = IF(min < VALUES(min), min, VALUES(min)),
                max = IF(max > VALUES(max), max, VALUES(max))""" % (values,),
                               transmorfer(inserts_chunk, to))
                connection.commit()
                log.debug("Migrated %d/%d rows in %.3fs", len(inserts_chunk),
                          len(inserts), time.time() - insert_start)
            except:
                connection.rollback()
                raise
        if i % 100 == 0:
            chunk_runtime = time.time() - start
            runtime += chunk_runtime
            plots_left = plots_total - i
            log.info("Migrated 100 plots in %.3fs. "
                     "There are %d plots left. "
                     "Migration will approximately finish in %.3fs.",
                     chunk_runtime, plots_left, plots_left * runtime / i)
            start = time.time()
    log.info("Migration finished in %.3fs.", runtime)
    return 0


if __name__ == '__main__':
    sys.exit(main())
