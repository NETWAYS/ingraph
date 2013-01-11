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

import re

__all__ = ['PerfdataParser', 'InvalidPerfdata']


class InvalidPerfdata(Exception): pass


class PerfdataParser(object):
    """Parser for performance data files written by Icinga."""
    _key_extraction_fn = {
        'TIMET': lambda v: ('timestamp', float(v)),
        'HOSTNAME': lambda v: ('host', v),
        'SERVICEDESC': lambda v: ('service', v),
        'HOSTSTATE': lambda v: ('state', v),
        'SERVICESTATE': lambda v: ('state', v),
        'HOSTPERFDATA': lambda v: ('perfdata', v),
        'SERVICEPERFDATA': lambda v: ('perfdata', v),
        'SERVICECHECKCOMMAND': lambda v: ('check_command', v.split('!', 1)[0]),
        'HOSTCHECKCOMMAND': lambda v: ('check_command', v.split('!', 1)[0])
    }

    find_perfdata = re.compile('([^= ][^=]*)=([^ ]+)').findall

    def _parse_number(self, number_string):
        # Remove anything but digit, comma, period or sign
        no_clutter = re.sub(r'[^\d,.-]', '', number_string)
        last_comma = no_clutter.rfind(',')
        comma_count = no_clutter.count(',')
        last_period = no_clutter.rfind('.')
        period_count = no_clutter.count('.')
        if period_count > 1 and not comma_count or comma_count > 1 and not period_count:
            # Values like 1,000,000; 1.000.000
            return float(no_clutter.replace(',', '').replace('.', ''))
        if last_comma > last_period:
            # Values like 1,0; 1.000,0
            return float(no_clutter.replace('.', '').replace(',', '.'))
        # Values like 1,0; 1,000.0; 1.0
        # Note that values like 1,0 are treated comma-less whereas 1.0 is treated with comma
        return float(no_clutter.replace(',', ''))

    def parse(self, perfdata_line):
        # TODO(el): Units, check_multi, plugin output
        """
        (^|\s|\()(?P<data>-?\d[\d\.\,]*)(\)|\s|$)
        (^|\s|\()(?P<data>-?\d[\d\.\,]*)\s+(?P<uom>[a-zA-Z]+)\b
        (?P<uom>[A-Za-z0-9]{3,})[\=\:]\s+(?P<data>-?\d[\d\.\,]*)
        (^|\s|\()(?P<data>-?\d[\d\.\,]*)(?P<uom>[a-zA-Z\%]{1,3})
        """
        perfdata_line_no_cruft = {}
        tokens = perfdata_line.strip().split('\t')
        for token in tokens:
            try:
                key, value = token.split('::', 1)
            except:
                raise InvalidPerfdata("Invalid performance data: Unable to split token (%s) "
                                      "by double colon (`::`) into key-value pair." % token)
            try:
                key, value = self.__class__._key_extraction_fn[key](value)
            except KeyError:
                # Extraction function for this key not specified.
                # Most likely since the information is not needed.
                continue
            perfdata_line_no_cruft[key] = value
        if ('perfdata' not in perfdata_line_no_cruft or
            'host' not in perfdata_line_no_cruft or
            'state' not in perfdata_line_no_cruft):
            raise InvalidPerfdata("Invalid performance data: Line is missing `host`, `state`, or `perfdata`.")
        #if 'timestamp' not in perfdata_line_no_cruft:
        #   perfdata_line_no_cruft['timestamp'] = time()
        if 'service' not in perfdata_line_no_cruft:
            perfdata_line_no_cruft['service'] = ''
        perfdata = {}
        for label, format in self.find_perfdata(perfdata_line_no_cruft['perfdata']):
            # value[UOM];[warn];[crit];[min];[max]
            # where min and max are set automatically if missing to 0 and 100 respectively if UOM is `%`
            values = format.split(';')
            perfdata[label] = self._parse_number(values[0])
        perfdata_line_no_cruft.pop('perfdata')
        return perfdata_line_no_cruft, perfdata
