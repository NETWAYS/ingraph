import sys
import os
import signal
import atexit
import errno


__all__ = ['UnixDaemon']


class UnixDaemon(object):
    def __init__(self, pidfile, umask=0, chdir='/', uid=os.getuid(),
                 gid=os.getgid(), detach=True, stdin=os.devnull,
                 stdout=os.devnull, stderr=os.devnull):
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

    def _daemonize(self):
        try: 
            pid = os.fork() 
            if pid > 0:
                os._exit(0)
        except OSError, e:
            sys.stderr.write("fork #1 failed: %d (%s)\n" %
                             (e.errno, e.strerror))
            os._exit(1)
        os.setsid() # os.setpgrp?
        try: 
            pid = os.fork() 
            if pid > 0:
                os._exit(0)
        except OSError, e:
            sys.stderr.write("fork #2 failed: %d (%s)\n" %
                             (e.errno, e.strerror))
            os._exit(1)

    def _SIGTERM(self, signum, stack_frame):
        sys.exit(0)

    def _atexit(self):
        self._delpid()
        self.cleanup()

    def cleanup(self):
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
            sys.stderr.write("pidfile %s already exists. Daemon already "
                             "running?\n" % self.pidfile)
            sys.exit(1)
        
        os.umask(self.umask)
        os.chdir(self.chdir)
        os.setuid(self.uid)
        os.setgid(self.gid)
        
        if self.detach:
            self._daemonize()
            self._redirect_stream(sys.stdin, self.stdin)
            self._redirect_stream(sys.stdout, self.stdout)
            self._redirect_stream(sys.stderr, self.stderr)
        
        signal.signal(signal.SIGTERM, self._SIGTERM)
        atexit.register(self._atexit)
        
        pf = open(self.pidfile, 'w+b')
        pf.write(str(os.getpid()))
        pf.close()
        
        self.run()

    def stop(self):
        pid = self._getpid()
        if not pid:
            sys.stderr.write("pidfile %s does not exist. Daemon not running?\n"
                             % self.pidfile)
            sys.exit(1)
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
            sys.stdout.write("%s daemon running with pid: %i\n" %
                             (self.name, pid))
        else:
            sys.stdout.write("%s daemon not running\n" %
                             self.name)
    
    def run(self):
        pass