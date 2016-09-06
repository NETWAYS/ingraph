<?php

use Graphite\Client as Graphite;

class inGraph_Backend_Graphite extends Graphite implements inGraph_Backend
{
    private $hostFormat;

    private $serviceFormat;

    private $metricFormat;

    private $hostPattern;

    private $servicePattern;

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
        $this->hostPattern = sprintf('/%s(?:\.(?P<type>[[:word:]-]+))?/',
            str_replace(
                array('<host>', '<service>', '<metric>'),
                array('(?P<host>[[:word:]-]+)', '(?P<service>[[:word:]-]+)', '(?P<metric>[[:word:]-]+)'),
                addcslashes($this->hostFormat . '.<metric>', '.')
            )
        );
        $this->servicePattern = sprintf('/%s(?:\.(?P<type>[[:word:]-]+))?/',
            str_replace(
                array('<host>', '<service>', '<metric>'),
                array('(?P<host>[[:word:]-]+)', '(?P<service>[[:word:]-]+)', '(?P<metric>[[:word:]-]+)'),
                addcslashes($this->serviceFormat . '.<metric>', '.')
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
            if (! (bool) $metric['is_leaf']) {
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
            if (! (bool) $metric['is_leaf']) {
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
        $plotPattern = $plotPattern !== null ? $plotPattern : '*';
        if ($servicePattern !== null) {
            $metricPattern = str_replace(
                array('<host>', '<service>', '<metric>'),
                array($this->escape($hostPattern), $this->escape($servicePattern), $this->escape($plotPattern)),
                $this->metricFormat
            );
            $pattern = $this->servicePattern;
        } else {
            $metricPattern =  str_replace(
                array('<host>', '<metric>'),
                array($this->escape($hostPattern), $this->escape($plotPattern)),
                str_replace('.<service>', '', $this->metricFormat)
            );
            $pattern = $this->hostPattern;
        }
        $metrics = $this->findMetric(
            $metricPattern,
            $limit,
            $offset
        );
        $plots = array();
        foreach ($metrics['metrics'] as $metric) {
            if (! (bool) $metric['is_leaf']) {
                continue;
            }

            preg_match($pattern, $metric['path'], $matches);

            $plots[] = array(
                'plot_id'           => ($servicePattern !== null ?
                    sprintf(
                        '%s - %s - %s', $matches['host'], $matches['service'], $matches['metric']
                    )
                :
                    sprintf(
                        '%s - %s', $matches['host'], $matches['metric']
                    )
                ),
                'plot'              => $matches['metric'],
                'host'              => $matches['host'],
                'service'           => $servicePattern !== null ? $matches['service'] : null,
                'parent_service'    => null
            );
        }
        return array(
            'total' => $metrics['total'],
            'plots' => $plots
        );
    }

    public function fetchStaticMetric($host, $service, $plot, $type)
    {
        switch ($type) {
            case 'min':
                $type = 'lower_limit';
                break;
            case 'max':
                $type = 'upper_limit';
                break;
        }
        $jsonPath = $this->staticMetricsPath . '/' . base64_encode($host)
            . ($service === '' ? '' : '/' . base64_encode($service))
            . '/' . base64_encode($plot) . '.json';
        if (! is_readable($jsonPath)) {
            return null;
        }
        if (! array_key_exists($host, $this->metricsCache)) {
            $this->metricsCache[$host] = array();
        }
        if (! array_key_exists($service, $this->metricsCache[$host])) {
            $this->metricsCache[$host][$service] = array();
        }
        if (! array_key_exists($plot, $this->metricsCache[$host][$service])) {
            $this->metricsCache[$host][$service][$plot] = json_decode(
                file_get_contents($jsonPath), true
            );
        }
        $metric = array();
        $jsonData = $this->metricsCache[$host][$service][$plot];
        foreach ($jsonData as $jsonMetric) {
            $metric[] = array($jsonMetric['timestamp'], $jsonMetric[$type]);
        }
        return $metric;
    }

    public function fetchValues($query, $start = null, $end = null)
    {
        $charts = array();
        $comments = array();
        foreach ($query as $spec) {
            if (! isset($spec['service'])) {
                $spec['service'] = '';
            }
            if (isset($spec['target'])) {
                $plotId = md5($spec['target']);
                $self = $this;
                $target = preg_replace_callback(
                    $this->servicePattern,
                    function ($match) use ($self) {
                        if (array_key_exists('type', $match)) {
                            $metric = $self->fetchStaticMetric(
                                $match['host'], $match['service'], $match['metric'], $match['type']
                            );
                            if ($metric !== null) {
                                $metric = end($metric);
                                return $metric[1];
                            }
                        }
                        return $match[0];
                    },
                    $spec['target']
                );
            } else {
                // TODO(el): Don't escape?
                $host = $this->escape($spec['host']);
                $service = $this->escape($spec['service']);
                $plot = $this->escape($spec['plot']);
                $plotId = sprintf(
                    '%s - %s - %s - %s', $host, $service, $plot, $spec['type']);
                );
                if ($spec['type'] !== 'avg') {
                    $metric = $this->fetchStaticMetric($host, $service, $plot, $spec['type']);
                    if ($metric !== null) {
                        if ($metric[0][0] < $start) {
                            array_unshift($metric, array($start, $metric[0][1]));
                        }
                        $last = end($metric);
                        if ($last[0] < $end) {
                            $metric[] = array($end, $last[1]);
                        }
                        $charts[] = array(
                                'plot_id'   => $plotId,
                                'label'     => $spec['plot'] . ' ' . $spec['type'],
                                'data'      => $metric
                            ) + $spec;
                    }
                    continue;
                }
                if (! empty($spec['service'])) {
                    $path = str_replace(
                        array('<host>', '<service>', '<metric>'),
                        array(
                            $host,
                            $service,
                            $plot
                        ),
                        $this->metricFormat
                    );
                } else {
                    $path = str_replace(
                        array('<host>', '<metric>'),
                        array($this->escape($spec['host']), $this->escape($spec['plot'])),
                        str_replace('.<service>', '', $this->metricFormat)
                    );
                }
                $target = sprintf(
                    'legendValue(substr(keepLastValue(%s)), "last", "avg", "min", "max")',
                    $path
                );
            }
            foreach ($this->fetchMetric($target, $start, $end) as $metric) {
                $charts[] = array(
                    'plot_id'   => $plotId,
                    'label'     => $metric['target'],
                    'data'      => array_map('array_reverse', $metric['datapoints'])
                ) + $spec;
                $firstDatapoint = reset($metric['datapoints']);
                if ($firstDatapoint === false) {
                    continue;
                }
                $lastDatapoint = end($metric['datapoints']);
                if (! isset($spec['target'])) {
                    $comments = array_merge(
                        $comments,
                        $this->fetchComments($spec['host'], $spec['service'], $firstDatapoint[1], $lastDatapoint[1])
                    );
                }
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
            'INSERT INTO `comment` (host, service, time, author, text) VALUES (:host, :service, FROM_UNIXTIME(:time),'
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
            'UPDATE `comment` SET host = :host, service = :service, time = FROM_UNIXTIME(:time), author = :author,'
            . ' text = :text WHERE id = :id'
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

    public function escape($subject)
    {
        return str_replace(array('/', ' ', '.'), '_', $subject);
    }

    /**
     * {@inheritdoc}
     */
    public function getName()
    {
        return 'graphite';
    }
}
