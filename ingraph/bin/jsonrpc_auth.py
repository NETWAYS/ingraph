import pyjsonrpc
import base64


class AuthenticatedHTTPRequestHandler(pyjsonrpc.HttpRequestHandler):
    def authenticate(self, username, password):
        if self.required_username == None and self.required_password == None:
            return True
        return self.required_username == username and self.required_password == password

    def parse_request(self):
        if pyjsonrpc.HttpRequestHandler.parse_request(self):
            header = self.headers.get('Authorization')
            if header == None:
                username = None
                password = None
            else:
                (basic, encoded) = header.split(' ', 2)
                assert basic == 'Basic', 'Only basic authentication supported'
                (username, password) = base64.b64decode(encoded).split(':', 2)
            if self.authenticate(username, password):
                return True
            else:
                self.send_response(401, 'Authentication failed')
                self.send_header('WWW-Authenticate', 'Basic realm=""')
                self.end_headers()
                self.wfile.write('Authentication failed.')
        return False