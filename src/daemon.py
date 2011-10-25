import sys
import os
import signal
import atexit
import errno


__all__ = ['UnixDaemon']


class UnixDaemon(object):
    def __init__(self, pidfile, umask=0, chdir='/', uid=os.getuid(),
                 gid=os.getgid(), detach=False, stdin=sys.stdin,
                 stdout=sys.stdout, stderr=sys.stderr):
        self.stdin = stdin
        self.stdout = stdout
        self.stderr = stderr
        self.pidfile = pidfile
        self.chdir = chdir
        self.detach = detach
        self.uid = uid
        self.gid = gid
        self.umask = umask
        super(UnixDaemon, self).__init__()

    def daemonize(self):
        try: 
            pid = os.fork() 
            if pid > 0:
                os._exit(0)
        except OSError, e:
            print >> sys.stderr, "fork #1 failed: %d (%s)" % (e.errno,
                                                              e.strerror)
            os._exit(1)
        os.setsid() # os.setpgrp?
        try: 
            pid = os.fork() 
            if pid > 0:
                os._exit(0)
        except OSError, e:
            print >> sys.stderr, "fork #2 failed: %d (%s)\n" % (e.errno,
                                                                e.strerror)
            os._exit(1)

    def _SIGTERM_handler(self, signum, stack_frame):
        sys.exit(0)

    def _atexit(self):
        self._delpid()
        self._cleanup()

    def _cleanup(self):
        pass

    def _delpid(self):
        try:
            os.remove(self.pidfile)
        except OSError:
            pass

    def _getpid(self):
        try:
            pf = open(self.pidfile, 'rb')
            pid = int(pf.readline().strip())
            pf.close()
        except IOError:
            pid = None
        return pid
    
    def _redirect_stream(self, source, target):
        try:
            targetfd = target.fileno()
        except AttributeError:
            targetfd = os.open(target, os.O_CREAT | os.O_APPEND | os.O_RDWR)
        os.dup2(targetfd, source.fileno())

    def start(self):
        pid = self._getpid()
        if pid:
            print >> sys.stderr, "pidfile %s already exists. " \
                                 "Daemon already running?" % self.pidfile
            sys.exit(1)
        
        os.umask(self.umask)
        os.chdir(self.chdir)
        os.setuid(self.uid)
        os.setgid(self.gid)
        
        if self.detach:
            self.daemonize()
            
        self._redirect_stream(sys.stdin, self.stdin)
        self._redirect_stream(sys.stdout, self.stdout)
        self._redirect_stream(sys.stderr, self.stderr)
        
        pid = str(os.getpid())
        pf = open(self.pidfile, 'w+b')
        print >> pf, pid
        pf.close()
        
        signal.signal(signal.SIGTERM, self._SIGTERM_handler)
        atexit.register(self._atexit)
        
        self._run()

    def stop(self):
        pid = self._getpid()

        if not pid:
            print >> sys.stderr, "pidfile %s does not exist. " \
                                 "Daemon not running?" % self.pidfile
            return
        try:
            os.kill(pid, signal.SIGTERM)
        except OSError, e:
            if e.errno != errno.ESRCH:
                raise e

    def restart(self):
        self.stop()
        self.start()

    def status(self):
        pid = self._getpid()

        if pid:
            print "%s daemon running with pid: %i" % (self.__class__.__name__,
                                                      pid)
        else:
            print "%s daemon not running " % self.__class__.__name__

    def _run(self):
        pass