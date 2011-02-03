import os, sys

def load_config(path, existing_config={}):
    if not os.path.isfile(path):
        sys.stderr.write("Configuration file '%s' does not exist.\n" % (path))
        sys.exit(1)
    
    sys.stderr.write("Loading configuration settings (from '%s')...\n" % (path))

    config = existing_config

    execfile(path, config)        

    return config

def get_xmlrpc_url(config):
    return "http://%s:%s@%s:%s/" % \
        (config['xmlrpc_username'], config['xmlrpc_password'],
        config['xmlrpc_address'], config['xmlrpc_port'])
