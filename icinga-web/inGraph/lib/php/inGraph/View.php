<?php

/**
 * inGraph_View
 *
 * @copyright Copyright (c) 2012 Netways GmbH <support@netways.de>
 * @author Eric Lippmann <eric.lippmann@netways.de>
 * @package inGraph
 * @license http://www.gnu.org/licenses/gpl-3.0.html GNU General Public License
 */
class inGraph_View extends inGraph_AbstractTemplate
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
