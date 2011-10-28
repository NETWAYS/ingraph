#!/usr/bin/env python
import Queue
import time
import traceback
import threading
import sys
import optparse

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
    t.daemon = True
    t.start()


class UnsupportedDaemonFunction(Exception): pass


class InGraphd(ingraph.daemon.UnixDaemon):
    name = 'inGraph'
    
    def run(self):
        print("inGraph (backend daemon)")
        
        config = ingraph.utils.load_config('ingraph-database.conf')
        config = ingraph.utils.load_config('ingraph-xmlrpc.conf', config)
        if config['dsn'] == None:
            print("Error: You need to set a database connection string "
                  "('dsn' setting) in your configuration file.")
            sys.exit(1)
        
        if 'xmlrpc_address' not in config or 'xmlrpc_port' not in config:
            print("Error: You need to set a bind address/port for the XML-RPC"
                  " interface ('xmlrpc_address' and 'xmlrpc_port' settings).")
            sys.exit(1)
            
        if 'xmlrpc_username' not in config or 'xmlrpc_password' not in config:
            print("Error: You need to set an XML-RPC username and password "
                  "('xmlrpc_username' and 'xmlrpc_password' settings) in your "
                  "configuration file.")
            sys.exit(1)
            
        print('Connecting to the database...')
        engine = ingraph.model.createModelEngine(config['dsn'])
        
        queryqueue = Queue.Queue(maxsize=200000)
        
        daemonized_thread(flush, (engine, queryqueue))
        daemonized_thread(cleanup, (engine,))
        daemonized_thread(vacuum, (engine,))
        daemonized_thread(pragma, (engine, 'wal_checkpoint'))
        
        print("Starting XML-RPC interface on %s:%d..." %
              (config['xmlrpc_address'], config['xmlrpc_port']))
        server = ingraph.xmlrpc.AuthenticatedXMLRPCServer(
            (config['xmlrpc_address'], config['xmlrpc_port']), allow_none=True)
        server.timeout = 5
        
        if sys.version_info[:2] < (2,6):
            server.socket.settimeout(server.timeout)
        
        server.required_username = config['xmlrpc_username']
        server.required_password = config['xmlrpc_password']
        
        server.register_introspection_functions()
        server.register_multicall_functions()
        server.register_instance(ingraph.api.BackendRPCMethods(engine,
                                                               queryqueue))
        server.serve_forever()


def main():
    daemon_functions = ('start', 'stop', 'restart', 'status')
    usage = "Usage: %%prog [options] %s" % '|'.join(daemon_functions)
    parser = optparse.OptionParser(usage=usage,
                                   version='%%prog %s' % ingraph.__version__)
    parser.add_option('-f', '--foreground', dest='detach', default=True,
                      action='store_false',
                      help='run in foreground')
    parser.add_option('-d', '--chdir', dest='chdir', metavar='DIR',
                      default='cwd',
                      help='change to directory DIR [default: %default]')
    parser.add_option('-p', '--pidfile', dest='pidfile', metavar='FILE',
                      default='/var/run/ingraphd.pid',
                      help="pidfile FILE [default: %default]")
    parser.add_option('-o', '--logfile', dest='logfile', metavar='FILE',
                      default=None, help='logfile FILE [default: %default]')
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
    if options.logfile:
        ingraphd.stdout = options.logfile
        ingraphd.stderr = options.logfile
    
    getattr(ingraphd, args[0])()
    return 0

if __name__ == '__main__':
    sys.exit(main())