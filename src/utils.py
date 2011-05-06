import os, sys, re

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

class PerfdataParser(object):
    _perfRegex = re.compile('([^= ][^=]*)=([^ ]+)')
    _intRegex = re.compile('^([+-]?[0-9,.]+)[ ]*(.*?)$')
    _rangeRegex = re.compile('^(@?)([^:]*)(:?)([^:]*)$')
    
    _bytesuffixes = {
        'B': 1024**0,
        'KB': 1024**1,
        'MB': 1024**2,
        'GB': 1024**3,
        'TB': 1024**4,
        'PB': 1024**5,
        'EB': 1024**6
    }
    
    _timesuffixes = {
        's': 10**0,
        'ms': 10**(-3),
        'us': 10**(-6)
    }
    
    def parsePerfdataNumber(raw_value, unit=None):
        raw_value = raw_value.strip()
               
        if raw_value == '':
            return None
                
        match = PerfdataParser._intRegex.match(raw_value)
        
        if not match:
            print("Failed to parse perfdata integer: %s" % (raw_value))
            return None
        
        try:
            value = float(match.group(1))
        except ValueError:
            print("Failed to parse perfdata integer: %s" % (raw_value))
            return None
        
        if unit == None:
            unit = match.group(2)
        
        if unit == '%':
            uom = 'percent'
            result_value = value
        elif unit.upper() in PerfdataParser._bytesuffixes:
            uom = 'byte'
            result_value = value * PerfdataParser._bytesuffixes[unit.upper()]
        elif unit in PerfdataParser._timesuffixes:
            uom = 'time'
            result_value = value * PerfdataParser._timesuffixes[unit] 
        elif unit == 'c':
            uom = 'counter'
            result_value = value
        else:
            uom = 'raw'
            result_value = value
        
        return {
            'value': result_value,
            'uom': uom,
            'input_uom': unit 
        }
    
    parsePerfdataNumber = staticmethod(parsePerfdataNumber)
    
    def parse(perfdata):
        if '.' in perfdata and ',' in perfdata:
            perfdata = perfdata.replace(',', ';')
        else:
            perfdata = perfdata.replace(',', '.')
 
        if perfdata.count('.') > 1 and not ';' in perfdata:
            perfdata = perfdata.replace('.', ';')

        matches = PerfdataParser._perfRegex.findall(perfdata)
        
        plots = {}
        
        for match in matches:
            key = match[0]
            values = match[1].split(';')
            
            plot = {}
            
            raw = PerfdataParser.parsePerfdataNumber(values[0])
                        
            if raw == None:
                continue
            
            plot['raw'] = raw

            unit = raw['input_uom']
            
            if len(values) >= 2:
                warn = PerfdataParser.parseRange(values[1], unit)
                
                if warn != None:
                    plot['warn'] = warn
            
            if len(values) >= 3:
                crit = PerfdataParser.parseRange(values[2], unit)
                
                if crit != None:
                    plot['crit'] = crit
            
            if len(values) >= 4:
                min = PerfdataParser.parsePerfdataNumber(values[3], unit)
                
                if min != None:
                    plot['min'] = min

            if len(values) >= 5:
                max = PerfdataParser.parsePerfdataNumber(values[4], unit)
                
                if max != None:
                    plot['max'] = max

            if raw['uom'] == 'percent':
                plot['min'] = {
                    'value': 0,
                    'uom': 'percent',
                    'input_uom': 'percent'
                }

                plot['max'] = {
                    'value': 100,
                    'uom': 'percent',
                    'input_uom': 'percent'
                }
                
            plots[key] = plot
        
        return plots
    
    def parseRange(range, unit):
        match = PerfdataParser._rangeRegex.match(range)
        
        if not match:
            print "Failed to parse range: " + range
            return None
        
        if match.group(0) == '@':
            type = 'inside'
        else:
            type = 'outside'
            
        lower = match.group(2)
        upper = match.group(4)
        
        if match.group(3) == '':
            upper = lower
            lower = '0'
        
        if lower == '~':
            lower = { 'value': None }
        else:
            lower = PerfdataParser.parsePerfdataNumber(lower, unit)
            
        if upper == '':
            upper = { 'value': None }
        else:
            upper = PerfdataParser.parsePerfdataNumber(upper, unit)
        
        return {
            'lower': lower,
            'upper': upper,
            'type': type
        }
    
    parseRange = staticmethod(parseRange)

    parse = staticmethod(parse)
