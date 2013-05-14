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

import sys
import os
import optparse
import glob
import fileinput
import re
import time
import shutil
import pickle
import xmlrpclib
import logging

import ingraph
from ingraph import daemon
from ingraph import utils
import ingraph.log
from ingraph.parser import PerfdataParser, InvalidPerfdata


class UnsupportedDaemonFunction(Exception): pass


class Collectord(daemon.UnixDaemon):
    name = 'inGraph-collector'
    check_multi_regex = re.compile('^([^:]+::[^:]+)::([^:]+)$')

    def __init__(self, perfdata_dir, pattern, limit, sleeptime, mode, format,
                 **kwargs):
        self.perfpattern = perfdata_dir + '/' + pattern
        self.sleeptime = sleeptime
        self.limit = limit
        self.mode = mode
        self.format = format
        super(Collectord, self).__init__(**kwargs)

    def _parse_update_pnp(self, tokens):
        logdata = {}

        for nvpair in tokens:
            try:
                (key, value) = nvpair.split('::', 1)
            except:
                print "Invalid PNP key-value pair:", nvpair
                continue

            if key == 'TIMET':
                key = 'timestamp'
                value = float(value)
            elif key == 'HOSTNAME':
                key = 'host'
            elif key == 'SERVICEDESC':
                key = 'service'
            elif key == 'SERVICESTATE' or key == 'HOSTSTATE':
                key = 'status'
            elif key == 'SERVICEPERFDATA' or key == 'HOSTPERFDATA':
                key = 'perf'
            elif key == 'SERVICECHECKCOMMAND' or key == 'HOSTCHECKCOMMAND':
                key = 'check_command'
                value = value.split('!', 1)[0]

            logdata[key] = value

        if 'perf' not in logdata or 'host' not in logdata or 'status' not in logdata:
            print "Update is missing host, status or performance data:", tokens
            return False

        if 'timestamp' not in logdata:
            logdata['timestamp'] = time()

        if 'service' not in logdata:
            logdata['service'] = ''

        return logdata

    def _parse_update_ingraph(self, tokens):
        if len(tokens) < 4:
            return False
        elif len(tokens) < 5:
            tokens.append(time())

        logdata = {
            'host': tokens[0],
            'service': tokens[1],
            'status': tokens[2],
            'perf': tokens[3],
            'timestamp': int(tokens[4])
        }

        return logdata

    def _prepare_update(self, line):
        tokens = line.strip().split('\t')

        if self.format == 'ingraph':
            logdata = self._parse_update_ingraph(tokens)
        else:
            logdata = self._parse_update_pnp(tokens)

        if logdata == False:
            return []

        perfresults = utils.PerfdataParser.parse(logdata['perf'])

        is_multidata = False

        updates = []
        for plotname in perfresults:
            match = Collectord.check_multi_regex.match(plotname)

            perfresult = perfresults[plotname]

            uom = perfresult['raw']['uom']
            raw_value = str(perfresult['raw']['value'])

            warn_lower = None
            warn_upper = None
            warn_type = None

            if 'warn' in perfresult:
                if perfresult['warn']['lower']['value'] != None:
                    warn_lower = str(perfresult['warn']['lower']['value'])

                if perfresult['warn']['upper']['value'] != None:
                    warn_upper = str(perfresult['warn']['upper']['value'])

                warn_type = str(perfresult['warn']['type'])

            crit_lower = None
            crit_upper = None
            crit_type = None

            if 'crit' in perfresult:
                if perfresult['crit']['lower']['value'] != None:
                    crit_lower = str(perfresult['crit']['lower']['value'])

                if perfresult['crit']['upper']['value'] != None:
                    crit_upper = str(perfresult['crit']['upper']['value'])

                crit_type = str(perfresult['crit']['type'])

            if 'min' in perfresult:
                min_value = str(perfresult['min']['value'])
            else:
                min_value = None

            if 'max' in perfresult:
                max_value = str(perfresult['max']['value'])
            else:
                max_value = None

            upd_parentservice = None
            upd_service = logdata['service']
            upd_plotname = plotname

            if match:
                is_multidata = True

                multi_service = match.group(1)
                upd_plotname = match.group(2)

            if is_multidata:
                upd_parentservice = logdata['service']
                upd_service = multi_service

            pluginstatus = logdata['status'].lower()

            try:
                check_command = logdata['check_command']
            except KeyError:
                check_command = None
            
            update = (logdata['host'], upd_parentservice, upd_service,
                      upd_plotname, logdata['timestamp'], uom, raw_value,
                      raw_value, raw_value, min_value, max_value, warn_lower,
                      warn_upper, warn_type, crit_lower, crit_upper, crit_type,
                      pluginstatus, check_command)
            updates.append(update)
        return updates

    def before_daemonize(self):
        self.logger.info("Starting %s..." % self.name)
        config = utils.load_config('ingraph-xmlrpc.conf')
        config = utils.load_config('ingraph-aggregates.conf', config)

        url = utils.get_xmlrpc_url(config)
        api = xmlrpclib.ServerProxy(url, allow_none=True)

        tfs = api.getTimeFrames()
        intervals = tfs.keys()

        for aggregate in config['aggregates']:
            interval = aggregate['interval']

            if str(interval) in intervals:
                intervals.remove(str(interval))

            if 'retention-period' in aggregate:
                retention_period = aggregate['retention-period']
            else:
                retention_period = None

            api.setupTimeFrame(interval, retention_period)

        for interval in intervals:
            tf = tfs[interval]
            api.disableTimeFrame(tf['id'])

        self.api = api

    def run(self):
        parser = PerfdataParser()
        last_flush = time.time()
        updates = []
        while True:
            lines = 0
            files = glob.glob(self.perfpattern)[:self.limit]
            if files:
                input = fileinput.input(files)
                for line in input:
                    try:
                        observation, perfdata = parser.parse(line)
                    except InvalidPerfdata, e:
                        sys.stderr.write("%s %s:%i" % (e, input.filename(), input.filelineno()))
                        continue
                    for performance_data in perfdata:
                        parentservice = None
                        service = observation['service']
                        if performance_data['child_service']:
                            parentservice = service
                            service = performance_data['child_service']
                        pluginstatus = observation['state']
                        if pluginstatus == 1:
                            pluginstatus = 'warning'
                        if pluginstatus == 2:
                            pluginstatus = 'critical'
                        updates.append(
                            (observation['host'], parentservice, service,
                             performance_data['label'], observation['timestamp'], performance_data['uom'],
                             performance_data['value'], performance_data['lower_limit'],
                             performance_data['upper_limit'], performance_data['warn_lower'],
                             performance_data['warn_upper'], performance_data['warn_type'],
                             performance_data['crit_lower'], performance_data['crit_upper'],
                             performance_data['crit_type'], pluginstatus)
                        )
                    lines += 1

            if last_flush + 30 < time.time() or len(updates) >= 25000:
                if updates:
                    updates_pickled = pickle.dumps(updates)
                    st = time.time()
                    while True:
                        try:
                            self.api.insertValueBulk(updates_pickled)
                        except Exception:
                            time.sleep(60)
                        else:
                            break
                    et = time.time()
                    print "%d updates (approx. %d lines) took %f seconds" % \
                          (len(updates), lines, et - st)
                updates = []
                last_flush = time.time()
                lines = 0

            if files:
                if self.mode == 'BACKUP':
                    for file in files:
                        shutil.move(file, file + '.bak')
                elif self.mode == 'REMOVE':
                    for file in files:
                        os.remove(file)
            time.sleep(self.sleeptime)


def main():
    DAEMON_FUNCTIONS = ['start', 'stop', 'restart', 'status']
    LOG_LVLS = ('INFO', 'WARNING', 'ERROR', 'CRITICAL')
    PERFDATA_FORMATS = ('ingraph', 'pnp')
    PERFDATA_MODES = ('BACKUP', 'REMOVE')
    usage = 'Usage: %%prog [options] {%s}' % '|'.join(DAEMON_FUNCTIONS)
    parser = optparse.OptionParser(usage=usage,
                                   version='%%prog %s' % ingraph.__version__)
    parser.add_option('-f', '--foreground', dest='detach', default=True,
                      action='store_false', help="run in foreground")
    parser.add_option('-d', '--chdir', dest='chdir', metavar='DIR',
                      default='/etc/ingraph',
                      help="change to directory DIR [default: %default]")
    parser.add_option('-p', '--pidfile', dest='pidfile', metavar='FILE',
                      default='/var/run/ingraph/ingraph-collectord.pid',
                      help="pidfile FILE [default: %default]")
    parser.add_option('-o', '--logfile', dest='logfile', metavar='FILE',
                      default=None, help="logfile FILE [default: %default]")
    parser.add_option('-P', '--perfdata-dir', dest='perfdata_dir',
                      default='/usr/local/icinga/var/perfdata',
                      metavar='DIR', help="perfdata directory DIR "
                                          "[default: %default]")
    parser.add_option('-e', '--pattern', dest='pattern',
                      help="shell pattern PATTERN [default: %default]",
                      default='*-perfdata.*[0-9]')
    parser.add_option('-m', '--mode', dest='mode', default='BACKUP',
                      choices=PERFDATA_MODES,
                      help="perfdata files post processing, one of: %s "
                           "[default: %%default]" % ', '.join(PERFDATA_MODES))
    parser.add_option('-l', '--limit', dest='limit', type='int',
                      help='limit files [default: %default]', default=50)
    parser.add_option('-s', '--sleeptime', dest='sleeptime', type='int',
                      help="seconds to sleep [default: %default]",
                      default=30)
    parser.add_option('-u', '--user', dest='user', default=None)
    parser.add_option('-g', '--group', dest='group', default=None)
    parser.add_option('-F', '--format', dest='format', default='pnp',
                      choices=PERFDATA_FORMATS,
                      help="perfdata format, one of: %s "
                           "[default: %%default]" % ', '.join(PERFDATA_FORMATS))
    parser.add_option('-L', '--loglevel', dest='loglevel', default='INFO',
                      choices=LOG_LVLS,
                      help="the log level, one of: %s "
                           "[default: %%default]" % ', '.join(LOG_LVLS))
    (options, args) = parser.parse_args()

    try:
        if args[0] not in DAEMON_FUNCTIONS:
            raise UnsupportedDaemonFunction()
    except (IndexError, UnsupportedDaemonFunction):
            parser.print_usage()
            sys.exit(1)

    collectord = Collectord(perfdata_dir=options.perfdata_dir,
                            pattern=options.pattern,
                            limit=options.limit,
                            sleeptime=options.sleeptime,
                            mode=options.mode,
                            chdir=options.chdir,
                            detach=options.detach,
                            pidfile=options.pidfile,
                            format=options.format,
                            log=options.logfile)

    if options.logfile and options.logfile != '-':
        collectord.stdout_logger = ingraph.log.FileLikeLogger(collectord.logger,
                                                              logging.INFO)
        collectord.stderr_logger = ingraph.log.FileLikeLogger(collectord.logger,
                                                              logging.CRITICAL)
    collectord.logger.setLevel(getattr(logging, options.loglevel))
    if options.user:
        from pwd import getpwnam
        try:
            collectord.uid = getpwnam(options.user).pw_uid
        except KeyError:
            sys.stderr.write("User %s not found.\n" % options.user)
            sys.exit(1)
    if options.group:
        from grp import getgrnam
        try:
            collectord.gid = getgrnam(options.group).gr_gid
        except KeyError:
            sys.stderr.write("Group %s not found.\n" % options.group)
            sys.exit(1)

    if options.perfdata_dir:
        if not os.access(options.perfdata_dir, os.W_OK):
            sys.stderr.write("Perfdata directory '%s' is not writable. "
                             "Please make sure the perfdata directory is writable so "
                             "the inGraph daemon can delete/move perfdata files." % options.perfdata_dir)
            sys.exit(1)

    return getattr(collectord, args[0])()

if __name__ == '__main__':
    sys.exit(main())
