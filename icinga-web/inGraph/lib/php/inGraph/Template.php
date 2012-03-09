<?php

/**
 * inGraph_Template
 *
 * @copyright Copyright (c) 2012 Netways GmbH <support@netways.de>
 * @author Eric Lippmann <eric.lippmann@netways.de>
 * @package inGraph
 * @license http://www.gnu.org/licenses/gpl-3.0.html GNU General Public License
 */
class inGraph_Template extends inGraph_AbstractTemplate
{
    /**
     * Check whether the regex of this template matches a service
     *
     * @param string $service
     * @throws inGraph_Exception
     * @return bool <tt>true</tt> on match else <tt>false</tt>
     */
    public function matches($service)
    {
        if (false === ($count = preg_match($this->content['re'], $service))) {
            $msg = 'inGraph_Template: failed to preg_match ' . $fileInfo->getBaseName();
            error_log($msg, 0);
            throw new inGraph_Exception($msg);
        }
        return $count === 1 ? true : false;
    }

    /**
     * Compare template series with existing plots and add their information
     * if they belong together
     *
     * @param array &$series
     * @param string $host
     * @param array $plots
     * @return void
     */
    protected function compileSeries(&$series, $host, array $plots)
    {
        $compiled = array();
        foreach ($series as $item) {
            foreach ($plots as $plot) {
                if (preg_match($item['re'], $plot['plot'])) {
                    if ( ! array_key_exists('type', $item)) {
                        $item['type'] = 'avg';
                    } elseif (is_array($item['type'])) {
                        foreach ($item['type'] as $type) {
                            $compiled[] = array_merge($item, array(
                                'host' => $host,
                                'service' => $plot['service'],
                                'plot' => $plot['plot'],
                                'type' => $type
                            ));
                        }
                    } else {
                        $compiled[] = array_merge($item, array(
                            'host' => $host,
                            'service' => $plot['service'],
                            'plot' => $plot['plot']
                        ));
                    }
                }
            }
        }

        foreach ($compiled as &$tseries) {
            $tseries['group'] = $tseries['host'];
            if ($tseries['service']) {
                $tseries['group'] .= ' - ' . $tseries['service'];
            }
            $tseries['group'] .= ' - ' . $tseries['plot'];

            $tseries['plot_id'] = $tseries['group'] . ' - ' . $tseries['type'];
        }

        $series = $compiled;
    }

    /**
     * Add host, service, plot and type to their respective series
     *
     * @param string $host hostname
     * @param array $plots as returned from inGraph_Backend::fetchPlots
     */
    public function compile($host, array $plots)
    {
        $this->compileSeries($this->content['series'], $host, $plots);

        foreach ($this->content['panels'] as &$panel) {
            if (array_key_exists('series', $panel)) {
                $this->compileSeries($panel['series'], $host, $plots);
            }
        }
    }
}
