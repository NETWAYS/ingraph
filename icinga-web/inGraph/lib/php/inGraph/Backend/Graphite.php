<?php

use Graphite\Client as Graphite;

class inGraph_Backend_Graphite extends Graphite implements inGraph_Backend
{
    private $hostFormat;

    private $serviceFormat;

    private $metricFormat;

    private $pattern;

    public function __construct(array $config = array())
    {
        parent::__construct($config['serverAddress']);
        $this->hostFormat = substr(
            $config['namingScheme'],
            0,
            strpos($config['namingScheme'], '<host>')
        ) . '<host>';
        $this->serviceFormat = substr(
            $config['namingScheme'],
            0,
            strpos($config['namingScheme'], '<service>')
        )  . '<service>';
        $this->metricFormat = substr(
            $config['namingScheme'],
            0,
            strpos($config['namingScheme'], '<metric>')
        ) . '<metric>';
        $this->pattern = sprintf('/%s/',
            str_replace(
                array('<host>', '<service>', '<metric>'),
                array('(?P<host>[[:word:]-]+)', '(?P<service>[[:word:]-]+)', '(?P<metric>[[:word:]-]+)'),
                $this->metricFormat
            )
        );
    }

    public function fetchHosts($pattern, $limit = null, $offset = 0)
    {
        $metrics = $this->findMetric(
            str_replace('<host>', $pattern, $this->hostFormat),
            $limit,
            $offset);
        $hosts = array();
        foreach ($metrics['metrics'] as $metric) {
            if ((bool) $metric['is_leaf'] === false) {
                $hosts[] = array('host' => $metric['name']);
            }
        }
        return array(
            'total' => $metrics['total'],
            'hosts' => $hosts
        );
    }

    public function fetchServices($hostPattern, $servicePattern, $limit = null, $offset = 0)
    {
        $metrics = $this->findMetric(
            str_replace(
                array('<host>', '<service>'),
                array($hostPattern, $servicePattern),
                $this->serviceFormat
            ),
            $limit,
            $offset
        );
        $services = array();
        foreach ($metrics['metrics'] as $metric) {
            if ((bool) $metric['is_leaf'] === false) {
                $services[] = array(
                    'service'           => $metric['name'],
                    'parent_service'    => null
                );
            }
        }
        return array(
            'total'     => $metrics['total'],
            'services'  => $services
        );
    }

    public function fetchPlots(
        $hostPattern, $servicePattern, $parentServicePattern, $plotPattern, $limit = null, $offset = 0
    ) {
        $metrics = $this->findMetric(
            str_replace(
                array('<host>', '<service>', '<metric>'),
                array($hostPattern, $servicePattern, $plotPattern),
                $this->metricFormat
            ),
            $limit,
            $offset
        );
        $plots = array();
        foreach ($metrics['metrics'] as $metric) {
            // TODO(el): Prove whether metric is leaf? Because in case metrics have their aggregation suffixed,
            // e.g. {metric}.average they're not leaves.
            preg_match($this->pattern, $metric['path'], $matches);
            $plots[] = array(
                'plot'              => $matches['metric'],
                'host'              => $matches['host'],
                'service'           => $matches['service'],
                'parent_service'    => null
            );
        }
        return array(
            'total' => $metrics['total'],
            'plots' => $plots
        );
    }

    public function fetchValues($query, $start = null, $end = null)
    {
        $charts = array();
        foreach ($query as $spec) {
            if ($spec['type'] !== 'avg') {
                continue;
            }
            $target = sprintf(
                'legendValue(substr(keepLastValue(%s)), "last", "avg", "min", "max")',
                str_replace(
                    array('<host>', '<service>', '<metric>'),
                    array($spec['host'], $spec['service'], $spec['plot']),
                    $this->metricFormat
                )
            );
            foreach ($this->fetchMetric($target, $start, $end) as $metric) {
                $charts[] = array(
                    'label' => $metric['target'],
                    'data'  => array_map('array_reverse', $metric['datapoints'])
                ) + $spec;
            }
        }
        return array(
            'comments'      => array(),
            'statusdata'    => array(),
            'charts'        => $charts
        );
    }

    public function createComment()
    {

    }

    public function updateComment()
    {

    }

    public function deleteComment()
    {

    }
}
