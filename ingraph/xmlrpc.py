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

import xmlrpclib
from SocketServer import ThreadingTCPServer
from SimpleXMLRPCServer import (SimpleXMLRPCDispatcher,
                                SimpleXMLRPCRequestHandler,
                                SimpleXMLRPCDispatcher)
import base64
import sys
import traceback

class _xmldumps(object):
    def __init__(self, dumps):
        self.__dumps = (dumps,)

    def __call__(self, *args, **kwargs):
        kwargs.setdefault('allow_none', 1)
        return self.__dumps[0](*args, **kwargs)

xmlrpclib.dumps = _xmldumps(xmlrpclib.dumps)

# http://www.acooke.org/cute/BasicHTTPA0.html
class AuthenticatedXMLRPCServer(ThreadingTCPServer, SimpleXMLRPCDispatcher):
    allow_reuse_address = 1

    def __init__(self, addr, allow_none=False, logRequests=1,
                 encoding='iso-8859-1'):
        class AuthenticatedRequestHandler(SimpleXMLRPCRequestHandler):
            def parse_request(myself):
                if SimpleXMLRPCRequestHandler.parse_request(myself):
                    header = myself.headers.get('Authorization')
                    
                    if header == None:
                        username = None
                        password = None
                    else:                    
                        (basic, encoded) = \
                            header.split(' ', 2)
    
                        assert basic == 'Basic', 'Only basic authentication supported'
                        
                        (username,
                         password) = base64.b64decode(encoded).split(':', 2)
                    
                    if self.authenticate(username, password):
                        return True
                    else:
                        myself.send_response(401, 'Authentication failed')
                        myself.send_header('WWW-Authenticate',
                                           'Basic realm="XML-RPC"')
                        myself.end_headers()
                        
                        myself.wfile.write('Authentication failed.')
                
                return False
        
        self.logRequests = logRequests
        
        if sys.version_info[:2] < (2, 5):
            SimpleXMLRPCDispatcher.__init__(self)
        else:
            SimpleXMLRPCDispatcher.__init__(self, allow_none=allow_none,
                                            encoding=encoding)
            
        ThreadingTCPServer.__init__(self, addr, AuthenticatedRequestHandler)

        self.required_username = None
        self.required_password = None

    def authenticate(self, username, password):
        if self.required_username == None and self.required_password == None:
            return True
        
        return self.required_username == username and self.required_password == password

    def _dispatch(self, method, params):
        try:
            return SimpleXMLRPCDispatcher._dispatch(self, method, params)
        except Exception, e:
            print '---'
            print 'XML-RPC request caused exception:'
            print 'Method: %s' % (method)
            print 'Parameters: %s' % (str(params))
            print 'Exception information'
            print e
            print 'Stacktrace:'
            traceback.print_exc()
            print '---'

            raise
