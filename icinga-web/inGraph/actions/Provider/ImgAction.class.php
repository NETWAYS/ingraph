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

class inGraph_Provider_ImgAction extends inGraphBaseAction
{
    protected function getData($params)
    {
        if (! is_numeric($params->end)) {
            throw new Exception('Got invalid end time');
        }
        if (! is_numeric($params->start)) {
            throw new Exception('Got invalid start time');
        }

        $rd = new AgaviRequestDataHolder();
        $rd->setParameters(
            array('host' => $params->host, 'service' => $params->service));

        $template = $this->container->createExecutionContainer(
            'inGraph', 'Provider.Template', $rd, 'json',
            'write')->execute()->getContent();
        $template = json_decode($template, true);

        if(array_key_exists('errorMessage', $template)) {
            throw new Exception($template['errorMessage']);
        }

        $query = array();
        foreach($template['content']['series'] as $series) {
            if(!array_key_exists($series['host'], $query)) {
                $query[$series['host']] = array();
            }
            if(!array_key_exists($series['service'], $query[$series['host']])) {
                $query[$series['host']][$series['service']] = array();
            }
            if(!array_key_exists($series['plot'], $query[$series['host']][$series['service']])) {
                $query[$series['host']][$series['service']][$series['plot']] = array();
            }
            if(!in_array($series['type'], $query[$series['host']][$series['service']][$series['plot']])) {
                $query[$series['host']][$series['service']][$series['plot']][] = $series['type'];
            }
        }

        $interval = $this->siftInterval($params->start, $params->end);

        $plots = $this->getBackend()->fetchValues(
            $query, $params->start, $params->end, $interval, 2);

        $data = array();
        foreach($plots['charts'] as $chart) {
            array_walk($chart['data'], array($this, 'ensureTypes'));
            $chart['key'] = $chart['host'] . $chart['service'] .
                            $chart['plot'] . $chart['type'];

            foreach($template['content']['series'] as $seriesCfg) {
                $key = $seriesCfg['host'] . $seriesCfg['service'] .
                       $seriesCfg['plot'] . $seriesCfg['type'];
                if($key === $chart['key']) {
                    $chart['enabled'] = true;
                    $chart = array_merge(
                        $chart,
                        array_diff_key(
                            $seriesCfg,
                            array_fill_keys(array('re'), null)
                        )
                    );
                }
            }
            $data[] = $chart;
        }
        return array(
            'results' => $data,
            'total' => count($data),
            'options' => array_diff_key(
                $template['content'],
                array_fill_keys(array('re', 'series'), null)
            ),
            'start' => $params->start,
            'end' => $params->end,
            'minTimestamp' => $plots['min_timestamp'],
            'maxTimestamp' => $plots['max_timestamp']
        );
    }

    protected function ensureTypes(&$xy)
    {
        $xy = array(
            (int)$xy[0]*1000,
            is_numeric($xy[1]) ? (float)$xy[1] : null
        );
    }

    protected function parseParams($url)
    {
        $parts = preg_split('~/~', $url);
        if (count($parts) < 2) {
            throw new Exception('Invalid call: ' . $url);
        }
        $params = array(
            'host'    => urldecode(array_shift($parts)),
            'service' => urldecode(array_shift($parts))
        );
        while (! empty($parts)) {
            $key = urldecode(array_shift($parts));
            if (empty($parts)) {
                $val = null;
            } else {
                $val = urldecode(array_shift($parts));
            }
            switch($key) {
                case 'start':
                case 'end':
                    $params[$key] = strtotime($val);
                    break;
                default:
                    $params[$key] = $val;
            }
        }
        if (! isset($params['end'])) {
            $params['end'] = time();
        }
        if (! isset($params['start'])) {
            $params['start'] = $params['end'] - 60 * 60 * 24;
        }
        $params['height'] = isset($params['height']) ? (int) $params['height'] : 200;
        $params['width'] = isset($params['width']) ? (int) $params['width'] : 600;

        $small = false;
        if ($params['width'] < 300) { $small = true; }

        $params['options'] = (object) array(
            'width' => $params['width'],
            'height' => $params['height'],
            'legend' => (object) array(
                'show' => true,
                'backgroundOpacity' => 0.4
            ),
            'lines' => (object) array(
                'steps' => true,
                'lineWidth' => 1,
                'fill' => false,
            ),
            'xaxis' => (object) array(
                'show' => ! $small,
                'mode' => 'time',
                'labelWidth' => 50,
                'labelHeight' => 20
            ),
            'yaxis' => (object) array(
                'show' => ! $small,
                'labelWidth' => 50,
                'labelHeight' => 20
            ),
            'grid' => (object) array(
                'show' => ! $small,
                // 'labelMargin' => 1,
                // 'axisMargin' => 1,
                'backgroundColor' => '#fff',
                'borderWidth' => 1,
                'borderColor' => 'rgba(255, 255, 255, 0)',
                'canvasText' => (object) array(
                    'show' => ! $small
                    // 'font' =>  'sans 9px'
                ),
                'clickable' => false,
                'hoverable' => false,
                'autoHighlight' => false
            )
        );

        return (object) $params;
    }

    public function executeRead(AgaviRequestDataHolder $rd)
    {
        $params = $this->parseParams($rd->getParameter('param'));
        try {
            $params->flot = $this->getData($params);
        } catch(Exception $e) {
            return $this->setError($e->getMessage());
        }

        $this->setAttribute('params', $params);
        return $this->getDefaultViewName();
    }
}
