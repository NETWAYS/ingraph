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
        'HOSTSTATE': lambda v: ('state', {'UP': 0, 'DOWN': 1, 'UNREACHABLE': 2}.get(v)),
        'SERVICESTATE': lambda v: ('state', {'OK': 0, 'WARNING': 1, 'CRITICAL': 2, 'UNKNOWN': 3}.get(v)),
        'HOSTSTATEID': lambda v: ('state', v),
        'SERVICESTATEID': lambda v: ('state', v),
        'HOSTPERFDATA': lambda v: ('perfdata', v),
        'SERVICEPERFDATA': lambda v: ('perfdata', v),
        'SERVICECHECKCOMMAND': lambda v: ('check_command', v.split('!', 1)[0]),
        'HOSTCHECKCOMMAND': lambda v: ('check_command', v.split('!', 1)[0])
    }

    find_perfdata = re.compile('(?:([^: ]+::[^:]+)::)?([^= ]+)=\s*([+-]?[0-9e,.]+)').findall

    match_quantitative_value = re.compile('(?P<value>[+-]?[0-9e,.]+)\s*(?P<uom>.*?)').match

    match_range = re.compile('(?P<inside>@(?=[^:]+:))?(?P<start>[^:]+(?=:))?:?(?P<end>(?(start)[^:]+|(?<!:)[^:]+))?').match

    binary_suffix = {
        'B': 1,
        'KB': 1 << 10,
        'MB': 1 << 20,
        'GB': 1 << 30,
        'TB': 1 << 40,
        'PB': 1 << 50,
        'EB': 1 << 60
    }

    decimal_suffix = {
        'K': 1000 ** 1,
        'M': 1000 ** 2,
        'G': 1000 ** 3,
        'T': 1000 ** 4,
        'P': 1000 ** 5,
        'E': 1000 ** 6
    }

    time_suffix = {
        's': 1,
        'ms': 10 ** (-3),
        'us': 10 ** (-6)
    }

    def _parse_decimal(self, value):
        last_comma = value.rfind(',')
        comma_count = value.count(',')
        last_period = value.rfind('.')
        period_count = value.count('.')
        if period_count > 1 and not comma_count or comma_count > 1 and not period_count:
            # Values like 1,000,000; 1.000.000
            value = float(value.replace(',', '').replace('.', ''))
        elif last_comma > last_period:
            # Values like 1,0; 1.000,0
            value = float(value.replace('.', '').replace(',', '.'))
        else:
            # Values like 1,0; 1,000.0; 1.0
            # Note that values like 1,0 are treated comma-less whereas 1.0 is treated with comma
            value = float(value.replace(',', ''))
        return value

    def _parse_quantitative_value(self, value_string):
        match = self.__class__.match_quantitative_value(value_string)
        sfx = match.group('uom').upper()
        if sfx == '%':
            base = 1
            uom = 'percent'
        elif sfx == 'C':
            base = 1
            uom = 'counter'
        elif sfx in self.__class__.binary_suffix:
            base = self.__class__.binary_suffix[sfx]
            uom = 'byte'
        elif sfx in self.__class__.decimal_suffix:
            base = self.__class__.decimal_suffix[sfx]
            uom = 'raw'
        elif sfx in self.__class__.time_suffix:
            base = self.__class__.time_suffix[sfx]
            uom = 'time'
        else:
            base = 1
            uom = 'raw'
        return match.group('value'), uom, base

    def _parse_threshold(self, value_string):
        match = self.__class__.match_range(value_string)
        if not match or not match.group('start') and not match.group('end'):
            raise InvalidPerfdata("Invalid performance data: warn or crit (%s) are not in the range format. "
                                  "Please refer to http://nagiosplug.sourceforge.net/developer-guidelines.html#THRESHOLDFORMAT "
                                  "for more information." % value_string)
        return match.group('start'), match.group('end'), 'inside' if match.group('inside') else 'outside'

    def parse(self, perfdata_line):
        # TODO(el): Parse plugin output, save check_command, save state
        """
        (^|\s|\()(?P<data>-?\d[\d\.\,]*)(\)|\s|$)
        (^|\s|\()(?P<data>-?\d[\d\.\,]*)\s+(?P<uom>[a-zA-Z]+)\b
        (?P<uom>[A-Za-z0-9]{3,})[\=\:]\s+(?P<data>-?\d[\d\.\,]*)
        (^|\s|\()(?P<data>-?\d[\d\.\,]*)(?P<uom>[a-zA-Z\%]{1,3})
        """
        perfdata_no_cruft = {}
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
            perfdata_no_cruft[key] = value
        if ('perfdata' not in perfdata_no_cruft or
            'host' not in perfdata_no_cruft or
            'state' not in perfdata_no_cruft):
            raise InvalidPerfdata("Invalid performance data: Line is missing `host`, `state`, or `perfdata`.")
        if 'service' not in perfdata_no_cruft:
            perfdata_no_cruft['service'] = ''
        perfdata = []
        child_service = None
        for potential_child_service, plot_label, format in self.find_perfdata(perfdata_no_cruft['perfdata']):
            if potential_child_service:
                child_service = potential_child_service
            # Trainling unfilled semicolons can be dropped
            values = re.sub(r';+$', '', format).split(';')
            # value[UOM];[warn];[crit];[min];[max]
            # where min and max are set automatically if missing to 0 and 100 respectively if UOM is `%`
            try:
                value, uom, base = self._parse_quantitative_value(values[0])
                value = self._parse_decimal(value)
                value *= base
            except AttributeError:
                raise InvalidPerfdata("Invalid performance data: Measurement `%s=%s` does not contain a valid value." % (plot_label, ' '.join(values)))
            try:
                warn_lower, warn_upper, warn_type = self._parse_threshold(values[1])
                if warn_lower:
                    warn_lower = self._parse_decimal(warn_lower)
                    warn_lower *= base
                if warn_upper:
                    warn_upper = self._parse_decimal(warn_upper)
                    warn_upper *= base
            except IndexError:
                warn_lower, warn_upper, warn_type = None, None, None
            try:
                crit_lower, crit_upper, crit_type = self._parse_threshold(values[2])
                if crit_lower:
                    crit_lower = self._parse_decimal(crit_lower)
                    crit_lower *= base
                if crit_upper:
                    crit_upper = self._parse_decimal(crit_upper)
                    crit_upper *= base
            except IndexError:
                crit_lower, crit_upper, crit_type = None, None, None
            try:
                min_ = self._parse_decimal(values[3]) * base
            except IndexError:
                if uom == 'percent':
                    min_ = float(0)
                else:
                    min_ = None
            try:
                max_ = self._parse_decimal(values[4]) * base
            except IndexError:
                if uom == 'percent':
                    max_ = float(100)
                else:
                    max_ = None
            perfdata.append({
                'label': plot_label,
                'child_service': child_service,
                'value': value,
                'uom': uom,
                'lower_limit': min_,
                'upper_limit': max_,
                'warn_lower': warn_lower,
                'warn_upper': warn_upper,
                'warn_type': warn_type,
                'crit_lower': crit_lower,
                'crit_upper': crit_upper,
                'crit_type': crit_type
            })
        perfdata_no_cruft.pop('perfdata')
        return perfdata_no_cruft, perfdata