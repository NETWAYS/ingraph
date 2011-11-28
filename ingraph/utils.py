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
    _multiRegex = re.compile('^([^:]+::[^:]+::)[^:]+$')
    
    _bytesuffixes = {
        'B': 1024**0,
        'KB': 1024**1,
        'MB': 1024**2,
        'GB': 1024**3,
        'TB': 1024**4,
        'PB': 1024**5,
        'EB': 1024**6
    }
    
    _brokensuffixes = {
        'K': 1000**1,
        'M': 1000**2,
        'G': 1000**3,
        'T': 1000**4,
        'P': 1000**5,
        'E': 1000**6,
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
        elif unit.upper() in PerfdataParser._brokensuffixes:
            uom = 'raw'
            result_value = value * PerfdataParser._brokensuffixes[unit.upper()]
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
        
        multi_prefix = None
        
        for match in matches:
            key = match[0]
            values = match[1].split(';')
            
            multi_match = PerfdataParser._multiRegex.match(key)
            
            if multi_match:
                multi_prefix = multi_match.group(1)
            elif multi_prefix != None:
                key = multi_prefix + key
            
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
        
        lower = PerfdataParser.parsePerfdataNumber(lower, unit)

        if lower == None:
            lower = { 'value': None }
            
        upper = PerfdataParser.parsePerfdataNumber(upper, unit)

        if upper == None:
            upper = { 'value': None }
        
        return {
            'lower': lower,
            'upper': upper,
            'type': type
        }
    
    parseRange = staticmethod(parseRange)

    parse = staticmethod(parse)
