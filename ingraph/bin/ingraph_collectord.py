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
import cPickle as pickle
import xmlrpclib
import logging
import socket
import struct
import itertools

import ingraph
from ingraph import daemon
from ingraph import utils
import ingraph.log
import string
from ingraph.parser import PerfdataParser, InvalidPerfdata

import json
import fcntl
import threading
import pyjsonrpc
import base64
from base64 import urlsafe_b64encode as b64enc
from jsonrpc_auth import AuthenticatedHTTPRequestHandler


CARBON_METRIC_TRANSLATION_TABLE = string.maketrans('. /', '___')

class UnsupportedDaemonFunction(Exception): pass


def grouper(iterable, n, fillvalue=None):
    "Collect data into fixed-length chunks or blocks"
    # grouper('ABCDEFG', 3, 'x') --> ABC DEF Gxx
    args = [iter(iterable)] * n
    return itertools.izip_longest(fillvalue=fillvalue, *args)


class Collectord(daemon.UnixDaemon):
    name = 'inGraph-collector'
    check_multi_regex = re.compile('^([^:]+::[^:]+)::([^:]+)$')

    def __init__(self, backend, perfdata_dir, pattern, limit, sleeptime, mode,
                 format, static_metrics_path, **kwargs):
        self.backend = backend
        self.perfpattern = perfdata_dir + '/' + pattern
        self.sleeptime = sleeptime
        self.limit = limit
        self.mode = mode
        self.format = format
        super(Collectord, self).__init__(**kwargs)
        self.checked_hosts_services = {}
        self.static_metrics_path = static_metrics_path

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
        if self.backend == 'xmlrpc':
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
        else:
            config = utils.load_config('ingraph-carbon.conf')
            config = utils.load_config('ingraph-collector-jsonrpc.conf', config)
            if 'collector_jsonrpc_address' not in config or \
                    'collector_jsonrpc_port' not in config or \
                    'collector_jsonrpc_address' not in config or \
                    'collector_jsonrpc_port' not in config:
                print >> sys.stderr, "You have to configure "\
"'collector_jsonrpc_address', 'collector_jsonrpc_port', "\
"'collector_jsonrpc_user' and 'collector_jsonrpc_password' in "\
"'ingraph-collector-jsonrpc.conf'!"
                sys.exit(1)
            else:
                self.collector_jsonrpc_address = config['collector_jsonrpc_address']
                self.collector_jsonrpc_port = config['collector_jsonrpc_port']
                self.collector_jsonrpc_user = config['collector_jsonrpc_user']
                self.collector_jsonrpc_password = config['collector_jsonrpc_password']
            self.carbon_address = config['carbon_address']
            self.carbon_port = config['carbon_port']
            self.naming_scheme = config['naming_scheme']
            self.connect_carbon()

    def connect_carbon(self):
        self.logger.debug("Connecting to carbon at %s:%s",
                          self.carbon_address, self.carbon_port)
        self.carbon_sock = socket.socket()
        try:
            self.carbon_sock.connect((self.carbon_address, self.carbon_port))
            self.logger.debug("Successfully connected to carbon")
            return True
        except Exception as e:
            self.logger.warning("Can't connect to carbon at %s:%s: %s",
                                self.carbon_address, self.carbon_port, e)
            return False

    def send_to_carbon(self, message):
        while True:
            try:
                # self.carbon_sock.sendall(message) will result in a
                # broken pipe exception :(
                bytes_sent_total = 0
                message_length = len(message)
                while bytes_sent_total < message_length:
                    bytes_sent = self.carbon_sock.send(
                        message[bytes_sent_total:])
                    if bytes_sent == 0:
                        raise RuntimeError
                    bytes_sent_total += bytes_sent
            except Exception as e:
                self.logger.critical("Can't send message to carbon: %s", e)
                self.carbon_sock.close()
                if self.connect_carbon():
                    self.logger.debug("Successfully reconnected to carbon")
                else:
                    self.logger.warning(
                        "Carbon not responding; sleeping 30 seconds"
                    )
                    time.sleep(30)
            else:
                break

    def b64paths(self, host_name, service_name, plot_name):
        host_path = os.path.join(self.static_metrics_path, b64enc(host_name))
        if len(service_name) == 0:
            service_path = host_path
        else:
            service_path = os.path.join(host_path, b64enc(service_name))
        plot_path = os.path.join(service_path, b64enc(plot_name) + '.json')
        return {
            'host': host_path,
            'service': service_path,
            'plot': plot_path,
        }

    def export_static_metrics(self, metric):
        """
        Export static metrics to file system
        Format: JSON

        Assuming:
        * host name at metric[0]
        * service name at metric[2]
        * plot name at metric[3]
        * timestamp at metric[4]

        service_data's keys have to be u'...'

        Storing host metrics in:    static_metrics_path
                        / b64enc(host name) .json
        Storing service metrics in: static_metrics_path
                        / b64enc(host name) / b64enc(service name) .json

        b64enc encodes a string to URL-safe base64 (urlsafe_b64encode)
        '+' -> '-'
        '/' -> '_'
        """
        host_name = metric[0].translate(CARBON_METRIC_TRANSLATION_TABLE)
        service_name = metric[2].translate(CARBON_METRIC_TRANSLATION_TABLE)
        plot_name = metric[3].translate(CARBON_METRIC_TRANSLATION_TABLE)
        the_b64paths = self.b64paths(
            host_name=host_name,
            service_name=service_name,
            plot_name=plot_name
        )
        host_path=the_b64paths['host']
        service_path=the_b64paths['service']
        plot_path=the_b64paths['plot']
        # Create entry for host in checked_hosts_services (RAM)
        # and mkdir host_path (file system)
        # if not present yet
        if host_name not in self.checked_hosts_services:
            self.checked_hosts_services[host_name] = {}
            if not os.access(host_path, os.F_OK):
                os.mkdir(host_path, 0o0775)  # rwxrwxr-x
        plot_data = {  # actual metric
            u'timestamp': metric[4],
        }
        i = 7  # Assuming min, max, warn_* and crit_* at metric[7:15]
        for key in (
                u'lower_limit',
                u'upper_limit',
                u'warn_lower',
                u'warn_upper',
                u'warn_type',
                u'crit_lower',
                u'crit_upper',
                u'crit_type'):
            plot_data[key] = metric[i]
            i += 1
        data_changed = 0
        #    file system
        # 0  nothing to do  (data hasn't been changed)
        # 1  (re-)create    (invalid JSON or file is not present)
        # 2  append         (data has been changed)
        tmp_data = [plot_data]  # metrics list
        # Create entry for service in checked_hosts_services[host_name] (RAM)
        # if not present yet
        if service_name not in self.checked_hosts_services[host_name]:
            self.checked_hosts_services[host_name][service_name] = {}
            if len(service_name) != 0 and not os.access(service_path, os.F_OK):
                os.mkdir(service_path, 0o0775)  # rwxrwxr-x
        if plot_name not in self.checked_hosts_services[host_name][service_name]:
            if os.access(plot_path, os.F_OK):
                with open(plot_path) as f:
                    fcntl.lockf(f, fcntl.LOCK_SH)
                    try:
                        tmp_data = json.loads(f.read())
                    except ValueError:  # invalid JSON
                        data_changed = 1
                        self.logger.warning(
                            "Invalid JSON in '%s' (%s)! Re-creating file.",
                            plot_path,
                            host_name
                        )
                    fcntl.lockf(f, fcntl.LOCK_UN)
            else:  # file is not present
                data_changed = 1
            # Save the actual metric in RAM if going to (re-)create the file
            # Else save the old metric
            self.checked_hosts_services[host_name][service_name][plot_name] = \
                            (tmp_data[-1] if data_changed == 0 else plot_data)
        # Compare old and new data if not going to (re-)create the file
        if data_changed == 0 and plot_data[u'timestamp'] > \
            self.checked_hosts_services[host_name][service_name][plot_name][u'timestamp']:
            for key in self.checked_hosts_services[host_name][service_name][plot_name]:
                # Ignore timestamp changes
                if key != u'timestamp' and plot_data[key] != \
                    self.checked_hosts_services[host_name][service_name][plot_name][key]:
                    data_changed = 2
                    # Append new data to array if the data has been changed
                    tmp_data.append(plot_data)
                    break
        if data_changed != 0:
            # Write the data to file if going to (re-)create the file
            # or if the data has been changed
            with open(plot_path, 'w') as f:
                fcntl.lockf(f, fcntl.LOCK_EX)
                f.write(json.dumps(tmp_data))
                fcntl.lockf(f, fcntl.LOCK_UN)

    def store_metrics(self, metrics):
        if self.backend == 'xmlrpc':
            while True:
                try:
                    self.api.insertValueBulk(pickle.dumps(metrics))
                except Exception:
                    time.sleep(60)
                else:
                    break
        else:
            for metrics_chunk in grouper(metrics, 1000):
                batch = []
                for metric in metrics_chunk:
                    if not metric:
                        break
                    batch.append(
                        (
                            self.naming_scheme
                            .replace('<host>',metric[0].translate(CARBON_METRIC_TRANSLATION_TABLE))
                            .replace('<service>', metric[2].translate(CARBON_METRIC_TRANSLATION_TABLE))
                            .replace('<metric>', metric[3].translate(CARBON_METRIC_TRANSLATION_TABLE)),
                            (metric[4], metric[6])
                        )
                    )
                    self.export_static_metrics(metric)
                if batch:
                    payload = pickle.dumps(batch)
                    header = struct.pack("!L", len(payload))
                    message = header + payload
                    self.send_to_carbon(message)

    def get_static_metrics(self, host_name, service_name, plot_name):
        plot_path = self.b64paths(
            host_name=host_name,
            service_name=service_name,
            plot_name=plot_name
        )['plot']
        if os.access(plot_path, os.R_OK):
            with open(plot_path) as f:
                fcntl.lockf(f, fcntl.LOCK_SH)
                try:
                    tmp_data = json.loads(f.read())
                except ValueError:  # invalid JSON
                    self.logger.warning(
                        "Invalid JSON in '%s' (%s)!",
                        plot_path,
                        host_name
                    )
                    return None
                else:
                    return tmp_data
                finally:
                    fcntl.lockf(f, fcntl.LOCK_UN)
        else:
            return None

    class PyJsonRpcHttpRequestHandler(AuthenticatedHTTPRequestHandler):
        methods = {}
        required_username = None
        required_password = None

    def run(self):
        parser = PerfdataParser()
        last_flush = time.time()
        updates = []
        if self.backend != 'xmlrpc':
            self.PyJsonRpcHttpRequestHandler.required_username = self.collector_jsonrpc_user
            self.PyJsonRpcHttpRequestHandler.required_password = self.collector_jsonrpc_password
            self.PyJsonRpcHttpRequestHandler.methods['get_static_metrics'] = self.get_static_metrics
            self.JSONRPCServer = pyjsonrpc.ThreadingHttpServer(
                server_address = (self.collector_jsonrpc_address, self.collector_jsonrpc_port),
                RequestHandlerClass = self.PyJsonRpcHttpRequestHandler
            )
            self.JSONRPCServerThread = threading.Thread(target=self.JSONRPCServer.serve_forever)
            self.JSONRPCServerThread.daemon = True
            self.JSONRPCServerThread.start()
        try:
            while True:
                lines = 0
                files = glob.glob(self.perfpattern)[:self.limit]
                if files:
                    self.logger.debug("Parsing %d performance data files..",
                                      len(files))
                    input = fileinput.input(files)
                    for line in input:
                        try:
                            observation, perfdata = parser.parse(line)
                        except InvalidPerfdata, e:
                            print >> sys.stderr, "%s %s:%i" %\
                                (e, input.filename(), input.filelineno())
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
                        self.logger.debug("Storing metrics..")
                        st = time.time()
                        self.store_metrics(updates)
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
                self.logger.debug("Sleeping %d seconds..", self.sleeptime)
                time.sleep(self.sleeptime)
        except KeyboardInterrupt:
            print >> sys.stderr, "Ctrl-C pressed -- terminating..."


def main():
    DAEMON_FUNCTIONS = ['start', 'stop', 'restart', 'status']
    LOG_LVLS = ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')
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
    parser.add_option('-b', '--backend', default='xmlrpc',
                      choices=('xmlrpc', 'carbon'),
                      help="which backend to use; one of xmlrpc or carbon")
    parser.add_option('--static-metrics-path', dest='static_metrics_path')
    (options, args) = parser.parse_args()

    try:
        if args[0] not in DAEMON_FUNCTIONS:
            raise UnsupportedDaemonFunction()
    except (IndexError, UnsupportedDaemonFunction):
            parser.print_usage()
            sys.exit(1)

    if not options.static_metrics_path:
        print >> sys.stderr, "Static metrics directory not given. " \
                             "(--static-metrics-path)"
        sys.exit(1)

    collectord = Collectord(backend=options.backend,
                            perfdata_dir=options.perfdata_dir,
                            pattern=options.pattern,
                            limit=options.limit,
                            sleeptime=options.sleeptime,
                            mode=options.mode,
                            chdir=options.chdir,
                            detach=options.detach,
                            pidfile=options.pidfile,
                            format=options.format,
                            log=options.logfile,
                            static_metrics_path=options.static_metrics_path)

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

    if options.perfdata_dir and not os.access(options.perfdata_dir, os.W_OK):
        sys.stderr.write("Perfdata directory '%s' is not writable. "
                         "Please make sure the perfdata directory is writable so "
                         "the inGraph daemon can delete/move perfdata files.\n" % options.perfdata_dir)
        sys.exit(1)

    if options.static_metrics_path and not os.access(options.static_metrics_path, os.W_OK):
        sys.stderr.write("Static metrics directory '%s' is not writable. "
                         "Please make sure the static metrics directory is writable so "
                         "the inGraph daemon can write static metrics files.\n" % options.static_metrics_path)
        sys.exit(1)

    return getattr(collectord, args[0])()

if __name__ == '__main__':
    sys.exit(main())
