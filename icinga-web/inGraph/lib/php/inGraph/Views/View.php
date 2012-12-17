<?php
/*
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of inGraph.
 *
 * inGraph is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * inGraph is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for mor
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * inGraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

class inGraph_Views_View extends inGraph_Templates_TemplateAbstract
{
    /**
     * Compare template series with existing plots and add their information
     * if they belong together
     *
     * @param array &$series
     * @param string $host
     * @param array $plots
     * @return boolean
     */
    public function compileSingleSeries(&$series, $host, array $plots)
    {
        $match = false;

        foreach ($plots as $index => $plot) {
            $plotName = $series['service'] != $plot['service']
                      ? ($plot['service'] . '::' . $plot['plot'])
                      : $plot['plot'];
            if (preg_match($series['re'], $plotName)) {
                if ( ! array_key_exists('type', $series)) {
                    $series['type'] = 'avg';
                }

                if (is_array($series['type'])) {
                    $series['type'] = $series['type'][0];
                }

                $series = array_merge($series, array(
                    'host' => $host,
                    'service' => $plot['service'],
                    'parentService' => $plot['parent_service'],
                    'plot' => $plot['plot']
                ));

                $match = $index;
                break;
            }
        }

        if ($match === false) {
            return false;
        }


        $series['group'] = $series['host'];
        if ($series['service']) {
            $series['group'] .= ' - ' . $series['service'];
        }
        $series['group'] .= ' - ' . $series['plot'];

        $series['plot_id'] = $series['group'] . ' - ' . $series['type'];


        return $match;
    }
}
