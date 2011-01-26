import os, sys

def load_config(path, existing_config={}):
    if not os.path.isfile(path):
        print("Configuration file '%s' does not exist." % (path))
        sys.exit(1)
    
    print("Loading configuration settings (from '%s')..." % (path))

    config = existing_config

    execfile(path, config)        

    return config
