<?php

class inGraph_BackendModel extends inGraphBaseModel implements AgaviISingletonModel
{
    public function fetchHosts($hostPattern = '%', $offset = 0, $limit = 20)
    {
        $hosts = $this->backend->fetchHosts($hostPattern, $limit, $offset);
        return array(
            'hosts' => $hosts['hosts'],
            'total' => $hosts['total']
        );
    }

    public function fetchServices($hostPattern = '%', $servicePattern = '%',
                                  $offset = 0, $limit = 20)
    {
        $services = $this->backend->fetchServices($hostPattern, $servicePattern, $limit, $offset);
        $flat = array();
        foreach ($services['services'] as $service) {
            if ($service['service'] === '') {
                // Exclude the host chart as it is not displayed in the icinga-web module too
                continue;
            }
            if ($service['parent_service'] !== null) {
                $flat[] = array(
                    'name' => $service['parent_service'] . ' - '
                        . $service['service'],
                    'service' => $service['service'],
                    'parentService' => $service['parent_service']
                );
            } else {
                $flat[] = array(
                    'name' => $service['service'],
                    'service' => $service['service']
                );
            }
        }

        return array(
            'services' => $flat,
            'total' => $services['total']
        );
    }

    public function fetchPlots($hostName='%', $serviceName='',
                               $parentServiceName=null, $plotName=null,
                               $offset=0, $limit=20
    ) {
        return $this->backend->fetchPlots($hostName, $serviceName,
                                          $parentServiceName, $plotName,
                                          $limit, $offset);
    }

    public function fetchValues($query, $start = null, $end = null,
                                $interval = null, $nullTolerance = 0)
    {
        return $this->backend->fetchValues($query, $start, $end, $interval,
                                           $nullTolerance);
    }

    public function createComment($host, $service, $time, $comment)
    {
        $author = 'ingraph';
        // parent_service = null
        return $this->backend->createComment($host, $service, $time, $author, $comment);
    }

    public function updateComment($id, $host, $service, $time, $comment)
    {
        $author = 'ingraph';
        // parent_service = null
        return $this->backend->updateComment($id, $host, $service, $time, $author, $comment);
    }

    public function deleteComment($id)
    {
        return $this->backend->deleteComment($id);
    }

    public function fetchIntervals()
    {
        return  $this->backend->fetchIntervals();
    }
}
