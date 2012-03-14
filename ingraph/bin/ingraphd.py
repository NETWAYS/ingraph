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

import Queue
import time
import traceback
import threading
import sys
import optparse
import logging

import ingraph
import ingraph.api
import ingraph.daemon
import ingraph.model
import ingraph.utils
import ingraph.xmlrpc


def flush(engine, queryqueue):
    while True:
        print("Queue size: %d" % queryqueue.qsize())
        items = []
        while len(items) < 5000:
            try:
                item = queryqueue.get(timeout=10)
            except Queue.Empty:
                break
            items.append(item)

        st = time.time()
        try:
            conn = engine.connect()
            transaction = conn.begin()
            ingraph.model.Plot.executeUpdateQueries(conn, items)
            transaction.commit()
            conn.close()
        except Exception:
            print("Exception occured while flushing DB updates")
            traceback.print_exc()
        et = time.time()
        
        print("Flushed %d updates in %f seconds." %
              (len(items), et-st))


def cleanup(engine):
    while True:
        time.sleep(24*60*60)
        ingraph.model.cleanup(engine)
        

def vacuum(engine):
    while True:
        time.sleep(7*24*60*60)
        ingraph.model.exec_vacuum(engine)
        

def pragma(engine, pragma):
    while True:
        time.sleep(5*60)
        ingraph.model.exec_pragma(engine, pragma)
        
        
def daemonized_thread(target, args):
    t = threading.Thread(target=target, args=args)
    t.setDaemon(True)
    t.start()


class UnsupportedDaemonFunction(Exception): pass


class InGraphd(ingraph.daemon.UnixDaemon):
    name = 'inGraph'
    
    def before_daemonize(self):
        self.logger.info("Starting %s..." % self.name)
        config = ingraph.utils.load_config('ingraph-database.conf')
        config = ingraph.utils.load_config('ingraph-xmlrpc.conf', config)
        if config['dsn'] == None:
            self.logger.error("Error: You need to set a database connection "
                  "string ('dsn' setting) in your configuration file.")
            sys.exit(1)
        
        if 'xmlrpc_address' not in config or 'xmlrpc_port' not in config:
            self.logger.error("Error: You need to set a bind address/port for "
                  "the XML-RPC interface ('xmlrpc_address' and 'xmlrpc_port' "
                  "settings).")
            sys.exit(1)
            
        if 'xmlrpc_username' not in config or 'xmlrpc_password' not in config:
            self.logger.error("Error: You need to set an XML-RPC username and "
                  "password ('xmlrpc_username' and 'xmlrpc_password' settings)"
                  " in your configuration file.")
            sys.exit(1)
            
        self.logger.info("Connecting to the database...")
        self.engine = None
        try:
            self.engine = ingraph.model.createModelEngine(config['dsn'])
        except:
            self.logger.exception("Could not connect to the database. Will re-try "
                "after daemonizing");
        
        self.logger.info("Starting XML-RPC interface on %s:%d..." %
              (config['xmlrpc_address'], config['xmlrpc_port']))
        server = ingraph.xmlrpc.AuthenticatedXMLRPCServer(
            (config['xmlrpc_address'], config['xmlrpc_port']), self.logger,
             allow_none=True)
        server.timeout = 5
        if sys.version_info[:2] < (2,6):
            server.socket.settimeout(server.timeout)
        server.required_username = config['xmlrpc_username']
        server.required_password = config['xmlrpc_password']
        server.register_introspection_functions()
        server.register_multicall_functions()
        self.server = server
        self.config = config
        
    def run(self):
        if self.engine == None:
            for i in range(1, 12):
                try:
                    self.engine = ingraph.model.createModelEngine(self.config['dsn'])
                except:
                    self.logger.exception("Database connection failed (attempt"
                        " #%d). Waiting for retry..." % (i))
                    time.sleep(5)
                else:
                    break
            if self.engine == None:
                self.engine = ingraph.model.createModelEngine(self.config['dsn'])
        queryqueue = Queue.Queue(maxsize=200000)
        rpcmethods = ingraph.api.BackendRPCMethods(self.engine, queryqueue,
            self.logger)
        self.server.register_instance(rpcmethods)
        
        daemonized_thread(flush, (self.engine, queryqueue))
        daemonized_thread(cleanup, (self.engine,))
        daemonized_thread(vacuum, (self.engine,))
        daemonized_thread(pragma, (self.engine, 'wal_checkpoint'))

        while not rpcmethods.shutdown_server:
            self.server.handle_request()

def main():
    daemon_functions = ('start', 'stop', 'restart', 'status')
    usage = "Usage: %%prog [options] %s" % '|'.join(daemon_functions)
    parser = optparse.OptionParser(usage=usage,
                                   version='%%prog %s' % ingraph.__version__)
    parser.add_option('-f', '--foreground', dest='detach', default=True,
                      action='store_false',
                      help='run in foreground')
    parser.add_option('-d', '--chdir', dest='chdir', metavar='DIR',
                      default='/etc/ingraph',
                      help='change to directory DIR [default: %default]')
    parser.add_option('-p', '--pidfile', dest='pidfile', metavar='FILE',
                      default='/var/run/ingraph/ingraphd.pid',
                      help="pidfile FILE [default: %default]")
    parser.add_option('-o', '--logfile', dest='logfile', metavar='FILE',
                      default=None, help='logfile FILE [default: %default]')
    parser.add_option('-u', '--user', dest='user', default=None)
    parser.add_option('-g', '--group', dest='group', default=None)
    parser.add_option('-L', '--loglevel', dest='loglevel', default='INFO',
                      help='the log level (INFO, WARNING, ERROR, CRITICAL), ' +
                           '[default: %default]')
    (options, args) = parser.parse_args()
    
    try:
        if args[0] not in daemon_functions:
            raise UnsupportedDaemonFunction()
    except (IndexError, UnsupportedDaemonFunction):
            parser.print_help()
            sys.exit(1)
            
    ingraphd = InGraphd(chdir=options.chdir,
                        detach=options.detach,
                        pidfile=options.pidfile)
    if options.logfile and options.logfile != '-':
        ingraphd.addLoggingHandler(logging.FileHandler(options.logfile))
    if options.loglevel not in ['INFO', 'WARNING', 'ERROR', 'CRITICAL']:
        ingraphd.logger.error('Invalid loglevel: %s' % (options.loglevel))
        sys.exit(1)
    ingraphd.logger.setLevel(getattr(logging, options.loglevel))
    if options.user:
        from pwd import getpwnam
        try:
            ingraphd.uid = getpwnam(options.user)[2]
        except KeyError:
            ingraphd.logger.error("User %s not found.\n" % options.user)
            sys.exit(1)
    if options.group:
        from grp import getgrnam
        try:
            ingraphd.gid = getgrnam(options.group)[2]
        except KeyError:
            ingraphd.logger.error("Group %s not found.\n" % options.group)
            sys.exit(1)
    
    getattr(ingraphd, args[0])()
    return 0

if __name__ == '__main__':
    sys.exit(main())
