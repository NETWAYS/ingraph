<?php

use Graphite\Client as Graphite;

class inGraph_Backend_Graphite extends Graphite implements inGraph_Backend
{
    private $hostFormat;

    private $serviceFormat;

    private $metricFormat;

    private $pattern;

    private $metricsCache = array();

    private $staticMetricsPath;

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
        $this->staticMetricsPath = $config['staticMetricsPath'];
    }

    public function fetchHosts($pattern, $limit = null, $offset = 0)
    {
        $metrics = $this->findMetric(
            str_replace('<host>', $this->escape($pattern), $this->hostFormat),
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
                array($this->escape($hostPattern), $this->escape($servicePattern)),
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
        $hostPattern, $servicePattern, $parentServicePattern, $plotPattern = '*', $limit = null, $offset = 0
    ) {
        $metrics = $this->findMetric(
            str_replace(
                array('<host>', '<service>', '<metric>'),
                array($this->escape($hostPattern), $this->escape($servicePattern), $this->escape($plotPattern)),
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
                'plot_id'           => sprintf(
                    '%s - %s - %s', $matches['host'], $matches['service'], $matches['metric']),
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
        $comments = array();
        foreach ($query as $spec) {
            if ($spec['type'] !== 'avg') {
                $data = array();
                $jsonPath = $this->staticMetricsPath . '/' . base64_encode($spec['host'])
                    . ($spec['service'] === '' ? '' : '/' . base64_encode($spec['service']))
                    . '/' . base64_encode($spec['plot']) . '.json';
                if (!array_key_exists($spec['host'], $this->metricsCache)) {
                    $this->metricsCache[$spec['host']] = array();
                }
                if (!array_key_exists($spec['service'], $this->metricsCache[$spec['host']])) {
                    $this->metricsCache[$spec['host']][$spec['service']] = array();
                }
                if (!array_key_exists($spec['plot'], $this->metricsCache[$spec['host']][$spec['service']])) {
                    if (is_readable($jsonPath)) {
                        $this->metricsCache[$spec['host']][$spec['service']][$spec['plot']] = json_decode(
                            file_get_contents($jsonPath), true
                        );
                    } else {
                        continue;
                    }
                }
                $jsonData = $this->metricsCache[$spec['host']][$spec['service']][$spec['plot']];
                foreach ($jsonData as $jsonMetric) {
                    $data[] = array($jsonMetric['timestamp'], $jsonMetric[$spec['type']]);
                }
                $charts[] = array(
                    'label' => $spec['plot'] . ' ' . $spec['type'],
                    'data'  => $data
                ) + $spec;
                continue;
            }
            $target = sprintf(
                'legendValue(substr(keepLastValue(%s)), "last", "avg", "min", "max")',
                str_replace(
                    array('<host>', '<service>', '<metric>'),
                    array($this->escape($spec['host']), $this->escape($spec['service']), $this->escape($spec['plot'])),
                    $this->metricFormat
                )
            );
            foreach ($this->fetchMetric($target, $start, $end) as $metric) {
                $charts[] = array(
                    'plot_id'   => sprintf(
                        '%s - %s - %s - %s', $spec['host'], $spec['service'], $spec['plot'], $spec['type']),
                    'label'     => $metric['target'],
                    'data'      => array_map('array_reverse', $metric['datapoints'])
                ) + $spec;
                $firstDatapoint = reset($metric['datapoints']);
                if ($firstDatapoint === false) {
                    continue;
                }
                $lastDatapoint = end($metric['datapoints']);
                $comments = array_merge(
                    $comments,
                    $this->fetchComments($spec['host'], $spec['service'], $firstDatapoint[1], $lastDatapoint[1])
                );
            }
        }
        return array(
            'comments'      => $comments,
            'statusdata'    => array(),
            'charts'        => $charts
        );
    }

    public function fetchComments($host, $service, $start = null, $end = null)
    {
        $conn = AgaviContext::getInstance()->getDatabaseManager()->getDatabase('ingraph')->getConnection();
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $stmt = $conn->prepare(
            'SELECT id, host, service, UNIX_TIMESTAMP(time) as timestamp, author, text FROM comment WHERE host = :host'
            . ' AND service = :service AND time BETWEEN FROM_UNIXTIME(:start) AND FROM_UNIXTIME(:end)'
        );
        $stmt->execute(array(
            ':host'     => $host,
            ':service'  => $service,
            ':start'    => $start,
            ':end'      => $end
        ));
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createComment($host, $service, $time, $author, $text)
    {
        $conn = AgaviContext::getInstance()->getDatabaseManager()->getDatabase('ingraph')->getConnection();
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $stmt = $conn->prepare(
            'INSERT INTO comment (host, service, time, author, text) VALUES (:host, :service, FROM_UNIXTIME(:time),'
            . ' :author, :text)'
        );
        $stmt->execute(array(
            ':host'     => $host,
            ':service'  => $service,
            ':time'     => $time,
            ':author'   => $author,
            ':text'     => $text
        ));
    }

    public function updateComment($id, $host, $service, $time, $author, $text)
    {
        $conn = AgaviContext::getInstance()->getDatabaseManager()->getDatabase('ingraph')->getConnection();
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $stmt = $conn->prepare(
            'UPDATE comment SET host = :host, service = :service, time = FROM_UNIXTIME(:time), author = :author,'
            . ' :text = text) WHERE id = :id'
        );
        $stmt->execute(array(
            ':id'       => $id,
            ':host'     => $host,
            ':service'  => $service,
            ':time'     => $time,
            ':author'   => $author,
            ':text'     => $text
        ));
    }

    public function deleteComment($id)
    {
        $conn = AgaviContext::getInstance()->getDatabaseManager()->getDatabase('ingraph')->getConnection();
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $stmt = $conn->prepare(
            'DELETE FROM comment WHERE id = :id'
        );
        $stmt->execute(array(
            ':id' => $id
        ));
    }

    private function escape($subject)
    {
        return str_replace(array('/', ' '), '_', $subject);
    }
}
