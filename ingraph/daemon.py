# inGraph (https://www.netways.org/projects/ingraph)
# Copyright (C) 2011 NETWAYS GmbH
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
import signal
import atexit
import errno
import fcntl

try:
    os.SEEK_SET
except AttributeError:
    import posixfile
    os.SEEK_SET = posixfile.SEEK_SET

__all__ = ['UnixDaemon']


class UnixDaemon(object):
    def __init__(self, pidfile, umask=0, chdir='/', uid=os.getuid(),
                 gid=os.getgid(), detach=True, stdin=os.devnull,
                 stdout=os.devnull, stderr=os.devnull):
        self.stdin = stdin
        self.stdout = stdout
        self.stderr = stderr
        self.pidfile = os.path.realpath(
            os.path.expanduser(pidfile))
        self.pidfp = None
        self.pidlocked = False
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
        if not self.pidlocked:
            raise Exception('Trying to unlink PID file while not holding lock.')

        try:
            os.unlink(self.pidfile)
        except OSError:
            pass

    def _openpidfile(self):
        try:
            self.pidfp = open(self.pidfile, 'r+')
        except IOError:
            pidpath = os.path.split(self.pidfile)[0]
            try:
                os.mkdir(pidpath)
                os.chown(pidpath, self.uid, -1)
            except OSError, e:
                if e.errno != errno.EEXIST:
                    raise e
            self.pidfp = open(self.pidfile, 'w+')

        self._waitpidfile(False)

    def _waitpidfile(self, blocking=True):
        if not self.pidlocked:
            try:
                flags = fcntl.LOCK_EX

                if not blocking:
                    flags |= fcntl.LOCK_NB

                fcntl.flock(self.pidfp.fileno(), flags)
                self.pidlocked = True
            except:
                pass

    def _closepidfile(self):
        if self.pidfp != None:
            self.pidfp.close()

        self.pidfp = None
        self.pidlocked = False

    def _getpid(self):
        if self.pidfp == None:
            self._openpidfile()

        if self.pidlocked:
            return None

        try:
            self.pidfp.seek(0, os.SEEK_SET)
            pidstr = self.pidfp.readline()
        except IOError:
            return True

        try:
            return int(pidstr.strip())
        except ValueError:
            return True

    def _writepid(self):
        if not self.pidlocked:
            raise Exception('Trying to write PID file while not holding lock.')

        self.pidfp.seek(0, os.SEEK_SET)
        self.pidfp.truncate()
        self.pidfp.write(str(os.getpid()))
        self.pidfp.flush()
    
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
        os.setgid(self.gid)
        os.setuid(self.uid)
        
        self.before_daemonize()
        if self.detach:
            self._daemonize()
            self._redirect_stream(sys.stdin, self.stdin)
            self._redirect_stream(sys.stdout, self.stdout)
            self._redirect_stream(sys.stderr, self.stderr)
        
        signal.signal(signal.SIGTERM, self._SIGTERM)
        atexit.register(self._atexit)
 
        self._writepid()       
        
        self.run()

    def stop(self, ignore_error=False):
        pid = self._getpid()
        if not pid and not ignore_error:
            sys.stderr.write("pidfile %s does not exist. Daemon not running?\n"
                             % self.pidfile)
            sys.exit(1)

        try:
            if pid and pid != True:
                os.kill(pid, signal.SIGTERM)
                self._waitpidfile()
        except OSError, e:
            if e.errno != errno.ESRCH:
                raise e

    def restart(self):
        self.stop(True)
        self._closepidfile()
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
    
    def before_daemonize(self):
        pass
