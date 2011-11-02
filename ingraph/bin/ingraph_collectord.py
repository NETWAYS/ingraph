#!/usr/bin/env python

import sys
import os
import optparse
import glob
import fileinput
import re
import time
import shutil
import copy
import pickle
import xmlrpclib

import ingraph
import ingraph.api
from ingraph import daemon
from ingraph import utils


class UnsupportedDaemonFunction(Exception): pass


class Collectord(daemon.UnixDaemon):
    name = 'inGraph-collector'
    check_multi_regex = re.compile('^([^:]+::[^:]+)::([^:]+)$')
    
    def __init__(self, perfdata_dir, pattern, limit, sleeptime, mode,
                 **kwargs):
        self.perfpattern = perfdata_dir + '/' + pattern
        self.sleeptime = sleeptime
        self.limit = limit
        self.mode = mode
        super(Collectord, self).__init__(**kwargs)
        
    def _prepare_update(self, line):
        data = line.strip().split('\t')
        
        if len(data) < 4:
            return False
        elif len(data) < 5:
            data.append(time())
        
        logdata = {
            'host': data[0],
            'service': data[1],
            'status': data[2],
            'perf': data[3],
            'timestamp': int(data[4])
        }
        
        perfresults = utils.PerfdataParser.parse(logdata['perf'])
        
        is_multidata = False
        
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

            update = (logdata['host'], upd_parentservice, upd_service,
                      upd_plotname, logdata['timestamp'], uom, raw_value,
                      raw_value, raw_value, min_value, max_value, warn_lower,
                      warn_upper, warn_type, crit_lower, crit_upper, crit_type,
                      pluginstatus)
            return update
        
    def before_daemonize(self):
        config = utils.load_config('ingraph-xmlrpc.conf')
        config = utils.load_config('ingraph-aggregates.conf', config)
        self.config = config
    
    def run(self):
        url = utils.get_xmlrpc_url(self.config)
        api = xmlrpclib.ServerProxy(url, allow_none=True)
        
        tfs = api.getTimeFrames()
        intervals = tfs.keys()
            
        for aggregate in self.config['aggregates']:
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
            print tf
        
        while True:
            updates = []
            files = glob.glob(self.perfpattern)
            input = fileinput.input(files[:self.limit])
            for line in input:
                update = self._prepare_update(line)
                if update == False:
                    continue
                updates.append(update)
            if updates:
                updates_pickled = pickle.dumps(updates)
                st = time.time()
                ingraph.api.insertValueBulk(updates_pickled)
                et = time.time()
                print "%d updates (%d lines) took %f seconds" % \
                      (len(updates), input.lineno(), et - st)
            if self.mode == 'BACKUP':
                for file in files:
                    shutil.move(file, file + '.bak')
            elif self.mode == 'REMOVE':
                for file in files:
                    os.remove(file)
            time.sleep(self.sleeptime)
            
            
class Option(optparse.Option):
    MODES = ['REMOVE', 'BACKUP']

    def __init__(self, *opts, **attrs):
        Option.TYPES = optparse.Option.TYPES + ('mode',)
        Option.TYPE_CHECKER = copy.copy(optparse.Option.TYPE_CHECKER)
        Option.TYPE_CHECKER['mode'] = self.check_mode
        optparse.Option.__init__(self, *opts, **attrs)
    
    def check_mode(self, option, opt, value):
        value = value.upper()
        if value not in Option.MODES:
            raise optparse.OptionValueError(
                'Option %s: invalid mode. Expected is one of: %s.' %
                (value, ', '.join(Option.Modes)))
        return value
    
    
def main():
    daemon_functions = ['start', 'stop', 'restart', 'status']
    usage = 'Usage: %%prog [options] %s' % '|'.join(daemon_functions)
    parser = optparse.OptionParser(option_class=Option, usage=usage,
                                   version='%%prog %s' % ingraph.__version__)
    parser.add_option('-f', '--foreground', dest='detach', default=True,
                      action='store_false',
                      help='run in foreground')
    parser.add_option('-d', '--chdir', dest='chdir', metavar='DIR',
                      default='/etc/ingraph',
                      help='change to directory DIR [default: %default]')
    parser.add_option('-p', '--pidfile', dest='pidfile', metavar='FILE',
                      default='/var/run/ingraph/ingraph-collectord.pid',
                      help="pidfile FILE [default: %default]")
    parser.add_option('-o', '--logfile', dest='logfile', metavar='FILE',
                      default=None, help='logfile FILE [default: %default]')
    parser.add_option('-P', '--perfdata-dir', dest='perfdata_dir',
                      default='/usr/local/icinga/var/perfdata',
                      metavar='DIR', help='perfdata directory DIR '
                      '[default: %default]')
    parser.add_option('-e', '--pattern', dest='pattern',
                      help='shell pattern PATTERN [default: %default]',
                      default='service-perfdata.*[0-9]')
    parser.add_option('-m', '--mode', dest='mode', default='BACKUP',
                      type='mode',
                      help='backup or remove perfdata files '
                      'after processing [default: %default]')
    parser.add_option('-l', '--limit', dest='limit', type='int',
                      help='limit files [default: %default]', default=1)
    parser.add_option('-s', '--sleeptime', dest='sleeptime', type='int',
                      help='seconds to sleep [default: %default]',
                      default=30)
    parser.add_option('-u', '--user', dest='user', default=None)
    parser.add_option('-g', '--group', dest='group', default=None)
    (options, args) = parser.parse_args()
    
    try:
        if args[0] not in daemon_functions:
            raise UnsupportedDaemonFunction()
    except (IndexError, UnsupportedDaemonFunction):
            parser.print_help()
            sys.exit(1)
            
    collectord = Collectord(perfdata_dir=options.perfdata_dir,
                            pattern=options.pattern,
                            limit=options.limit,
                            sleeptime=options.sleeptime,
                            mode=options.mode,
                            chdir=options.chdir,
                            detach=options.detach,
                            pidfile=options.pidfile)
    if options.logfile:
        collectord.stdout = options.logfile
        collectord.stderr = options.logfile
    if options.user:
        from pwd import getpwnam
        try:
            collectord.uid = getpwnam(options.user)[2]
        except KeyError:
            sys.stderr.write("User %s not found.\n" % options.user)
            sys.exit(1)
    if options.group:
        from grp import getgrnam
        try:
            collectord.gid = getgrnam(options.group)[2]
        except KeyError:
            sys.stderr.write("Group %s not found.\n" % options.group)
            sys.exit(1)

    getattr(collectord, args[0])()
    return 0


if __name__ == '__main__':
    sys.exit(main())
