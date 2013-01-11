# Copyright (C) 2012 NETWAYS GmbH, http://netways.de
#
# This file is part of inGraph (https://www.netways.org/projects/ingraph).
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
import resource
import logging

from pwd import getpwnam
from grp import getgrnam
from optparse import OptionGroup

__all__ = ['UnixDaemon', 'add_optparse_daemon_options']

try:
    os.SEEK_SET
except AttributeError:
    # Python < 2.5
    os.SEEK_SET = 0
try:
    MAXFD = os.sysconf('SC_OPEN_MAX')
except:
    MAXFD = 1024

log = logging.getLogger(__name__)


class UnixDaemon(object):
    """Well-behaved unix daemon according to Stevens in [1].
    [1] W. Richard Stevens, "Advanced Programming in the Unix Environment", 1992, Addison-Wesley"""
    def __init__(
            self,
            pidfile,
            umask=0,
            chdir='/',
            user=None,
            group=None,
            detach=True,
            logfile=None,
            **kwargs):
        self._pidfle = pidfile
        self._pidfp = None
        self._pidlocked = False
        self._chdir = chdir
        self._detach = detach
        self._logfile = logfile
        if user:
            self.uid = getpwnam(user).pw_uid
        else:
            self.uid = os.getuid()
        if group:
            self.gid = getgrnam(group).gr_gid
        else:
            self.gid = os.getgid()
        self._umask = umask
        self._stdout = sys.stdout
        self._stderr = sys.stderr
        super(UnixDaemon, self).__init__()

    def _daemonize(self):
        try:
            pid = os.fork()
            if pid > 0:
                os._exit(0)
        except OSError, e:
            raise Exception("fork #1 failed: %d (%s)" % (e.errno, e.strerror))
        os.setsid()
        try:
            pid = os.fork()
            if pid > 0:
                os._exit(0)
        except OSError, e:
            raise Exception("fork #2 failed: %d (%s)" % (e.errno, e.strerror))

    def _sigterm_handler(self, signum, stack_frame):
        sys.exit(0)

    def _atexit(self):
        self._delpid()
        self.cleanup()

    def cleanup(self):
        pass

    def _delpid(self):
        if not self._pidlocked:
            raise Exception("Trying to unlink PID file while not holding lock.")
        try:
            os.unlink(self._pidfle)
        except OSError:
            pass

    def _openpidfile(self):
        try:
            self._pidfp = open(self._pidfle, 'r+')
        except IOError:
            pidpath = os.path.split(self._pidfle)[0]
            try:
                os.mkdir(pidpath)
                os.chown(pidpath, self.uid, -1)
            except OSError, e:
                if e.errno != errno.EEXIST:
                    raise e
            self._pidfp = open(self._pidfle, 'w+')
        self._waitpidfile(False)

    def _waitpidfile(self, blocking=True):
        if not self._pidlocked:
            try:
                flags = fcntl.LOCK_EX
                if not blocking:
                    flags |= fcntl.LOCK_NB

                fcntl.flock(self._pidfp.fileno(), flags)
                self._pidlocked = True
            except:
                pass

    def _closepidfile(self):
        if self._pidfp != None:
            self._pidfp.close()
        self._pidfp = None
        self._pidlocked = False

    def _getpid(self):
        if self._pidfp == None:
            self._openpidfile()
        if self._pidlocked:
            return None
        try:
            self._pidfp.seek(0, os.SEEK_SET)
            pidstr = self._pidfp.readline()
        except IOError:
            return True
        try:
            return int(pidstr.strip())
        except ValueError:
            return True

    def _writepid(self):
        if not self._pidlocked:
            raise Exception("Trying to write PID file while not holding lock.")
        self._pidfp.seek(0, os.SEEK_SET)
        self._pidfp.truncate()
        self._pidfp.write(str(os.getpid()))
        self._pidfp.flush()

    def _redirect_stream(self, source, target):
        try:
            targetfd = target.fileno()
        except AttributeError:
            targetfd = os.open(target, os.O_CREAT | os.O_APPEND | os.O_RDWR)
        source.flush()
        os.dup2(targetfd, source.fileno())

    def _close_fds(self, but):
        maxfd = resource.getrlimit(resource.RLIMIT_NOFILE)[1]
        if maxfd == resource.RLIM_INFINITY:
            maxfd = MAXFD
        try:
            os.closerange(3, but)
            os.closerange(but + 1, maxfd)
        except AttributeError:
            # Python < v2.6
            for i in xrange(3, maxfd):
                if i == but:
                    continue
                try:
                    os.close(i)
                except:
                    pass

    def _check_logfile_permissions(self):
        if self._logfile:
            self._logfile = os.path.abspath(self._logfile)
            try:
                fp = open(self._logfile, 'a')
            except IOError as e:
                if e.errno == errno.EACCES:
                    log.critical("Permission denied to write to logfile %s.." % self._logfile)
                    sys.exit(1)
                # Not a permission error
                raise
            else:
                fp.close()

    def start(self):
        pid = self._getpid()
        if pid:
            log.error("%s already running with pid %i" % (self.name, pid))
            sys.exit(1)
        os.umask(self._umask)
        os.chdir(self._chdir)
        os.setgid(self.gid)
        os.setuid(self.uid)
        self.before_daemonize()
        if self._detach:
            self._check_logfile_permissions()
            self._daemonize()
            self._close_fds(self._pidfp.fileno())
            if self._logfile:
                # Remove all already attached handlers
                del logging.getLogger().handlers[:]
                channel = logging.FileHandler(filename=self._logfile)
                logging.getLogger().addHandler(channel)
                redirect_to = channel.stream
            else:
                redirect_to = os.devnull
            self._redirect_stream(sys.stdin, os.devnull)
            self._redirect_stream(sys.stdout, redirect_to)
            self._redirect_stream(sys.stderr, redirect_to)
        signal.signal(signal.SIGTERM, self._sigterm_handler)
        atexit.register(self._atexit)
        self._writepid()
        self.run()

    def stop(self, ignore_error=False):
        pid = self._getpid()
        if not pid and not ignore_error:
            log.error("%s is NOT running" % self.name)
            sys.exit(1)
        log.info("Waiting for %s to die.." % self.name)
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
            log.info("%s is running with pid %i" % (self.name, pid))
        else:
            log.info("%s is NOT running" % self.name)

    def run(self):
        pass

    def before_run(self):
        pass


def add_optparse_daemon_options(parser):
    start_stop_group = OptionGroup(parser, "Start and stop",
        "Here are the options to specify the daemon and how it should start or stop:")
    start_stop_group.add_option('-p', '--pidfile', dest='pidfile', metavar='FILE', default='/var/run/ingraph/ingraph.pid',
        help="pidfile FILE [default: %default]")
    start_stop_group.add_option('-u', '--user', dest='user', default=None,
        help="Start/stop the daemon as the user.")
    start_stop_group.add_option('-g', '--group', dest='group', default=None,
        help="Start/stop the daemon as in the group.")
    start_group = OptionGroup(parser, "Start",
        "These options are only used for starting daemons:")
    start_group.add_option('-b', '--background', dest='detach', default=False, action='store_true',
        help="Force the daemon into the background.")
    start_group.add_option('-d', '--chdir', dest='chdir', metavar='DIR', default='/etc/ingraph',
        help="chdir to directory DIR before starting the daemon. [default: %default]")
    start_group.add_option('-k', '--umask', dest='umask', default=None,
        help="Set the umask of the daemon.")
    start_group.add_option('-o', '--logfile', dest='logfile', metavar='FILE', default=None,
        help="Redirect stdout and stderr to logfile FILE when started with --background. "
             "Must be an absolute pathname. [default: %default]")
    parser.add_option_group(start_stop_group)
    parser.add_option_group(start_group)
